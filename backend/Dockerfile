FROM python:3.11-slim

WORKDIR /app

RUN pip install poetry

COPY pyproject.toml poetry.lock ./
RUN poetry config virtualenvs.create false && poetry install --no-dev

COPY src/ ./src/

ENV PYTHONPATH=/app

CMD ["uvicorn", "natural_gate.main:app", "--host", "0.0.0.0", "--port", "8080"]
