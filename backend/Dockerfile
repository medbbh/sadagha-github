# Use Python 3.12 slim image
FROM python:3.12-slim

# Environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8080 \
    PIP_DEFAULT_TIMEOUT=100

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY . .

# Optional: Collect static files (safe way – won’t break build if env missing)
RUN python manage.py collectstatic --noinput || echo "Skipping collectstatic"

# Create non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Expose port (for documentation only)
EXPOSE 8080

# Run Gunicorn (bind to Cloud Run's $PORT)
CMD exec gunicorn sadagha.wsgi:application --bind :$PORT --workers 4 --threads 8 --timeout 0
