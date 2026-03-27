# SaaS B2B AP Automation - GEMINI.md (ACTUALIZADO)

Este documento es la única fuente de verdad para la arquitectura y operación del sistema. Todas las intervenciones de IA deben seguir estas directrices.

## 🚀 Resumen del Proyecto
SaaS B2B para la automatización de cuentas por pagar. Extrae datos de facturas mediante **Gemini 2.5 Flash**, valida la integridad matemática, permite corrección humana (Triaje) y exporta a formatos personalizados de ERP (SAP, Holded, etc.).

## 🏛️ Arquitectura: Los 4 Pilares Innegociables

### 1. Aislamiento Absoluto (Multi-tenant & IA Isolation)
- **Base de Datos:** Columna `tenant_id` obligatoria en todas las tablas operativas. Filtro mandatorio en cada consulta ORM.
- **IA:** 1 Archivo = 1 Llamada a la API. Sin memoria entre peticiones para evitar cruce de datos.

### 2. Procesamiento Asíncrono (Fair Queuing)
- **Infraestructura:** Celery + Redis.
- **Configuración:** `worker_prefetch_multiplier=1` y `-Ofair` para garantizar que ningún cliente monopolice los workers.

### 3. Stateless y Muro Legal (RGPD)
- **Archivos:** Almacenamiento temporal en volumen compartido `/tmp/ap_automation_uploads`.
- **Privacidad:** Los archivos deben purgarse tras la exportación o tras 24 horas.

### 4. Modelo Canónico y Mapeo Dinámico
- **Interno:** JSON inmutable estándar (Pydantic / JSON Schema).
- **Externo:** Motor de mapeo dinámico (`services/exporter.py`) que transforma el JSON al Excel/CSV del cliente según su configuración.

---

## 🏗️ Estructura del Proyecto

### Backend (Python / FastAPI)
- `core/`: Configuración (Pydantic Settings), DB (SQLAlchemy), Seguridad (Supabase JWT & Stripe).
- `models/`: Tablas relacionales (Tenant, User, Batch, Invoice, ExportMapping).
- `schemas/`: Esquemas de validación y definición de "Structured Outputs" para IA.
- `routers/`: 
  - `upload.py`: Gestión de subida y creación de lotes.
  - `invoices.py`: Visualización segura y corrección (Triaje).
  - `mappings.py`: Configuración del motor de exportación.
  - `billing.py`: Generación de sesiones de pago (Stripe Checkout).
  - `webhooks.py`: Recepción de eventos de pago de Stripe.
- `services/`: 
  - `ai_extractor.py`: Lógica de Gemini 2.5 Flash.
  - `math_validator.py`: Validación de sumas (Base + Impuestos = Total).
  - `file_router.py`: Enrutamiento inteligente (Visual vs Texto).
  - `exporter.py`: Generación dinámica de Excel/CSV.
- `workers/`: Configuración de Celery y definición de tareas asíncronas.

### Frontend (React / Vite)
- `pages/`: 
  - `Upload.jsx`: Subida de archivos y suscripción.
  - `BatchList.jsx`: Listado de lotes y progreso.
  - `BatchDetail.jsx`: Detalle de facturas y descarga de Excel.
  - `Triage.jsx`: Pantalla dividida para corrección humana.
  - `Mapping.jsx`: Configuración visual del motor de mapeo ERP.

---

## 🛡️ Capas de Seguridad
1. **DB:** SQLAlchemy ORM contra SQL Injection.
2. **Auth:** Supabase JWT (El backend nunca guarda contraseñas).
3. **Billing:** Stripe (Bloqueo de IA si `subscription_active == False`).
4. **Secrets:** `.env` gestionado fuera de Git.

---

## 🛠️ Comandos Operativos

### Infraestructura
- **Arrancar sistema:** `docker compose up -d --build`
- **Migraciones DB:** 
  - `docker compose exec web alembic revision --autogenerate -m "nombre"`
  - `docker compose exec web alembic upgrade head`

### Pruebas y Desarrollo
- **Sembrar datos:** `docker compose exec web python seed.py`
- **Generar Token de prueba:** `docker compose exec web python generate_test_token.py`
- **Logs del Worker (IA):** `docker compose logs -f worker`
- **Stripe Webhooks (Local):** `stripe listen --forward-to localhost:8000/webhooks/stripe`

### Frontend
- **Iniciar:** `cd frontend && npm install && npm run dev`

---

## 📝 Convenciones de Desarrollo
- **IA:** Usar siempre `gemini-2.5-flash` con esquemas JSON manuales (SCHEMA) para evitar errores de la SDK con Pydantic.
- **CORS:** Habilitado para comunicación Frontend-Backend en desarrollo.
- **Archivos:** Siempre usar el volumen compartido para que el worker tenga acceso físico a los documentos.
