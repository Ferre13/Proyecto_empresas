from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from core.config import settings

# Crear motor sincrónico para PostgreSQL.
# Usamos sincrónico para simplificar compatibilidad entre FastAPI y Celery Workers.
# Configurar parámetros del motor según el tipo de base de datos
engine_kwargs = {}
if settings.DATABASE_URL.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_size"] = 10
    engine_kwargs["max_overflow"] = 20

engine = create_engine(settings.DATABASE_URL, **engine_kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependencia para FastAPI para obtener la sesión de la DB.
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
