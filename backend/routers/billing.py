import stripe
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.config import settings
from core.database import get_db
from core.security import get_current_tenant, get_current_user
from models.tenant import Tenant
from models.user import User
from models.invoice import Invoice

stripe.api_key = settings.STRIPE_SECRET_KEY

router = APIRouter(prefix="/billing", tags=["Billing"])

@router.get("/status")
async def get_billing_status(
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Devuelve el estado de facturación, cupo de prueba y datos del usuario y empresa.
    """
    FREE_TRIAL_LIMIT = 5
    processed_count = db.query(Invoice).filter(Invoice.tenant_id == current_tenant.id).count()
    trial_remaining = max(0, FREE_TRIAL_LIMIT - processed_count)
    is_active = current_tenant.subscription_active or getattr(settings, "SKIP_BILLING_CHECK", False)

    return {
        "user_email": current_user.email,
        "company_name": current_tenant.name,
        "tenant_id": current_tenant.id,
        "subscription_active": is_active,
        "is_trial": not current_tenant.subscription_active and not getattr(settings, "SKIP_BILLING_CHECK", False),
        "trial_limit": FREE_TRIAL_LIMIT,
        "invoices_processed": processed_count,
        "trial_remaining": trial_remaining,
        "can_process": is_active or processed_count < FREE_TRIAL_LIMIT,
        "has_stripe_customer": bool(current_tenant.stripe_customer_id)
    }

@router.post("/create-checkout-session")
async def create_checkout_session(current_tenant: Tenant = Depends(get_current_tenant)):
    """
    Crea una sesión de pago en Stripe y devuelve la URL.
    Pilar 1: Pasamos el tenant_id como 'client_reference_id' para que 
    el webhook sepa a quién activar la cuenta tras el pago.
    """
    try:
        frontend_base = settings.FRONTEND_URL.rstrip('/')
        checkout_session = stripe.checkout.Session.create(
            line_items=[
                {
                    'price': settings.STRIPE_PRICE_ID,
                    'quantity': 1,
                },
            ],
            mode='subscription',
            success_url=f"{frontend_base}/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{frontend_base}/cancel",
            client_reference_id=current_tenant.id, # CRÍTICO: Para el Webhook
        )
        return {"url": checkout_session.url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/create-portal-session")
async def create_portal_session(current_tenant: Tenant = Depends(get_current_tenant)):
    """
    Crea una sesión del Portal de Clientes de Stripe para gestionar suscripción,
    métodos de pago y facturas.
    """
    if not current_tenant.stripe_customer_id:
        raise HTTPException(
            status_code=400,
            detail="No se encontró un cliente de Stripe asociado a esta empresa."
        )

    try:
        frontend_base = settings.FRONTEND_URL.rstrip('/')
        portal_session = stripe.billing_portal.Session.create(
            customer=current_tenant.stripe_customer_id,
            return_url=frontend_base,
        )
        return {"url": portal_session.url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
