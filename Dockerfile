# ---- build stage ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL
ARG VITE_MOCK_LOGIN_ENABLED=false
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_MOCK_LOGIN_ENABLED=$VITE_MOCK_LOGIN_ENABLED
RUN npm run build

# ---- runtime stage ----
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
