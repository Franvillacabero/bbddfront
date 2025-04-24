# Use an official Node runtime as the base image
FROM node:18-alpine AS build

# Set working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install project dependencies
RUN npm install

# Copy project files into the docker image
COPY . .

# Build the app for production
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy the built app from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]