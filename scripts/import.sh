#!/bin/bash

set -euo pipefail

docker build . -t arttuka/vaylaopas-import -f ./resources/import/Dockerfile
docker run --rm -t --network=vaylaopas_default arttuka/vaylaopas-import
