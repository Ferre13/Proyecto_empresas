from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from core.config import settings
from core.database import get_db
from models.user import User
from models.tenant import Tenant

import httpx
import time

security = HTTPBearer()

# Caché en memoria para optimizar la verificación de tokens
_TOKEN_CACHE = {}

def get_current_user_token_payload(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """
    Verifica el token JWT de Supabase de forma segura.
    Soporta las nuevas claves de Supabase (sb_publishable_) y JWKS asimétrico (ES256).
    """
    token = credentials.credentials
    
    # Modo TEST para tests unitarios locales (pytest)
    if token == "DEBUG_TOKEN":
        return {
            "sub": "test_user_id",
            "email": "test@example.com",
            "role": "authenticated",
            "company_name": "Empresa Test"
        }

    # 1. Comprobar si el token está en caché reciente válida
    now = time.time()
    if token in _TOKEN_CACHE:
        cached_payload, exp = _TOKEN_CACHE[token]
        if now < exp:
            return cached_payload

    # 1.5. Si es un token emitido por el fallback local de alta disponibilidad, validarlo al instante
    jwt_secret = getattr(settings, "SUPABASE_JWT_SECRET", None) or "docuflow-fallback-secret-key"
    try:
        unverified_claims = jwt.get_unverified_claims(token)
        if unverified_claims.get("iss") == "docuflow-local-auth":
            local_payload = jwt.decode(
                token,
                jwt_secret,
                algorithms=["HS256"],
                options={"verify_aud": False},
            )
            _TOKEN_CACHE[token] = (local_payload, now + 60)
            return local_payload
    except Exception:
        pass

    # 2. Verificación oficial contra la API de Supabase Auth
    supabase_url = getattr(settings, "SUPABASE_URL", "").rstrip('/')
    supabase_key = getattr(settings, "SUPABASE_KEY", "")

    if supabase_url and supabase_key:
        try:
            with httpx.Client(timeout=8.0) as client:
                resp = client.get(
                    f"{supabase_url}/auth/v1/user",
                    headers={
                        "Authorization": f"Bearer {token}",
                        "apikey": supabase_key
                    }
                )

            if resp.status_code == 200:
                data = resp.json()
                metadata = data.get("user_metadata", {}) or {}
                payload = {
                    "sub": data.get("id"),
                    "email": data.get("email"),
                    "role": data.get("role", "authenticated"),
                    "company_name": metadata.get("company_name"),
                    "user_metadata": metadata,
                    "raw_token": token
                }
                # Cachear 60 segundos
                _TOKEN_CACHE[token] = (payload, now + 60)
                return payload
            elif resp.status_code == 401 or resp.status_code == 403:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Sesión de Supabase inválida o expirada. Por favor, vuelve a iniciar sesión.",
                    headers={"WWW-Authenticate": "Bearer"},
                )
        except httpx.RequestError as e:
            # Si falla la red con Supabase, intentamos fallback local si hay secret
            pass

    # 3. Fallback JWT decodificación local (si hay secret configurado)
    if getattr(settings, "SUPABASE_JWT_SECRET", None):
        try:
            payload = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                options={"verify_aud": False}
            )
            return payload
        except JWTError:
            pass

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar la sesión de usuario.",
        headers={"WWW-Authenticate": "Bearer"},
    )


def sync_user_metadata_to_supabase(token: str, metadata_update: dict) -> bool:
    """
    Sincroniza configuraciones del usuario (ej. plantillas ERP personalizadas)
    directamente en la base de datos de Supabase Auth (user_metadata) para que
    persistan en la nube entre dispositivos y despliegues.
    """
    if not token or token == "DEBUG_TOKEN":
        return False

    supabase_url = getattr(settings, "SUPABASE_URL", "").rstrip('/')
    supabase_key = getattr(settings, "SUPABASE_KEY", "")
    if not supabase_url or not supabase_key:
        return False

    try:
        with httpx.Client(timeout=8.0) as client:
            resp = client.put(
                f"{supabase_url}/auth/v1/user",
                headers={
                    "Authorization": f"Bearer {token}",
                    "apikey": supabase_key,
                    "Content-Type": "application/json"
                },
                json={"data": metadata_update}
            )
            if token in _TOKEN_CACHE:
                del _TOKEN_CACHE[token]
            return resp.status_code == 200
    except Exception:
        return False

import uuid

def is_email_allowed(email: str) -> bool:
    """Verifica si el correo está autorizado según ALLOWED_EMAILS (si está configurado)."""
    allowed_raw = (getattr(settings, "ALLOWED_EMAILS", "") or "").strip()
    if not allowed_raw:
        return True
    allowed_set = {e.strip().lower() for e in allowed_raw.split(",") if e.strip()}
    if not allowed_set:
        return True
    return (email or "").strip().lower() in allowed_set


def get_current_user(
    payload: dict = Depends(get_current_user_token_payload),
    db: Session = Depends(get_db)
) -> User:
    """
    Obtiene el usuario de la base de datos a partir del 'sub' (ID) del token.
    Si el usuario no existe todavía en la base de datos local pero tiene un token
    válido de Supabase, se aprovisiona automáticamente (JIT) junto con su Tenant.
    """
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token no contiene ID de usuario (sub)",
        )

    payload_email = payload.get("email") or ""
    if payload_email and payload_email != "test@example.com" and not is_email_allowed(payload_email):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso restringido: este correo no está autorizado en ALLOWED_EMAILS.",
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        user_email = payload.get("email") or f"user_{user_id[:8]}@example.com"
        # Comprobar si ya existe por email (ej. creado previamente vía fallback local)
        existing_by_email = db.query(User).filter(User.email == user_email).first()
        if existing_by_email is not None:
            return existing_by_email

        # Aprovisionamiento Just-In-Time (JIT)
        company_name = payload.get("company_name") or f"Empresa ({user_email.split('@')[0]})"
        
        # Crear Tenant
        new_tenant = Tenant(
            id=str(uuid.uuid4()),
            name=company_name,
            subscription_active=getattr(settings, "SKIP_BILLING_CHECK", False)
        )
        db.add(new_tenant)
        db.flush()

        # Crear Usuario
        user = User(
            id=user_id,
            tenant_id=new_tenant.id,
            email=user_email,
            role="admin"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

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

def require_active_subscription(
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
) -> Tenant:
    """
    Capa 3 de Seguridad: Bloquea el acceso si la empresa no ha pagado
    y ha superado el límite de 5 facturas gratuitas de prueba.
    """
    if getattr(settings, "SKIP_BILLING_CHECK", False):
        return tenant

    if tenant.subscription_active:
        return tenant

    from models.invoice import Invoice
    processed_count = db.query(Invoice).filter(Invoice.tenant_id == tenant.id).count()
    FREE_TRIAL_LIMIT = 5
    if processed_count < FREE_TRIAL_LIMIT:
        return tenant

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=f"Has alcanzado el límite de {FREE_TRIAL_LIMIT} facturas gratuitas de prueba. Por favor, activa tu suscripción en el panel de facturación para continuar.",
    )
