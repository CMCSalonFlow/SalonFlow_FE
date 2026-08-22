# =========================================================================
# Stage 1: Build Frontend Application
# =========================================================================
FROM node:20-alpine AS build

WORKDIR /app

# Copy dependency manifests
COPY package.json package-lock.json ./

# Install clean dependencies
RUN npm ci

# Copy source code
COPY . .

# Build production bundle
RUN npm run build

# =========================================================================
# Stage 2: Production Nginx Server
# =========================================================================
FROM nginx:alpine

# Copy built assets to Nginx html directory
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx SPA configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
