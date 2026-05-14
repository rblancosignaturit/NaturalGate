#!/bin/sh
set -e

echo "Initializing database..."
python -c "
import sys
sys.path.insert(0, '/app/src')
from natural_gate.shared.infrastructure.init_db import init_db
init_db()
"

echo "Starting API server..."
exec uvicorn natural_gate.main:app --host 0.0.0.0 --port 8080
