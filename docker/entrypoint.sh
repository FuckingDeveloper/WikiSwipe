#!/bin/sh
set -eu

mkdir -p /data

export DATABASE_URL="${DATABASE_URL:-file:/data/dev.db}"

npx prisma db push --skip-generate

exec npm run start -- -p "${PORT:-3000}"
