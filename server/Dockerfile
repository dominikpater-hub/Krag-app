# Krąg — obraz produkcyjny cienkiego API (K-27/K-30).
FROM node:22-alpine
WORKDIR /app

# zależności (tsx uruchamia .ts bezpośrednio — trzymamy też devDependencies)
COPY package.json package-lock.json* ./
RUN npm ci || npm install

# kod + schemat
COPY tsconfig.json ./
COPY schema.sql ./
COPY src ./src

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

# migracja (idempotentna: schema.sql używa IF NOT EXISTS) → start
CMD ["sh", "-c", "npm run migrate && npm start"]
