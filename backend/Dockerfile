FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

FROM build AS test
ENTRYPOINT ["npm", "run", "test:coverage"]

FROM build AS prod-deps
RUN npm prune --omit=dev

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=prod-deps /app/package.json ./package.json
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/src ./src
USER node
EXPOSE 8080
CMD ["node", "src/index.js"]
