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

## Local setup instructions for backend and frontend

python -m venv .venv
source .venv/bin/activate  # or Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

