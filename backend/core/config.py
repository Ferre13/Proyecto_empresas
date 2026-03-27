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

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
