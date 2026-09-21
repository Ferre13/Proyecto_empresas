# DocuFlow - SaaS B2B AP Automation System

> Plataforma SaaS B2B de grado empresarial para la automatización de Cuentas por Pagar (AP). Extrae datos estructurados de facturas mediante **Gemini 2.5 Flash**, valida la integridad matemática de importes, habilita la corrección humana asistida (Triaje) y exporta datos al formato contable de cualquier ERP (SAP, Holded, Sage, Excel/CSV).

![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110.0-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18.2.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Celery](https://img.shields.io/badge/Celery-5.3.6-37B24D?style=for-the-badge&logo=celery&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Stripe](https://img.shields.io/badge/Stripe-API-008CDD?style=for-the-badge&logo=stripe&logoColor=white)

---

## 💼 Información Comercial y Operativa (SaaS Subscription)

DocuFlow opera bajo un modelo de software como servicio (**SaaS B2B**) con suscripción mensual recurrente gestionada mediante **Stripe Billing**.

* **Modelo de Precios:** Suscripción mensual de acceso completo a la plataforma web (procesamiento automatizado de lotes de facturas, triaje colaborativo y exportaciones ERP ilimitadas).
* **Entrega del Servicio (Fulfillment):** Una vez completado el pago a través de Stripe Checkout, el acceso a la plataforma web es **inmediato** mediante autenticación de usuario.
* **Política de Cancelación:** El cliente puede cancelar su suscripción en cualquier momento y sin permanencia directamente desde el **Stripe Customer Portal** accesible en la sección de facturación de la app. El servicio permanecerá activo hasta el final del ciclo de facturación en curso.
* **Política de Reembolsos:** Se ofrece garantía de reembolso íntegro durante los primeros 14 días si el servicio no cumple con los requisitos del cliente o presenta incompatibilidades técnicas.
* **Soporte y Contacto:** Para incidencias técnicas, facturación o consultas: `soporte@tudominio.com` (o tu correo personal de contacto).


---
## 🚀 Visión General y Capacidades Clave

* **Extracción Híbrida Inteligente (Gemini 2.5 Flash)**: Procesamiento multimodal de facturas en PDF, imágenes (JPG, PNG, WebP) o paquetes ZIP mediante esquemas JSON rigurosos (*Structured Outputs*) a temperatura `0.0`.
* **Aislamiento Multi-Tenant Absoluto**: Columna `tenant_id` obligatoria en todas las entidades PostgreSQL y aislamiento stateless estricto por petición en el motor de IA para evitar fugas entre clientes.
* **Procesamiento Asíncrono Justo (Fair Queuing)**: Arquitectura respaldada en **Celery + Redis** utilizando `worker_prefetch_multiplier=1` y ejecuciones `-Ofair` para evitar el acaparamiento de workers por un único tenant.
* **Validador de Integridad Matemática**: Verificación automatizada de la regla financiera `Subtotal + Impuestos == Total` (con tolerancia de 0.01 por redondeo), control de presencia de datos críticos y coherencia de líneas de detalle.
* **Interfaz de Triaje Split-Screen**: Consola de verificación humana asistida en React que muestra el PDF/imagen original en tiempo real junto al formulario editable, destacando incoherencias y filtrando campos según el ERP.
* **Motor de Mapeo ERP Dinámico**: Transformación transparente del Modelo Canónico a estructuras personalizadas para Excel/CSV (SAP, Holded, Sage, A3) con soporte para reordenación de columnas y fallback canónico.
* **Gestión de Suscripciones y Cobros con Stripe**: Integración con **Stripe Checkout Sessions** (`mode=subscription`), sincronización en tiempo real vía Webhooks (`checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`) y acceso al **Stripe Customer Portal**.
* **Cumplimiento de Privacidad y RGPD**: Almacenamiento temporal en volúmenes dedicados (`/tmp/ap_automation_uploads`) y purga automática de archivos tras el procesamiento y la exportación.

---

## 🏛️ Arquitectura y Stack Tecnológico

### Componentes del Sistema

| Capa / Componente | Tecnología / Herramienta | Propósito |
| :--- | :--- | :--- |
| **Backend API** | Python 3.11 / FastAPI | API RESTful asíncrona, validaciones de seguridad y gestión de endpoints |
| **Frontend UI** | React 18 / Vite | Interfaz de usuario "Apple-esque", arrastre de facturas, triaje y mapeo ERP |
| **Base de Datos** | PostgreSQL 15 / SQLAlchemy | Persistencia relacional multi-tenant con ORM e índices relacionales |
| **Migraciones DB** | Alembic | Control de versiones y evolución del esquema relacional |
| **Cola de Tareas** | Celery 5.3.6 / Redis 7 | Orquestación asíncrona con *Ack Late*, retries y política de distribución *Fair* |
| **Motor OCR / IA** | Gemini 2.5 Flash (`google-generativeai`) | Análisis multimodal y extracción estandarizada JSON |
| **Pasarela de Pago** | Stripe API v8 / Webhooks | Gestión del muro de facturación, checkout de suscripciones y portal de cliente |
| **Autenticación** | Supabase JWT (`python-jose`) | Verificación descentralizada de firmas JWT basadas en algoritmos HS256 |

### Diagrama de Flujo de Datos

```mermaid
sequenceDiagram
    autonumber
    actor Cliente as Usuario / ERP
    participant UI as Frontend (React/Vite)
    participant API as FastAPI Backend
    participant DB as PostgreSQL
    participant Worker as Celery Worker
    participant Gemini as Gemini 2.5 Flash API
    participant Stripe as Stripe API & Webhooks

    Cliente->>UI: Carga facturas (PDF / Imágenes / ZIP)
    UI->>API: POST /upload/ (Multipart + Bearer JWT)
    API->>API: Validar Tenant y Suscripción Activa
    API->>DB: Crear registro de Batch e Invoices (Status: PENDING)
    API->>Worker: Encolar process_invoice_task(invoice_id, tenant_id)
    API-->>UI: Retorna batch_id y estado inicial
    
    Worker->>Worker: Recuperar archivo desde el volumen /tmp/
    Worker->>Gemini: Upload File + Generate Content (Structured Output)
    Gemini-->>Worker: Retorna JSON Canónico
    Worker->>Worker: Ejecutar validate_invoice_math()
    
    alt Datos válidos y suma matemática correcta
        Worker->>DB: Actualizar Invoice (Status: VALIDATED)
    else Faltan datos o suma matemática incorrecta
        Worker->>DB: Actualizar Invoice (Status: REQUIRES_REVIEW)
    end
    
    Worker->>Gemini: Purga segura del archivo subido (RGPD)
    
    Cliente->>UI: Revisa factura en Triaje o descarga exportación
    UI->>API: GET /mappings/export/{batch_id}?erp_name=...
    API->>DB: Consulta Mapeo ERP y facturas del Tenant
    API-->>UI: StreamingResponse (Archivo Excel .xlsx generado con Pandas)

    Note over Stripe, DB: Proceso de Facturación Asíncrono
    Stripe->>API: Webhook (checkout.session.completed / payment_failed)
    API->>DB: Actualizar tenant.subscription_active (True/False)
```

---

## 📂 Estructura del Proyecto

```text
Proyecto_empresas/
├── backend/
│   ├── alembic/                 # Migraciones de base de datos relacional
│   ├── core/
│   │   ├── config.py            # Gestión centralizada de configuración (Pydantic Settings)
│   │   ├── database.py          # Sesiones e inicialización del motor SQLAlchemy
│   │   └── security.py          # Autenticación Supabase JWT y verificación de suscripción
│   ├── models/                  # Entidades SQLAlchemy (Tenant, User, Batch, Invoice, ExportMapping)
│   ├── routers/
│   │   ├── billing.py           # Endpoints de Checkout Session y Customer Portal de Stripe
│   │   ├── invoices.py          # Consulta, servir archivos físicos y endpoints de Triaje
│   │   ├── mappings.py          # Configuración de Mapeos ERP y generación de exportaciones
│   │   ├── upload.py            # Endpoints para recepción de archivos e historial de lotes
│   │   └── webhooks.py          # Manejador de eventos y firmas de Webhooks de Stripe
│   ├── schemas/                 # Esquemas Pydantic para la API y modelo canónico
│   ├── services/
│   │   ├── ai_extractor.py      # Integración con Gemini 2.5 Flash y esquemas Structured Output
│   │   ├── exporter.py          # Motor de transformación dinámica de datos a Excel/CSV con Pandas
│   │   ├── file_router.py       # Enrutamiento inteligente de formatos y descompresión ZIP
│   │   └── math_validator.py    # Algoritmo de verificación matemática y campos críticos
│   ├── workers/
│   │   ├── celery_app.py        # Configuración del broker Celery con Fair Queuing
│   │   └── tasks.py             # Tareas asíncronas de procesamiento de facturas
│   ├── Dockerfile               # Imagen Docker de producción para Backend y Worker
│   ├── generate_test_token.py   # Utility para generación de tokens JWT de desarrollo
│   ├── requirements.txt         # Dependencias Python fijadas
│   └── seed.py                  # Script para sembrado de datos de prueba e inicialización
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── BatchDetail.jsx  # Vista de estado del lote y tarjetas compactas de facturas
│   │   │   ├── BatchList.jsx    # Historial de lotes procesados
│   │   │   ├── Mapping.jsx      # Editor visual de Mapeo ERP (Manual / Detección por Excel)
│   │   │   ├── Success.jsx      # Confirmación de suscripción activada
│   │   │   ├── Triage.jsx       # Consola Split-Screen de verificación y corrección
│   │   │   └── Upload.jsx       # Zona de subida Drag & Drop
│   │   ├── services/
│   │   │   └── api.js           # Cliente Axios con interceptores JWT y helpers de Billing
│   │   ├── App.jsx              # Enrutamiento principal y estructura de navegación
│   │   └── main.jsx             # Punto de entrada de React DOM
│   ├── package.json             # Dependencias del frontend y scripts de Vite
│   └── vite.config.js           # Configuración del empaquetador Vite
├── docker-compose.yml           # Orquestación local (Web, Worker, Redis, PostgreSQL)
└── GEMINI.md                    # Directrices de arquitectura del sistema
```

---

## 📋 Prerrequisitos

* **Docker & Docker Compose**: Docker Engine >= 20.10, Docker Compose v2.
* **Python** *(para desarrollo nativo sin Docker)*: Python >= 3.11.
* **Node.js** *(para desarrollo frontend)*: Node.js >= 18.0.0, npm >= 9.0.0.

---

## ⚙️ Variables de Entorno (`.env`)

Crea un archivo `.env` en la raíz del repositorio siguiendo la especificación técnica de la siguiente tabla:

| Variable | Tipo / Formato | Requerida | Descripción |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | String (URI) | Sí | Conexión PostgreSQL (`postgresql://user:pass@host:5432/dbname`) |
| `REDIS_URL` | String (URI) | Sí | Conexión Redis para Celery Broker (`redis://host:6379/0`) |
| `SUPABASE_JWT_SECRET` | String (Base64/Secret) | Sí | Secreto JWT obtenido del cuadro de mandos de Supabase |
| `GEMINI_API_KEY` | String | Sí | Clave de API de Google AI Studio para Gemini 2.5 Flash |
| `STRIPE_SECRET_KEY` | String (`sk_test_...`) | Sí | Clave secreta de la API de Stripe (Modo Test o Producción) |
| `STRIPE_WEBHOOK_SECRET` | String (`whsec_...`) | Sí | Secreto de verificación de firma de Webhooks de Stripe |
| `STRIPE_PRICE_ID` | String (`price_...`) | Sí | Identificador del precio/plan de suscripción en Stripe |
| `FRONTEND_URL` | String (URL) | Sí | URL base del cliente web (ej. `http://localhost:5173`) |
| `SKIP_BILLING_CHECK` | Boolean | No | Si es `True`, ignora la comprobación de suscripción activa (Dev Only) |

---

## 🛠️ Instalación y Puesta en Marcha Local

### Opción A: Despliegue Completo con Docker Compose (Recomendado)

1. **Clonar el repositorio y configurar variables de entorno**:
   ```bash
   git clone https://github.com/Ferre13/Proyecto_empresas.git
   cd Proyecto_empresas
   cp .env.example .env # Asegúrate de completar tus claves de API
   ```

2. **Levantar la infraestructura (Web, Worker, Redis, PostgreSQL)**:
   ```bash
   docker compose up -d --build
   ```

3. **Ejecutar migraciones e inicializar datos de prueba**:
   ```bash
   # Aplicar esquema de base de datos
   docker compose exec web alembic upgrade head

   # Sembrar tenant y usuario de pruebas
   docker compose exec web python seed.py
   ```

4. **Iniciar el servidor de desarrollo del Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   *Accede a la interfaz web en `http://localhost:5173` y a la API en `http://localhost:8000/docs`.*

---

### Opción B: Desarrollo Nativo (Sin Docker)

1. **Backend & Base de Datos**:
   ```bash
   # Iniciar PostgreSQL y Redis localmente o mediante servicios externos
   cd backend
   python -m venv .venv
   source .venv/bin/activate  # En Windows: .venv\Scripts\activate
   pip install -r requirements.txt

   # Ejecutar migraciones y sembrado
   alembic upgrade head
   python seed.py

   # Iniciar servidor Uvicorn
   uvicorn main:app --reload --port 8000
   ```

2. **Celery Worker (en una terminal independiente)**:
   ```bash
   cd backend
   source .venv/bin/activate
   celery -A workers.celery_app worker --loglevel=info -Ofair
   ```

3. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

---

## 💻 Uso y Flujo Operativo

### 1. Simulación de Webhooks de Stripe (Entorno Local)

Para recibir y procesar notificaciones de Stripe en tu entorno local de desarrollo:

```bash
# Iniciar escucha local con Stripe CLI
stripe listen --forward-to localhost:8000/webhooks/stripe
```
*Copia la clave `whsec_...` que devuelve el comando y actualízala en la variable `STRIPE_WEBHOOK_SECRET` de tu archivo `.env`.*

### 2. Generación de Token JWT de Pruebas

Para realizar pruebas directas contra la API REST mediante herramientas como `curl` o Postman:

```bash
docker compose exec web python generate_test_token.py
```
*Utiliza el token resultante en la cabecera `Authorization: Bearer <TOKEN>`.*

### 3. Ejemplos de Peticiones a la API

#### Subida de un Lote de Facturas (`POST /upload/`)
```bash
curl -X POST "http://localhost:8000/upload/" \
  -H "Authorization: Bearer <TOKEN>" \
  -F "files=@/ruta/factura_ejemplo.pdf"
```

#### Descarga de Exportación a Excel (`GET /mappings/export/{batch_id}`)
```bash
curl -X GET "http://localhost:8000/mappings/export/<BATCH_ID>?erp_name=Excel%20%2F%20CSV" \
  -H "Authorization: Bearer <TOKEN>" \
  --output exportacion_lote.xlsx
```

---

## 🧪 Calidad de Código y Mantenimiento

* **Verificación de Logs del Worker de IA**:
  ```bash
  docker compose logs -f worker
  ```
* **Verificación de Migraciones de Base de Datos**:
  ```bash
  docker compose exec web alembic current
  ```
* **Creación de Nueva Migración Alembic**:
  ```bash
  docker compose exec web alembic revision --autogenerate -m "descripcion_cambio"
  ```
