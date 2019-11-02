FROM node:10-alpine AS base
RUN apk --no-cache add alpine-sdk python postgresql-dev findutils
WORKDIR /app
COPY package.json package-lock.json ./

FROM base AS builder
RUN npm ci
COPY src ./src
COPY .eslintrc.js .prettierrc.json jest.config.js tsconfig.json webpack.config.js ./
RUN npm run lint && npm test && npm run build

FROM base
RUN npm ci --production
RUN apk del alpine-sdk python postgresql-dev findutils
COPY --from=builder /app/dist ./dist
CMD ["npm", "start"]