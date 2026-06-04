# RouteCare API — production image
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /code

# Install dependencies first for better layer caching.
# (psycopg2-binary ships wheels, so no system build deps are needed.)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application (app/, frontend/, database/, migrations/, scripts/, alembic.ini)
COPY . .

EXPOSE 8000

# Single Uvicorn process: the in-memory WebSocket manager requires one process.
# To scale horizontally, move broadcasts to a shared pub/sub (e.g. Redis) first.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
