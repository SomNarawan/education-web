# syntax=docker/dockerfile:1

# One Dockerfile, two sites (VITE_APP_MODE):
#   staff   - office.eng.kps.ku.ac.th, port 3008, built by ../education-api/docker-compose.yml
#   student - eng.kps.ku.ac.th, port 3007, built by docker-compose.public.yml
#
# VITE_* build args are baked in at build time - rebuild after changing them.
# The site answers both with and without its base path in the URL, so it works
# whether or not the reverse proxy strips the prefix.
#
# Student site: set API_UPSTREAM at run time and build with
# VITE_API_URL=<VITE_BASE_PATH>/api - nginx then forwards /api/* to the API on
# the other server (docker/nginx/40-api-proxy.sh).

# ---- build ----
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .

ARG VITE_API_URL
ARG VITE_MOCK_LOGIN_ENABLED=false
ARG VITE_BASE_PATH=
ARG VITE_APP_MODE=staff
ENV VITE_API_URL=$VITE_API_URL \
    VITE_MOCK_LOGIN_ENABLED=$VITE_MOCK_LOGIN_ENABLED \
    VITE_BASE_PATH=$VITE_BASE_PATH \
    VITE_APP_MODE=$VITE_APP_MODE

# The base path is read back from the built index.html, so the nginx config
# always matches what was actually built.
RUN npm run build \
    && base="$(sed -n 's#.*src="\([^"]*\)/assets/.*#\1#p' dist/index.html | head -n 1)" \
    && if [ -n "$base" ]; then rewrite="rewrite ^${base}(?:/(.*))?\$ /\$1 last;"; else rewrite=""; fi \
    && if [ "$VITE_APP_MODE" = "student" ]; then service=web-public; else service=web; fi \
    && sed -e "s#__BASE_PATH_REWRITE__#${rewrite}#" -e "s#__SERVICE__#${service}#g" \
           docker/nginx/default.conf.template > dist.nginx.conf

# ---- runtime ----
FROM nginx:1.27-alpine

# Root URL of the API for the student site's proxy; empty = no proxy (staff site).
ENV API_UPSTREAM=

COPY --from=build /app/dist.nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
COPY --chmod=755 docker/nginx/40-api-proxy.sh /docker-entrypoint.d/40-api-proxy.sh
RUN mkdir -p /etc/nginx/api-proxy

EXPOSE 80 3007 3008

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD wget -qO /dev/null http://127.0.0.1/healthz || exit 1
