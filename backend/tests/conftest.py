import os
import pytest

# Ensure tests run with SQLite in-memory without requiring a live PostgreSQL instance
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["REDIS_URL"] = "redis://localhost:6379/0"
os.environ["SKIP_BILLING_CHECK"] = "True"
os.environ["GEMINI_API_KEY"] = "fake-gemini-key"
os.environ["SUPABASE_JWT_SECRET"] = "secret"
