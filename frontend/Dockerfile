# Basis-Image mit Node.js
FROM node:16

# Arbeitsverzeichnis im Container festlegen
WORKDIR /app

# Abhängigkeiten installieren
COPY package.json package-lock.json ./
RUN npm install

# Frontend-Code kopieren
COPY . .

# Port freigeben (React läuft standardmäßig auf 3000)
EXPOSE 3000

# Startbefehl für das Frontend
CMD ["npm", "start"]
