FROM node:16.14.0-alpine3.14 AS base
RUN apk --no-cache add alpine-sdk python3 postgresql-dev findutils
WORKDIR /app
COPY package.json package-lock.json ./

FROM base AS builder
RUN npm ci
COPY src ./src
COPY .eslintrc.js .prettierrc.json babel.config.js jest.config.js tsconfig.json webpack.prod.js ./
RUN npm run lint && npm test && npm run build

FROM base
RUN npm ci --production
RUN apk del alpine-sdk python3 postgresql-dev findutils
COPY --from=builder /app/dist ./dist
CMD ["npm", "start"]
