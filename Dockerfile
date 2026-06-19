# ── Build frontend ────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package*.json ./
COPY frontend/package*.json ./frontend/
RUN npm install
RUN cd frontend && npm install
COPY . .
RUN npm run build

# ── Production image ──────────────────────────────────────────────────────────
FROM node:22-alpine
WORKDIR /app

# native module build tools (needed for better-sqlite3)
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm install --omit=dev

# copy backend source + built frontend
COPY backend ./backend
COPY --from=builder /app/frontend/dist ./frontend/dist

# SQLite lives on the persistent volume mounted at /data
RUN mkdir -p /data
ENV DB_PATH=/data/wellbuddy.db
ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "backend/server.js"]
