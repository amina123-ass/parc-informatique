# ──────────────────────────────────────────────────────────
# Dockerfile – Frontend React (Vite → Nginx)
# Build context : racine du projet
# ──────────────────────────────────────────────────────────

# ── Étape 1 : Build Vite ──────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Arguments de build (injectés depuis docker-compose)
ARG VITE_API_URL=http://192.168.1.45:8002/api
ARG VITE_APP_NAME="Parc Informatique"

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_APP_NAME=$VITE_APP_NAME

# Installer les dépendances (depuis frontend/)
COPY frontend/package.json frontend/package-lock.json* frontend/yarn.lock* ./
RUN npm install --frozen-lockfile 2>/dev/null || npm install

# Copier les sources frontend et builder
COPY frontend/ .
RUN npm run build

# ── Étape 2 : Nginx pour servir le build ─────────────────
FROM nginx:alpine

# Supprimer la config Nginx par défaut
RUN rm /etc/nginx/conf.d/default.conf

# Copier la config Nginx personnalisée (chemin depuis la racine)
COPY docker/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copier le build Vite
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
