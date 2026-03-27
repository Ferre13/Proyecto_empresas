import time
from jose import jwt
from core.config import settings

def generate_token():
    # El ID debe ser el mismo que pusimos en el script seed.py
    user_id = "test_user_id"
    
    # Payload estándar de Supabase JWT
    payload = {
        "sub": user_id,
        "email": "test@example.com",
        "role": "authenticated",
        "iat": int(time.time()),
        "exp": int(time.time()) + (60 * 60 * 24), # Expira en 24 horas
        "aud": "authenticated"
    }
    
    # Firmamos el token con el secreto que sacaste de Supabase
    token = jwt.encode(payload, settings.SUPABASE_JWT_SECRET, algorithm="HS256")
    
    print("--- TOKEN DE PRUEBA GENERADO ---")
    print(token)
    print("---")
    print("Copia este token y ponlo en el campo 'Authorization: Bearer <token>' de tus peticiones.")

if __name__ == "__main__":
    generate_token()
