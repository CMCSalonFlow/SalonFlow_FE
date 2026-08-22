# =========================
# Stage 1: Build React/Vite
# =========================
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

ARG VITE_API_URL=/api
ARG VITE_MONITORING_ENABLED=false
ARG VITE_GRAFANA_URL=

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_MONITORING_ENABLED=$VITE_MONITORING_ENABLED
ENV VITE_GRAFANA_URL=$VITE_GRAFANA_URL

RUN npm run build


# =========================
# Stage 2: Nginx
# =========================
FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]