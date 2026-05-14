FROM python:3.11-slim

WORKDIR /app

RUN pip install poetry

COPY pyproject.toml poetry.lock README.md ./
RUN poetry config virtualenvs.create false && poetry install --only main --no-root

COPY src/ ./src/

ENV PYTHONPATH=/app/src

CMD ["uvicorn", "natural_gate.main:app", "--host", "0.0.0.0", "--port", "8080"]
