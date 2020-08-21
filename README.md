# Väyläopas

A web service for finding boating routes in Finland.

[https://vaylaopas.fi](https://vaylaopas.fi)

## Development

### Initialize mapserver

Download base map from [openmaptiles.com](https://openmaptiles.com/downloads/tileset/osm/europe/finland/), nautical charts from [https://github.com/vokkim/rannikkokartat-mbtiles](https://github.com/vokkim/rannikkokartat-mbtiles) and put the `mbtiles` files in `./resources/openmaptiles/`. Check that the filename of the base map matches the filename in `./resources/openmaptiles/styles/vaylaopas.json:15` and update the JSON file if necessary.

Start mapserver: `docker-compose up -d mapserver`

### Initialize DB

Start database: `docker-compose up -d db`

Import lane data: `./scripts/import.sh`

### Run development server

Start development server: `npm run watch`. The server will run at [localhost:8081](http://localhost:8081).

Automatically run tests: `npm run test:watch`
