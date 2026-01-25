# TaskTracker

TaskTracker is a full-stack web application for task management with role-based access control. It is built using **Django (backend)**, **React (frontend)**, and **PostgreSQL (database)**.

## ✅ Features

The application allows users to:

- Create and manage tasks with titles, descriptions, deadlines, and priorities  
- Assign roles to users for each task (Owner, Assigned, Viewer)  
- Track task progress with statuses (To do, In progress, Done)  
- Break down tasks into subtasks  
- View task details based on role permissions  

## ✅ Key Functionality

- ✅ User authentication (registration & login)  
- ✅ Task creation, editing, and deletion  
- ✅ Priority levels (High, Medium, Low) with visual indicators  
- ✅ Role-based access control:
  - **Owner** – can delete and edit  
  - **Assigned** – can update tasks  
  - **Viewer** – can only view  
- ✅ Subtask support  
- ✅ Session or token-based access management  
- ✅ Responsive design for desktop and mobile  
- ✅ API-based communication between backend and frontend  

## ✅ Technology Stack

### 🔹 Backend
- Django (Python)  
- Django REST Framework (API)  
- PostgreSQL  
- Role and permission logic

### 🔹 Frontend
- React  
- Axios or Fetch API for backend communication  
- CSS or a component library

### 🔹 Deployment
- Docker (separate containers for backend, frontend, and database)

## ✅ Database Structure

### Database ERD

![Database ERD](docs/dbERD.drawio.svg)

## Local setup instructions 

python -m venv .venv
source .venv/bin/activate  # or Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

### Run the Backend Locally

Create and activate a virtual environment:

```bash
python -m venv .venv

# macOS / Linux
source .venv/bin/activate

# Windows
.\.venv\Scripts\activate
```

Install dependencies and run migrations:

```bash
pip install -r requirements.txt
python manage.py migrate
```

Start the development server:

```bash
python manage.py runserver
```

The backend will be available at:
http://127.0.0.1:8000/

### Run the Frontend Locally

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at:
http://localhost:5173 (or http://localhost:3000 depending on configuration)

### API Smoke Test

Check if the backend is running:

```bash
curl -i http://127.0.0.1:8000/api/profile/
```

Expected response:
401 Unauthorized (when no token is provided)

### Authentication (JWT)

The API uses JSON Web Tokens (JWT) for authentication.

Login returns two tokens:
- `access` – short-lived token used for authenticated requests
- `refresh` – long-lived token used to obtain a new access token

Example login:

```bash
curl -X POST http://127.0.0.1:8000/api/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"demo123"}'
```
Example authenticated request:

```bash
curl http://127.0.0.1:8000/api/profile/ \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

Token refresh (if access token expires)

```bash
curl -X POST http://127.0.0.1:8000/api/token/refresh/ \
  -H "Content-Type: application/json" \
  -d '{"refresh":"<REFRESH_TOKEN>"}'
```
