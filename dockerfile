# Etapa 1: construir el frontend
FROM node:18-alpine AS build-stage
WORKDIR /app
COPY . .
RUN npm install && npm run build

# Etapa 2: servir con Nginx
FROM nginx:alpine AS production-stage

# Copia el build al HTML público de Nginx
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Copia configuración de Nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Copia certificados (asegúrate de tenerlos en ./ssl/)
COPY ssl /etc/nginx/ssl
