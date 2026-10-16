#!/bin/bash

# PRODUCTION
git reset --hard
git checkout main
git pull origin main

# Recreate, so the container builds and starts the new code (a plain `up -d` would keep it running).
docker compose up -d --force-recreate
