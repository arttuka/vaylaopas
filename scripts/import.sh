#!/bin/bash

set -euo pipefail

help() {
  cat <<EOF
Usage: ${0##*/} shapefile
Import data from given shapefile
EOF
}

if [[ ! $# -eq 1 ]]; then
  help
  exit 1
fi

host=${PGHOST:-localhost}

shp2pgsql -e -s 3067 -W LATIN1 "$1" public.lane_tmp \
  | psql "-h$host" -Uvaylaopas -1 vaylaopas

npm run convert
