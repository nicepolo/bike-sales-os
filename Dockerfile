# --- Stage 1：build 前端 ---
FROM node:20-slim AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# --- Stage 2：Python 後端 runtime，直接 serve 前端 build 出來的靜態檔 ---
FROM python:3.12-slim
WORKDIR /app

COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./
COPY --from=frontend-build /app/frontend/dist ./app/static

EXPOSE 8080
CMD ["sh", "-c", "flask --app wsgi.py db upgrade && gunicorn wsgi:app --bind 0.0.0.0:${PORT:-8080}"]
