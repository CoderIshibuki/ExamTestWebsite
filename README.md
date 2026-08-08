# Exam Test Website

This is a microservice-based application for an exam testing platform.

## Architecture

The system consists of the following microservices (FastAPI):
- **auth_service**: Manages user authentication and roles.
- **exam_service**: Manages exam attempts, questions, and lifecycle.
- **question_service**: Handles question bank.
- **grading_service**: Grades exams.
- **proctoring_service**: Anti-cheat and proctoring.
- **realtime_service**: WebSocket service for exam progress.

The frontend is a React application using Vite and Material-UI.
Infrastructure:
- PostgreSQL
- MongoDB
- Redis
- Celery worker
- Nginx (API Gateway)

## Prerequisites

- Docker and Docker Compose
- Node.js (v18+)

## How to run the project

To run the full stack locally:
```bash
docker-compose up -d --build
```
This will start all microservices, databases, and the API gateway on `localhost`.
The frontend can be run locally for development:
```bash
cd frontend
npm install
npm run dev
```

## How to run tests

### Backend Tests
Ensure you have the backend virtual environment set up and `pytest` installed.
```bash
pytest backend/tests/
```

### Frontend Tests
Run lint and build to verify frontend correctness:
```bash
cd frontend
npm run lint
npm run build
```

### E2E Tests
To run the full end-to-end integration test (requires backend running via Docker):
```bash
python scripts/e2e_test.py
```

## Database Migrations
Migrations are managed via Alembic per-service. To run them from scratch, the `docker-compose` setup initializes the DBs. To run manually, use `alembic upgrade head` in each service's directory (e.g. `backend/auth_service`, `backend/exam_service`, etc.).
