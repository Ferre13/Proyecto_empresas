import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from core.database import Base
from models.user import User
from models.tenant import Tenant
from core.security import get_current_user

@pytest.fixture
def test_db():
    engine = create_engine("sqlite:///:memory:")
    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)
    session = TestingSession()
    try:
        yield session
    finally:
        session.close()

def test_jit_user_and_tenant_creation(test_db):
    payload = {
        "sub": "supabase_user_123",
        "email": "innovacion@empresa.com",
        "role": "authenticated"
    }

    # First access: user does not exist in DB yet
    user = get_current_user(payload=payload, db=test_db)
    
    assert user is not None
    assert user.id == "supabase_user_123"
    assert user.email == "innovacion@empresa.com"
    assert user.tenant_id is not None

    # Check that tenant was automatically created
    tenant = test_db.query(Tenant).filter(Tenant.id == user.tenant_id).first()
    assert tenant is not None
    assert "innovacion" in tenant.name

    # Second access: should return existing user without re-creating
    user_second_time = get_current_user(payload=payload, db=test_db)
    assert user_second_time.id == user.id
    assert user_second_time.tenant_id == tenant.id

def test_free_trial_and_paywall(test_db, monkeypatch):
    from core.config import settings
    from core.security import require_active_subscription
    from models.invoice import Invoice
    from models.batch import Batch
    from models.user import User
    from fastapi import HTTPException

    monkeypatch.setattr(settings, "SKIP_BILLING_CHECK", False)

    tenant = Tenant(id="tenant_trial_1", name="Trial Co", subscription_active=False)
    test_db.add(tenant)
    test_db.flush()

    user = User(id="user_trial_1", tenant_id=tenant.id, email="trial@co.com", role="admin")
    test_db.add(user)
    test_db.flush()

    batch = Batch(id="batch_trial_1", tenant_id=tenant.id, user_id=user.id, filename="batch_test.zip", status="COMPLETED")
    test_db.add(batch)
    test_db.commit()

    # With 0 to 4 invoices, subscription is granted under trial
    res = require_active_subscription(tenant=tenant, db=test_db)
    assert res.id == tenant.id

    # Add 5 invoices to exhaust the trial limit
    for i in range(5):
        inv = Invoice(
            id=f"inv_trial_{i}",
            tenant_id=tenant.id,
            batch_id=batch.id,
            original_filename=f"test_{i}.pdf",
            status="COMPLETED"
        )
        test_db.add(inv)
    test_db.commit()

    # 6th invoice attempt must raise 403 Forbidden
    with pytest.raises(HTTPException) as exc_info:
        require_active_subscription(tenant=tenant, db=test_db)
    assert exc_info.value.status_code == 403
    assert "facturas gratuitas" in exc_info.value.detail

    # Once subscription becomes active, it allows again
    tenant.subscription_active = True
    test_db.commit()
    res_paid = require_active_subscription(tenant=tenant, db=test_db)
    assert res_paid.id == tenant.id

