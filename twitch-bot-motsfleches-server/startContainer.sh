#!/usr/bin/env bash

docker run \
  -d \
  --rm \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/.env:/app/.env \
  -p 4000:4000 \
  --name twitch-bot-motsfleches-server \
  teuteuf/twitch-bot-motsfleches-server