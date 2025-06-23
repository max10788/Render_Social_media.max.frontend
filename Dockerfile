# Basisimage mit einer stabilen Python-Version (3.11 oder 3.12)
FROM python:3.11-slim

# Arbeitsverzeichnis setzen
WORKDIR /app

# Requirements installieren
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Quelldateien kopieren
COPY . .

# App starten
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port $PORT"]
