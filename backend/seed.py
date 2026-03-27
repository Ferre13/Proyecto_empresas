import uuid
from sqlalchemy.orm import Session
from core.database import SessionLocal, engine
from models.tenant import Tenant
from models.user import User

def seed_data():
    db = SessionLocal()
    try:
        # 1. Crear Tenant (Empresa)
        test_tenant = db.query(Tenant).filter(Tenant.name == "Empresa Test B2B").first()
        if not test_tenant:
            test_tenant = Tenant(
                id=str(uuid.uuid4()),
                name="Empresa Test B2B",
                subscription_active=True # Activamos suscripción para saltar el bloqueo
            )
            db.add(test_tenant)
            db.flush()
            print(f"Tenant de prueba creado: {test_tenant.name}")

        # 2. Crear Usuario
        # Nota: El ID debería coincidir con un sub de Supabase real en producción.
        # Para pruebas locales, usaremos un ID estático: 'test_user_id'
        test_user = db.query(User).filter(User.email == "test@example.com").first()
        if not test_user:
            test_user = User(
                id="test_user_id",
                tenant_id=test_tenant.id,
                email="test@example.com",
                role="admin"
            )
            db.add(test_user)
            print(f"Usuario de prueba creado: {test_user.email}")

        db.commit()
        print("---")
        print("SEMBRADO COMPLETADO!")
        print(f"TENANT_ID: {test_tenant.id}")
        print(f"USER_ID: {test_user.id}")
        print("---")
        print("Usa estos datos para tus pruebas o injecta el USER_ID en un token JWT local.")
        
    except Exception as e:
        print(f"Error sembrando datos: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
