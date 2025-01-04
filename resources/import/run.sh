#!/bin/bash

set -euo pipefail

export PGHOST=${PGHOST:-db}
export PGPORT=${PGPORT:-5432}
export PGUSER=${PGUSER:-vaylaopas}
export PGPASSWORD=${PGPASSWORD:-vaylaopas}
INITFILE=${INITFILE:-init-db.sql}
SHAPEFILE=${SHAPEFILE:-vaylat.shp}

psql -a -1 vaylaopas < "$INITFILE"

shp2pgsql -e -s 3067 -W LATIN1 "$SHAPEFILE" public.lane_tmp \
  | psql -1 vaylaopas

npm run convert
