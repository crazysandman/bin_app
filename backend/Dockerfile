# Basis-Image mit Python
FROM python:3.9-slim

# Arbeitsverzeichnis im Container festlegen
WORKDIR /app

# Abhängigkeiten installieren
COPY requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt

# Backend-Code kopieren
COPY . .

# Port freigeben (FastAPI läuft standardmäßig auf 8000)
EXPOSE 8000

# Startbefehl für das Backend
CMD ["uvicorn", "backend:app", "--host", "0.0.0.0", "--reload"]
