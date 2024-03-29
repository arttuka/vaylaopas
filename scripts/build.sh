#!/bin/bash
set -euo pipefail

version=$(git log --pretty=format:'%h' -n 1)
tag=arttuka/vaylaopas:$version

docker build . -t $tag
docker tag $tag arttuka/vaylaopas:latest
