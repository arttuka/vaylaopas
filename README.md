# Väyläopas

A web service for finding boating routes in Finland.

[https://vaylaopas.fi](https://vaylaopas.fi)

## Development

Start development server: `npm run watch`

Automatically run tests: `npm run test:watch`

You'll also need a running [map server](https://openmaptiles.com/server/)
with some map data. To populate database, download fairway data from [Väylävirasto](https://julkinen.vayla.fi/oskari/?lang=en)
and import it with `scripts/import.sh`.
