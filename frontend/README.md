# Drone Delivery DSS Frontend

React + Vite frontend for the Drone Delivery DSS project.

## Run

```bash
cd frontend
npm install
npm run dev
```

## Build

```bash
cd frontend
npm run build
```

## Environment

Set `VITE_API_BASE_URL` if your backend is not running on `http://localhost:8000/api/v1`.

Example:

```bash
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

The app also falls back to seeded local demo data when the backend is unavailable.
