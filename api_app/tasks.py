import time
from celery import shared_task

@shared_task
def notify_task_created(task_id: int) -> dict:
    """
    Example async job: simulates sending a notification after task creation.
    Using sleep to visibly demonstrate background execution.
    """
    time.sleep(2)
    print(f"[celery] Task created notification sent for task_id={task_id}")
    return {"task_id": task_id, "status": "sent"}
