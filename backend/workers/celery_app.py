import os
from celery import Celery
from core.config import settings

# Inicializamos la aplicación Celery
celery_app = Celery(
    "ap_automation_worker",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=['workers.tasks']
)

# Configuración crítica para el Pilar 2: Procesamiento Asíncrono y "Fair Queuing"
celery_app.conf.update(
    # Habilitar el reconocimiento tardío. El worker solo confirma la tarea como "hecha"
    # cuando termina, no cuando la saca de la cola. Evita pérdida de tareas si el worker muere.
    task_acks_late=True,
    
    # Desactivar la precarga de tareas (prefetch multiplier).
    # Por defecto, un worker coge 4 tareas de golpe. Al ponerlo en 1, coge de 1 en 1.
    # Esto, sumado al parámetro '-Ofair' (que configuramos en docker-compose.yml),
    # garantiza que si un Tenant sube 1000 facturas, no bloqueará a un worker; el worker
    # cogerá 1, y si llega una factura del Tenant B, podrá ser procesada concurrentemente
    # por otro worker libre o inmediatamente después, logrando una distribución justa.
    worker_prefetch_multiplier=1,
    
    # Tiempo máximo que una tarea puede ejecutar antes de ser asesinada (para evitar bloqueos infinitos de IA)
    task_time_limit=300,        # 5 minutos máximo de procesamiento (soft limit o hard limit)
    task_soft_time_limit=240,   # A los 4 minutos lanza una excepción que podemos capturar
    
    # Pilar 3 (Stateless / RGPD): Purga periódica cada hora de archivos con más de 24h
    beat_schedule={
        'purge-old-files-every-hour': {
            'task': 'purge_old_files_task',
            'schedule': 3600.0, # Cada hora ejecuta la purga de archivos de más de 24h
        },
    }
)
