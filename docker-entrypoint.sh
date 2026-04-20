#!/bin/sh
# =============================================================================
# docker-entrypoint.sh — Let'z Pilates
# 1. Wait for Postgres
# 2. Push schema
# 3. Start Next.js server in background
# 4. Wait for server to be ready
# 5. Seed master admin via Better Auth HTTP endpoint
# 6. Hand off to server process (keeps container alive)
# =============================================================================
set -e

DB_HOST="${DB_HOST:-db}"
DB_PORT="${DB_PORT:-5432}"

# ── 1. Wait for Postgres ─────────────────────────────────────────────────────
echo "⏳ Waiting for database at ${DB_HOST}:${DB_PORT}..."
COUNT=0
until nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; do
  COUNT=$((COUNT + 1))
  if [ "$COUNT" -ge 30 ]; then
    echo "❌ Database not reachable after 30s. Exiting."
    exit 1
  fi
  echo "   ...waiting ($COUNT/30)"
  sleep 1
done
sleep 1
echo "✅ Database ready."

# ── 2. Push schema ───────────────────────────────────────────────────────────
echo "🔄 Pushing schema..."
node node_modules/prisma/build/index.js db push \
  --schema=./prisma/schema.prisma \
  --skip-generate \
  --accept-data-loss

# ── 3. Start server in background ────────────────────────────────────────────
echo "🚀 Starting server..."
node server.js &
SERVER_PID=$!

# ── 4. Wait for Next.js to be ready on port 3000 ─────────────────────────────
echo "⏳ Waiting for app server..."
COUNT=0
until nc -z localhost 3000 2>/dev/null; do
  COUNT=$((COUNT + 1))
  if [ "$COUNT" -ge 30 ]; then
    echo "⚠️  Server not ready after 30s — skipping seed."
    wait $SERVER_PID
    exit 0
  fi
  sleep 1
done
echo "✅ Server ready."

# ── 5. Seed master admin ─────────────────────────────────────────────────────
echo "🌱 Seeding master admin..."
node prisma/seed.js || echo "⚠️  Seed failed or admin already exists — continuing."

# ── 6. Hand off ──────────────────────────────────────────────────────────────
echo "✅ Let'z Pilates is ready."
wait $SERVER_PID