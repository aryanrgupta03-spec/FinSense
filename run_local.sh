#!/usr/bin/env bash
# Quickstart script for local FinSense execution

set -e

echo "=== Starting FinSense Platform ==="

# Check Python venv
if [ ! -d "backend/venv" ]; then
    echo "Creating backend virtualenv..."
    python3 -m venv backend/venv
    backend/venv/bin/pip install -r backend/requirements.txt
fi

# Check frontend modules
if [ ! -d "frontend/node_modules" ]; then
    echo "Installing frontend dependencies..."
    (cd frontend && npm install)
fi

echo "Starting Backend on http://localhost:8000..."
(cd backend && PYTHONPATH=. venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload) &
BACKEND_PID=$!

echo "Starting Frontend on http://localhost:5173..."
(cd frontend && npm run dev) &
FRONTEND_PID=$!

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT

echo "FinSense is running!"
echo "• Frontend: http://localhost:5173"
echo "• Backend Docs: http://localhost:8000/docs"
echo "Press Ctrl+C to stop."

wait
