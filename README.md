# SkillSphere Monorepo

SkillSphere is a hyperlocal freelance marketplace with AI-powered job matching, milestone-based escrow payments, and real-time collaboration tools.

This repository is set up as a monorepo containing the frontend client, the main API backend, a Python machine learning service, and documentation.

## Project Structure

```
skillsphere/
  ├── client/        - React application (bootstrapped with Vite)
  ├── server/        - Node.js + Express API backend
  ├── ml-service/    - Python FastAPI service (NLP matching)
  ├── docs/          - Documentation and diagrams
  ├── README.md      - This file
  └── .gitignore     - Global git ignore configuration
```

### Services Breakdown

* **`client/`**: React application using Vite, Tailwind CSS, Redux Toolkit, TanStack React Query, and Socket.io-client.
* **`server/`**: Express API using ES Modules. Connects to MongoDB via Mongoose, and features Socket.io connection support, authentication, and jobs scheduling.
* **`ml-service/`**: Python FastAPI microservice that computes semantic embedding matches between job descriptions and candidate profiles using `sentence-transformers`.

---

## Local Development (Without Docker)

You can run all three services locally in separate terminal tabs.

### Prerequisites
1. Ensure **Node.js (v18+)** and **npm** are installed.
2. Ensure **Python (3.10+)** is installed.
3. Ensure a local **MongoDB instance** is running on your machine (default port `27017`).

### Environment Configuration
Each service requires its own `.env` configuration file to run. Copy the provided `.env.example` templates to `.env` in each service directory:
* Client: `client/.env.example` -> `client/.env`
* Server: `server/.env.example` -> `server/.env`
* ML Service: `ml-service/.env.example` -> `ml-service/.env`

### Running the Services

#### Tab 1 (server): Core API Server
Run these commands to install dependencies and start the backend:
```bash
cd server
npm install
npm run dev
```

#### Tab 2 (client): React Dev Server
Run these commands to install dependencies and start the frontend:
```bash
cd client
npm install
npm run dev
```

#### Tab 3 (ml-service): Python FastAPI Service
Run these commands to activate the Python virtual environment and start uvicorn:
* **Linux/macOS:**
  ```bash
  cd ml-service
  source venv/bin/activate
  uvicorn app.main:app --reload --port 8001
  ```
* **Windows (PowerShell):**
  ```powershell
  cd ml-service
  .\venv\Scripts\Activate.ps1
  uvicorn app.main:app --reload --port 8001
  ```
