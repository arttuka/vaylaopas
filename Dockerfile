FROM node:22-alpine3.19 AS base
RUN apk --no-cache add alpine-sdk python3 postgresql-dev findutils
WORKDIR /app
COPY package.json package-lock.json ./

FROM base AS builder
RUN npm ci
COPY src ./src
COPY config.json vite.config.mjs eslint.config.mjs .prettierrc.json jest.config.js tsconfig.json ./
RUN npm run lint && npm test && npm run build

FROM base
RUN npm ci --production
RUN apk del alpine-sdk python3 postgresql-dev findutils
COPY --from=builder /app/dist ./dist
COPY src/server ./dist/server
COPY src/common ./dist/common
COPY tsconfig.json ./
CMD ["npm", "start"]
