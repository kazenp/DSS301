# Deployment & Running Guide

This guide explains how to set up the environments, install python packages, run the FastAPI backend, and open the Client & Admin web pages locally.

## Prerequisite
Ensure you have Python 3.9+ installed on your system.

## 1. Environment Setup

Clone or navigate to the workspace directory:
```bash
cd DSS301_Project
```

Install python packages from the root directory:
```bash
pip install -r requirements.txt
```

## 2. Start the Backend API

To start the server with auto-reload enabled (for development):
```bash
python -m backend.app
```
Or use uvicorn command:
```bash
uvicorn backend.app:app --host 0.0.0.0 --port 8000 --reload
```

Verify backend is running by opening:
- API Root: [http://localhost:8000/](http://localhost:8000/)
- Swagger API documentation: [http://localhost:8000/docs](http://localhost:8000/docs)

## 3. Run the Frontend Applications

Since the frontend is built using vanilla HTML/CSS/JS, you can run them directly by opening the files in a browser:
- Client Page: Open [frontend/client/index.html](file:///c:/Users/DELL/OneDrive/Desktop/DSS301/DSS301_Project/frontend/client/index.html) in your browser.
- Admin Page: Open [frontend/admin/index.html](file:///c:/Users/DELL/OneDrive/Desktop/DSS301/DSS301_Project/frontend/admin/index.html) in your browser.

> [!NOTE]
> Make sure the backend server is running on `http://localhost:8000` so that the AJAX fetch calls succeed.
