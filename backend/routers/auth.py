import uuid
import time
import hashlib
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from jose import jwt

from core.config import settings
from core.database import get_db
from core.security import is_email_allowed
from models.user import User
from models.tenant import Tenant

router = APIRouter(prefix="/auth", tags=["Auth Fallback"])


class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    email: str
    password: str
    company_name: str = "Mi Empresa"


def _create_signed_jwt(user_id: str, email: str, company_name: str) -> str:
    secret = getattr(settings, "SUPABASE_JWT_SECRET", None) or "docuflow-fallback-secret-key"
    now = int(time.time())
    payload = {
        "sub": user_id,
        "email": email,
        "role": "authenticated",
        "company_name": company_name,
        "user_metadata": {"company_name": company_name},
        "iss": "docuflow-local-auth",
        "iat": now,
        "exp": now + (60 * 60 * 24 * 7),  # 7 días
    }
    return jwt.encode(payload, secret, algorithm="HS256")


def _deterministic_user_id(email: str) -> str:
    return str(uuid.uuid5(uuid.NAMESPACE_DNS, f"docuflow.user.{email.lower().strip()}"))


@router.post("/login")
def local_login(req: LoginRequest, db: Session = Depends(get_db)):
    """
    Autenticación resiliente de respaldo cuando Supabase Cloud está en estado
    Unhealthy o restaurándose tras una pausa. Busca el usuario por email en
    PostgreSQL (o lo aprovisiona si ya existía cuenta previa) y emite un JWT firmado.
    """
    clean_email = req.email.strip().lower()
    if not clean_email or not req.password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email y contraseña requeridos.",
        )

    if not is_email_allowed(clean_email):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso restringido al propietario (ALLOWED_EMAILS).",
        )

    user = db.query(User).filter(User.email.ilike(clean_email)).first()
    if not user:
        # Si el usuario aún no estaba sincronizado en Postgres local, lo aprovisionamos
        user_id = _deterministic_user_id(clean_email)
        company_name = f"Empresa ({clean_email.split('@')[0]})"
        new_tenant = Tenant(
            id=str(uuid.uuid4()),
            name=company_name,
            subscription_active=getattr(settings, "SKIP_BILLING_CHECK", False),
        )
        db.add(new_tenant)
        db.flush()

        user = User(
            id=user_id,
            tenant_id=new_tenant.id,
            email=clean_email,
            role="admin",
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    tenant = db.query(Tenant).filter(Tenant.id == user.tenant_id).first()
    company_name = tenant.name if tenant else "Mi Empresa"

    token = _create_signed_jwt(user.id, user.email, company_name)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "company_name": company_name,
        },
    }


@router.post("/register")
def local_register(req: RegisterRequest, db: Session = Depends(get_db)):
    """
    Registro resiliente en PostgreSQL cuando Supabase Cloud está Unhealthy.
    """
    clean_email = req.email.strip().lower()
    if not clean_email or not req.password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Todos los campos son obligatorios.",
        )

    if not is_email_allowed(clean_email):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Registro público deshabilitado. Acceso restringido al propietario (ALLOWED_EMAILS).",
        )

    user = db.query(User).filter(User.email.ilike(clean_email)).first()
    company_name = (req.company_name or "").strip() or f"Empresa ({clean_email.split('@')[0]})"

    if not user:
        user_id = _deterministic_user_id(clean_email)
        new_tenant = Tenant(
            id=str(uuid.uuid4()),
            name=company_name,
            subscription_active=getattr(settings, "SKIP_BILLING_CHECK", False),
        )
        db.add(new_tenant)
        db.flush()

        user = User(
            id=user_id,
            tenant_id=new_tenant.id,
            email=clean_email,
            role="admin",
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        tenant = db.query(Tenant).filter(Tenant.id == user.tenant_id).first()
        if tenant:
            company_name = tenant.name

    token = _create_signed_jwt(user.id, user.email, company_name)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "company_name": company_name,
        },
    }
