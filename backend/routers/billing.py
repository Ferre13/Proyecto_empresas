import stripe
from fastapi import APIRouter, Depends, HTTPException
from core.config import settings
from core.security import get_current_tenant
from models.tenant import Tenant

stripe.api_key = settings.STRIPE_SECRET_KEY

router = APIRouter(prefix="/billing", tags=["Billing"])

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
