# ---- build stage ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL
ARG VITE_MOCK_LOGIN_ENABLED=false
ARG VITE_BASE_PATH=
ARG VITE_APP_MODE=staff
ARG VITE_AUTH_PROVIDER=portal
ARG VITE_PORTAL_LOGIN_URL=https://office.eng.kps.ku.ac.th/eng-main/home
ARG VITE_PORTAL_LOGOUT_URL=
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_MOCK_LOGIN_ENABLED=$VITE_MOCK_LOGIN_ENABLED
ENV VITE_BASE_PATH=$VITE_BASE_PATH
ENV VITE_APP_MODE=$VITE_APP_MODE
ENV VITE_AUTH_PROVIDER=$VITE_AUTH_PROVIDER
ENV VITE_PORTAL_LOGIN_URL=$VITE_PORTAL_LOGIN_URL
ENV VITE_PORTAL_LOGOUT_URL=$VITE_PORTAL_LOGOUT_URL
RUN npm run build

# ---- runtime stage ----
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
