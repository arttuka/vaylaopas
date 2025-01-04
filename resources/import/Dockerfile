FROM imresamu/postgis:16-3.4
RUN apt-get update && apt-get install -y curl postgis
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - 
RUN apt-get install -y nodejs

WORKDIR /app
COPY package.json package-lock.json tsconfig.json ./
RUN npm ci
COPY resources/vaylat/* resources/sql/init-db.sql resources/import/run.sh ./
RUN mkdir -p ./src/common ./src/convert ./src/server
COPY ./src/common/* ./src/common/
COPY ./src/convert/* ./src/convert/
COPY ./src/server/config.ts ./src/server/config.ts

CMD ["./run.sh"]
