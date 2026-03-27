from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from core.config import settings

# Crear motor sincrónico para PostgreSQL.
# Usamos sincrónico para simplificar compatibilidad entre FastAPI y Celery Workers.
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,  # Reconecta si se cae la base de datos
    pool_size=10,
    max_overflow=20
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependencia para FastAPI para obtener la sesión de la DB.
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
