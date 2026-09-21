import stripe
from fastapi import APIRouter, Request, Header, HTTPException, Depends
from sqlalchemy.orm import Session
from core.config import settings
from core.database import get_db
from models.tenant import Tenant

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])

@router.post("/stripe")
async def stripe_webhook(
    request: Request, 
    stripe_signature: str = Header(None), 
    db: Session = Depends(get_db)
):
    """
    Capa 3 de Seguridad: Recibe notificaciones de pago de Stripe.
    Si el pago falla o se cancela, bloquea el acceso al inquilino.
    """
    payload = await request.body()
    
    try:
        event = stripe.Webhook.construct_event(
            payload, stripe_signature, settings.STRIPE_WEBHOOK_SECRET
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error de firma: {str(e)}")

    # Manejar eventos de suscripción
    # checkout.session.completed -> Primera compra exitosa
    # customer.subscription.deleted -> Suscripción cancelada
    # invoice.payment_failed -> Pago rechazado
    
    event_type = event['type']
    data_object = event['data']['object']

    if event_type == 'checkout.session.completed':
        client_reference_id = data_object.get('client_reference_id') # tenant_id
        customer_id = data_object.get('customer')
        if client_reference_id:
            tenant = db.query(Tenant).filter(Tenant.id == client_reference_id).first()
            if tenant:
                tenant.subscription_active = True
                if customer_id:
                    tenant.stripe_customer_id = customer_id
                db.commit()

    elif event_type == 'customer.subscription.updated':
        customer_id = data_object.get('customer')
        sub_status = data_object.get('status') # 'active', 'past_due', 'canceled', 'unpaid', etc.
        tenant = db.query(Tenant).filter(Tenant.stripe_customer_id == customer_id).first()
        if tenant:
            tenant.subscription_active = (sub_status in ['active', 'trialing'])
            db.commit()

    elif event_type in ['customer.subscription.deleted', 'invoice.payment_failed']:
        customer_id = data_object.get('customer')
        if customer_id:
            tenant = db.query(Tenant).filter(Tenant.stripe_customer_id == customer_id).first()
            if tenant:
                tenant.subscription_active = False
                db.commit()

    elif event_type == 'invoice.paid':
        customer_id = data_object.get('customer')
        if customer_id:
            tenant = db.query(Tenant).filter(Tenant.stripe_customer_id == customer_id).first()
            if tenant:
                tenant.subscription_active = True
                db.commit()

    return {"status": "success"}
