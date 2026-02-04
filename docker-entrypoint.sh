#!/bin/sh
set -e

# Validate required environment variables
: "${DATABASE_URL:?DATABASE_URL not set}"
: "${AUTH_SECRET:?AUTH_SECRET not set}"
: "${APP_URL:?APP_URL not set}"

echo "Environment validation passed"

# Start application
exec "$@"
