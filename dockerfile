# Etapa 1: build del frontend Vue
FROM node:18-alpine AS build-stage
WORKDIR /app
COPY . .
RUN npm install && npm run build

# Etapa 2: servir build estático (sin SSL)
FROM nginx:alpine AS production-stage

# Copiamos solo los archivos construidos
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Copiamos la configuración de nginx personalizada
COPY nginx-frontend.conf /etc/nginx/nginx.conf

# Importante: NO copiamos certificados
# Nginx externo se encargará del SSL