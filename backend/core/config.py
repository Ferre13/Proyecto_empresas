from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Base de Datos
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/ap_automation"
    
    # Message Broker / Celery
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Seguridad Supabase JWT
    SUPABASE_JWT_SECRET: str = "your-supabase-jwt-secret-here"
    
    # IA: Gemini
    GEMINI_API_KEY: str = "your-gemini-api-key-here"
    
    # Billing Stripe
    STRIPE_SECRET_KEY: str = "your-stripe-secret-key-here"
    STRIPE_WEBHOOK_SECRET: str = "your-stripe-webhook-secret-here"
    STRIPE_PRICE_ID: str = "price_1TFe7D2MLebxKCTdb0oBCR3v"
    
    # Frontend URL para redirecciones de Stripe Checkout
    FRONTEND_URL: str = "http://localhost:5173"
    
    # Modo de Testeo: Si es True, no pide pago de Stripe para subir facturas
    SKIP_BILLING_CHECK: bool = False

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
