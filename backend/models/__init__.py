from core.database import Base
from .tenant import Tenant
from .user import User
from .batch import Batch
from .invoice import Invoice
from .mapping import ExportMapping

# Este archivo permite importar todos los modelos fácilmente para que 
# SQLAlchemy (y posteriormente Alembic) los detecte y cree las tablas.
__all__ = ["Base", "Tenant", "User", "Batch", "Invoice", "ExportMapping"]
