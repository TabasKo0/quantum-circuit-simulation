# Multi-stage Dockerfile for single-Render deployment running both Next (frontend) and Python backend
FROM node:18-bullseye AS frontend-builder
WORKDIR /app/frontend

# install deps (adjust if you use yarn)
COPY frontend/package*.json ./
RUN npm ci

# copy frontend source and build
COPY frontend/ .
RUN npm run build

FROM node:18-bullseye
# Install python, pip, nginx, supervisor and envsubst (gettext-base)
RUN apt-get update && apt-get install -y \
    python3 python3-pip nginx supervisor gettext-base curl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy built frontend artifacts and package.json so next start works
COPY --from=frontend-builder /app/frontend/.next ./frontend/.next
COPY --from=frontend-builder /app/frontend/public ./frontend/public
COPY --from=frontend-builder /app/frontend/package*.json ./frontend/

# Install production node deps for next start
WORKDIR /app/frontend
RUN npm ci --only=production

# Copy backend code and install python deps
WORKDIR /app
COPY backend/ ./backend
RUN if [ -f backend/requirements.txt ]; then pip3 install --no-cache-dir -r backend/requirements.txt; fi

# Copy supervisor + nginx template + start script
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Expose internal ports (nginx will bind to $PORT at runtime)
EXPOSE 3000 8000 80

# Start script substitutes $PORT into nginx config and starts supervisord
CMD ["/start.sh"]