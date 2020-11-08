FROM postgis/postgis:13-3.0
RUN apt-get update && apt-get install -y curl postgis
RUN curl -sL https://deb.nodesource.com/setup_12.x | bash - 
RUN apt-get install -y nodejs

WORKDIR /app
COPY package.json package-lock.json tsconfig.json ./
RUN npm ci
COPY resources/vaylat_0/* resources/sql/init-db.sql resources/import/run.sh ./
RUN mkdir -p ./src/common ./src/convert ./src/server
COPY ./src/common/* ./src/common/
COPY ./src/convert/* ./src/convert/
COPY ./src/server/config.ts ./src/server/config.ts

CMD ["./run.sh"]
