# AI Interview Assessment System

Full-stack portfolio project: **React** (Tailwind + Chart.js) → **Spring Boot** (JWT, MySQL) → **Flask** (resume PDF parsing, question generation, NLP-style scoring).

## Overview

This repository provides a complete interview practice platform:

- **Frontend:** React app with registration, resume upload, mock interview flow, and dashboard charts.
- **Backend:** Spring Boot REST API with JWT authentication, user management, resume storage, and interview result persistence.
- **AI service:** Python Flask microservice that extracts resume skills, generates questions, and analyzes interview answers.

The main use case is storing a resume, generating personalized interview questions, submitting spoken or typed answers, and reviewing AI-driven feedback.

## Repository layout

| Folder | Purpose |
|--------|---------|
| `frontend/` | React UI and client-side pages |
| `backend/` | Spring Boot API, security, and persistence |
| `ai-service/` | Flask microservice for resume parsing and interview scoring |
| `database/` | MySQL schema file and reference scripts |

## Prerequisites

- **Node.js 18+** and **npm**
- **JDK 17** and **Maven**
- **Python 3.10+**
- **MySQL 8** (or compatible)

## Setup Steps

### 1. Database

Create the database and apply the reference schema. If you use JPA auto-update, this step is optional but recommended for initial setup.

```bash
mysql -u root -p < database/schema.sql
```

Update DB credentials in `backend/src/main/resources/application.properties`:

```properties
spring.datasource.username=root
spring.datasource.password=your_password
```

### 2. AI service (Flask)

Install Python dependencies and start the microservice:

```bash
cd ai-service
python -m venv .venv
.venv\Scripts\activate          # Windows
pip install -r requirements.txt
python -m spacy download en_core_web_sm
python app.py
```

The service listens on **http://localhost:5000**.

> Keep this Flask server running before starting the backend. If it is not available, resume parsing and question generation will fall back to placeholder behavior.

### 3. Backend (Spring Boot)

Run the Spring Boot API:

```bash
cd backend
mvn spring-boot:run
```

The backend will start on **http://localhost:8080**. Adjust `app.ai.base-url` in `application.properties` if the Flask service runs elsewhere.

### 4. Frontend (React)

Install dependencies and start the web UI:

```bash
cd frontend
npm install
npm start
```

Open **http://localhost:3000** in your browser.

## Development notes

- Frontend dev requests to `/api/*` are proxied to the Spring backend via `frontend/package.json`.
- Production builds should set `REACT_APP_API_URL` to the backend API origin.
- The backend stores uploaded resumes in `backend/uploads/resumes/`.
- The Flask AI service uses `pdfplumber` for PDF extraction and spaCy for entity detection.

## Main API (JWT)

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/api/auth/register` | No | Register a new user |
| POST | `/api/auth/login` | No | Login and receive JWT token |
| GET | `/api/users/me` | Bearer | Fetch current user info |
| POST | `/api/resumes/upload` | Bearer | Upload PDF resume and receive skills/questions |
| POST | `/api/interviews/analyze` | Bearer | Submit question, answer, and keywords for scoring |
| GET | `/api/interviews/history` | Bearer | Retrieve past interview attempts |
| GET | `/api/interviews/keywords` | Bearer | Get latest resume skills for question generation |

## User flow

1. Register or login.
2. Upload a PDF resume.
3. Get skills and questions generated from the resume.
4. Practice interview answers using text or browser speech recognition.
5. Review AI feedback and historical scores on the dashboard.

## Troubleshooting

- If resume upload fails, verify the Flask service is running and `app.ai.base-url` is correct.
- If login fails, check backend logs and database connectivity.
- If the UI does not load, make sure React is running on port `3000` and backend on `8080`.

## Security note

Change `app.jwt.secret` and database credentials before sharing or deploying this repository publicly.
