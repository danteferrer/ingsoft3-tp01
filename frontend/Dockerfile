FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

FROM build AS test
ENTRYPOINT ["npm", "run", "test:coverage"]

FROM build AS built
RUN npm run build

FROM nginx:alpine
COPY --from=built /app/dist /usr/share/nginx/html
# La imagen oficial de nginx procesa todo archivo *.template de esta carpeta
# al arrancar (envsubst) y escribe el resultado en conf.d/ con el mismo
# nombre sin ".template" — no hace falta ningún script propio.
COPY templates/default.conf.template /etc/nginx/templates/default.conf.template
ENV BACKEND_URL=http://backend:8080 \
    NGINX_RESOLVER=127.0.0.11
RUN chown -R nginx:nginx /var/cache/nginx /var/run /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown nginx:nginx /var/run/nginx.pid
USER nginx
EXPOSE 8080
