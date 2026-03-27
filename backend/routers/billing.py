import stripe
from fastapi import APIRouter, Depends, HTTPException
from core.config import settings
from core.security import get_current_tenant
from models.tenant import Tenant

stripe.api_key = settings.STRIPE_SECRET_KEY

router = APIRouter(prefix="/billing", tags=["Billing"])

# SUSTITUYE ESTO por el ID que copiaste de Stripe
STRIPE_PRICE_ID = "price_1TFe7D2MLebxKCTdb0oBCR3v" 

@router.post("/create-checkout-session")
async def create_checkout_session(current_tenant: Tenant = Depends(get_current_tenant)):
    """
    Crea una sesión de pago en Stripe y devuelve la URL.
    Pilar 1: Pasamos el tenant_id como 'client_reference_id' para que 
    el webhook sepa a quién activar la cuenta tras el pago.
    """
    try:
        checkout_session = stripe.checkout.Session.create(
            line_items=[
                {
                    'price': STRIPE_PRICE_ID,
                    'quantity': 1,
                },
            ],
            mode='subscription',
            # Redirigir al usuario tras el pago (URL de tu frontend)
            success_url='http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}',
            cancel_url='http://localhost:3000/cancel',
            client_reference_id=current_tenant.id, # CRÍTICO: Para el Webhook
        )
        return {"url": checkout_session.url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
