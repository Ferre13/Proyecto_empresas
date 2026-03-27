# SaaS B2B AP Automation - GEMINI.md

Este documento sirve como guía arquitectónica y operativa para el desarrollo del SaaS de Automatización de Cuentas por Pagar. Todas las intervenciones de IA en este repositorio deben obedecer estas reglas.

## 🚀 Resumen del Proyecto
Sistema B2B para la extracción automática de datos de facturas (PDF, imágenes, Office) mediante LLMs (Gemini), validación matemática, corrección humana y exportación dinámica a ERPs.

## 🏛️ Arquitectura: Los 4 Pilares Innegociables

### 1. Aislamiento Absoluto (Multi-tenant & Anti-Alucinaciones)
- **Base de Datos:** Multi-tenant por columna `tenant_id` en todas las tablas operativas.
- **ORM Security:** Todas las consultas deben filtrar por `tenant_id`.
- **IA Isolation:** 1 Archivo = 1 Llamada a la API. Nunca mezclar múltiples documentos o inquilinos en un solo prompt.

### 2. Procesamiento Asíncrono (Fair Queuing)
- **Backend:** FastAPI (Síncrono) + Celery/Redis (Asíncrono).
- **Justicia Social (Workers):** Configuración "Round-Robin" o "Tenant-based chunking" para que ningún inquilino monopolice la cola.

### 3. Stateless y Muro Legal (RGPD)
- **Privacidad:** Los archivos físicos y datos temporales deben purgarse automáticamente (ej. 24h) tras el procesamiento o descarga.

### 4. Modelo Canónico (Agnosticismo de Salida)
- **Interno:** Extracción a un JSON inmutable estándar.
- **Externo:** Motor de mapeo dinámico para transformar el JSON al formato del ERP del cliente (CSV/Excel) en el último momento.

---

## 🏗️ Estructura del Backend (Python / FastAPI)
```text
/backend
├── core/           # Config, DB connection, Security (JWT/Supabase)
├── models/         # SQLAlchemy models (Tenant, User, Batch, Invoice, etc.)
├── schemas/        # Pydantic schemas (Structured Outputs for Gemini)
├── routers/        # API Endpoints (/auth, /upload, /status, etc.)
├── services/       # ai_extractor, math_validator, file_router
├── workers/        # Celery app & task definitions
└── main.py         # Entry point
```

## 💻 Frontend MVP (React)
- **Prioridad:** Lógica y flujo sobre estética.
- **Componentes Clave:**
  - Login (Supabase JWT).
  - Formulario de Mapeo ERP.
  - Subida de Lotes (ZIP/Multi-file).
  - Pantalla de Triaje (Corrección Humana con visor de PDF).

## 🛡️ Capas de Seguridad
1. **DB:** SQLAlchemy ORM (Prevención SQL Injection).
2. **Auth:** Supabase JWT (El backend no guarda contraseñas).
3. **Billing:** Stripe Webhooks (Block /upload if `subscription_active == False`).
4. **Secrets:** `.env` gestionado fuera de Git.

---

## 🛠️ Comandos de Desarrollo (TODO)
- **Build:** `docker-compose build`
- **Run:** `docker-compose up`
- **Tests:** `pytest`

---

## 📝 Convenciones de Desarrollo
- **Python:** Tipado estricto con `mypy` sugerido.
- **IA:** Siempre usar `Structured Outputs` de Pydantic con Gemini.
- **Validación:** El primer campo de la extracción de IA debe ser `is_valid_invoice: bool`.
- **No Refactoring:** No limpiar código fuera del alcance de la tarea actual.
