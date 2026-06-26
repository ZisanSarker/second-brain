FROM python:3.13-slim

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install uv using official binary copy
COPY --from=ghcr.io/astral-sh/uv:0.6.12 /uv /uvx /bin/
ENV UV_SYSTEM_PYTHON=1

WORKDIR /app

# Copy configuration files
COPY pyproject.toml .

# Install dependencies system-wide (using uv)
RUN uv pip compile pyproject.toml -o requirements.txt && \
    uv pip install --no-cache --system -r requirements.txt && \
    rm requirements.txt

# Copy main code
COPY main.py .

EXPOSE 8000

CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
