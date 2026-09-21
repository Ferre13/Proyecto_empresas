from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from core.config import settings
from core.database import get_db
from models.user import User
from models.tenant import Tenant

security = HTTPBearer()

def get_current_user_token_payload(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """
    Decodifica y verifica la firma del JWT usando el secreto de Supabase.
    En modo TEST, permite un token 'DEBUG_TOKEN' para facilitar el desarrollo.
    """
    token = credentials.credentials
    
    # PASE VIP PARA TESTEO: Si el token es literal 'DEBUG_TOKEN' y estamos en modo test
    if token == "DEBUG_TOKEN" and getattr(settings, "SKIP_BILLING_CHECK", False):
        return {
            "sub": "test_user_id",
            "email": "test@example.com",
            "role": "authenticated"
        }

    try:
        # Supabase firma los JWT con HS256 y el JWT_SECRET del proyecto
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False} # Supabase a veces usa aud='authenticated'
        )
        return payload
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token inválido o expirado: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

def get_current_user(
    payload: dict = Depends(get_current_user_token_payload),
    db: Session = Depends(get_db)
) -> User:
    """
    Obtiene el usuario de la base de datos a partir del 'sub' (ID) del token.
    """
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token no contiene ID de usuario (sub)",
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="El usuario no existe en el sistema",
        )
    return user

def get_current_tenant(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> Tenant:
    """
    Obtiene el Tenant (empresa) asociado al usuario actual.
    Pilar 1: Este tenant_id se usará obligatoriamente en todas las consultas posteriores.
    """
    tenant = db.query(Tenant).filter(Tenant.id == user.tenant_id).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="El usuario no está asociado a ninguna empresa (Tenant)",
        )
    return tenant

def require_active_subscription(tenant: Tenant = Depends(get_current_tenant)) -> Tenant:
    """
    Capa 3 de Seguridad: Bloquea el acceso si la empresa no ha pagado.
    En modo desarrollo, podemos saltar esta comprobación con una variable de entorno.
    """
    # Si estamos testeando, saltamos el muro de Stripe
    if getattr(settings, "SKIP_BILLING_CHECK", False):
        return tenant

    if not tenant.subscription_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Suscripción inactiva. Por favor, regularice su pago en el portal de facturación.",
        )
    return tenant
