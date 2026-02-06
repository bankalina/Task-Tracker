# TaskTracker

TaskTracker is a full-stack web application for task management with role-based access control. It uses Django (backend), React (frontend), and a relational database.

## Features
- Create and manage tasks with title, description, deadline, and priority
- Assign roles per task (Owner, Assigned, Viewer)
- Track status (To do, In progress, Done)
- Subtasks
- API-based communication between backend and frontend
- JWT authentication

## Tech stack
Backend:
- Django
- Django REST Framework
- drf-spectacular (OpenAPI)
- Celery + RabbitMQ (async example)

Frontend:
- React + Vite

Database:
- SQLite for local development (default)
- PostgreSQL supported by updating DATABASES in backend/settings.py

## Local setup

### Backend
1. Create and activate a virtual environment:
```
python -m venv .venv
# Windows PowerShell
.\.venv\Scripts\Activate.ps1
# macOS / Linux
source .venv/bin/activate
```

2. Install dependencies and run migrations:
```
pip install -r requirements.txt
python manage.py migrate
```

3. Optional seed data (30+ records):
```
python manage.py loaddata api_app/fixtures/seed.json
```

4. Run the backend:
```
python manage.py runserver
```

Backend URL:
http://127.0.0.1:8000/

### Frontend
```
cd frontend
npm install
npm run dev
```

Frontend URL:
http://localhost:5173/

### Celery and RabbitMQ (optional)
Start RabbitMQ with Docker:
```
docker run -d --hostname tasktracker-rabbit --name tasktracker-rabbit -p 5672:5672 -p 15672:15672 rabbitmq:3-management
```

Start the Celery worker:
```
python -m celery -A backend worker -l info
```

On Windows, you may need:
```
python -m celery -A backend worker -l info --pool=solo
```

### API docs
- Swagger UI: http://127.0.0.1:8000/api/docs/
- OpenAPI schema: http://127.0.0.1:8000/api/schema/
- Redoc: http://127.0.0.1:8000/api/redoc/

### API smoke test
```
curl -i http://127.0.0.1:8000/api/profile/
```
Expected response: 401 Unauthorized (no token)

### Authentication (JWT)
Registration:
```
curl -X POST http://127.0.0.1:8000/api/register/ \
  -H "Content-Type: application/json" \
  -d '{"username":"<username>","email":"<email>","password":"<password>"}'
```

Login:
```
curl -X POST http://127.0.0.1:8000/api/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"<username>","password":"<password>"}'
```

Authenticated profile request:
```
curl http://127.0.0.1:8000/api/profile/ \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

Token refresh:
```
curl -X POST http://127.0.0.1:8000/api/token/refresh/ \
  -H "Content-Type: application/json" \
  -d '{"refresh":"<REFRESH_TOKEN>"}'
```

### Seed data note
Seed users have hashed passwords. If you need credentials, create your own user:
```
python manage.py createsuperuser
```
