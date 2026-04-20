# Running ClubSynk Locally with Docker

This guide walks you from zero to a fully running ClubSynk instance on your machine using Docker.

---

## Prerequisites

Make sure you have these installed:

| Tool | Min Version | Check |
|------|-------------|-------|
| Docker Desktop | 4.x | `docker --version` |
| Docker Compose | v2 (bundled with Desktop) | `docker compose version` |

> **Note:** Docker Compose v2 uses `docker compose` (no hyphen). If you have the older v1, use `docker-compose` instead.

---

## Step 1 — Clone / unzip the project

```bash
# If from zip:
unzip clubsynk.zip
cd clubsynk

# If from git:
git clone <your-repo-url> clubsynk
cd clubsynk
```

---

## Step 2 — Create your `.env` file

```bash
cp .env.example .env
```

Open `.env` and set your values. For local Docker dev, the defaults already work — the only thing you **must** change is the auth secret:

```env
# Generate a secure secret:
#   macOS/Linux: openssl rand -base64 32
#   Windows:     node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

BETTER_AUTH_SECRET="paste-your-generated-secret-here"

# Everything else can stay as-is for local dev:
DATABASE_URL="postgresql://clubsynk:clubsynk@db:5432/clubsynk?schema=public"
DATABASE_URL_UNPOOLED="postgresql://clubsynk:clubsynk@db:5432/clubsynk?schema=public"
BETTER_AUTH_URL="http://localhost:3000"
MASTER_ADMIN_EMAIL="admin@clubsynk.com"
MASTER_ADMIN_PASSWORD="ChangeMe123!"
MASTER_ADMIN_NAME="Master Admin"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## Step 3 — Build and start the stack

```bash
docker compose up --build
```

This single command will:
1. **Pull** the Postgres 16 image
2. **Build** the Next.js app image (multi-stage, ~2–3 min first time)
3. **Start** both containers
4. **Wait** for Postgres to be healthy
5. **Run** `prisma migrate deploy` (creates all tables)
6. **Seed** the master admin account
7. **Start** the Next.js server on port 3000

You'll see output like:
```
clubsynk_db   | database system is ready to accept connections
clubsynk_app  | ✅ Database is ready.
clubsynk_app  | 🔄 Running Prisma migrations...
clubsynk_app  | 🌱 Seeding master admin (skips if already exists)...
clubsynk_app  | ✅ Master admin created: admin@clubsynk.com
clubsynk_app  | 🚀 Starting ClubSynk...
clubsynk_app  | ✓ Ready on http://0.0.0.0:3000
```

---

## Step 4 — Open the app

```
http://localhost:3000/login
```

Sign in with:
- **Email:** `admin@clubsynk.com` (or whatever you set in `.env`)
- **Password:** `ChangeMe123!` (or whatever you set in `.env`)

You'll be redirected to `/admin/members`.

---

## Day-to-day commands

```bash
# Start in background (detached)
docker compose up -d

# View live logs
docker compose logs -f app

# View database logs
docker compose logs -f db

# Stop everything
docker compose down

# Stop and wipe the database volume (full reset)
docker compose down -v

# Rebuild after code changes
docker compose up --build

# Open a shell inside the running app container
docker compose exec app sh

# Run Prisma Studio (DB GUI) — from your HOST machine, not Docker
# First install deps locally: pnpm install
# Then:
DATABASE_URL="postgresql://clubsynk:clubsynk@localhost:5432/clubsynk" npx prisma studio
```

---

## Connecting a database GUI

The Postgres container exposes port `5432` on your host. Use these credentials in TablePlus, DBeaver, or any Postgres client:

| Field    | Value       |
|----------|-------------|
| Host     | `localhost` |
| Port     | `5432`      |
| Database | `clubsynk`  |
| User     | `clubsynk`  |
| Password | `clubsynk`  |

---

## Adding shadcn/ui components

shadcn components must be added from your **host machine** (not inside Docker), then rebuild:

```bash
# On your host machine (requires Node.js installed)
pnpm install
pnpx shadcn@latest add button input label

# Then rebuild the Docker image
docker compose up --build
```

> **Why only 3?** Table, dialog, badge, checkbox, select, and alert-dialog are all built with plain HTML + Tailwind in this project — no shadcn wrappers needed. This avoids the broken `toast` registry entry and keeps the bundle lean.

> **Note on toasts:** shadcn removed `toast` from its registry. This project uses **Sonner** directly (`import { toast } from "sonner"`), which is already in `package.json`. The `<Toaster>` is mounted in `src/app/layout.tsx` — no extra install needed.

---

## Troubleshooting

### Port 3000 already in use
```bash
# Find and kill what's using port 3000
lsof -ti:3000 | xargs kill -9   # macOS/Linux
netstat -ano | findstr :3000     # Windows (then taskkill /PID <pid> /F)
```

### Port 5432 already in use (local Postgres running)
Edit `docker-compose.yml` and change the host port:
```yaml
ports:
  - "5433:5432"   # Use 5433 on your host instead
```

### Database connection refused
The app container starts before Postgres is fully ready. The entrypoint script retries for 30 seconds. If it still fails, increase `MAX_RETRIES` in `docker-entrypoint.sh`.

### Fresh start (wipe everything)
```bash
docker compose down -v          # Remove containers + volumes
docker compose up --build       # Rebuild from scratch
```

### Prisma schema changes
After editing `prisma/schema.prisma`:
```bash
# Generate a new migration on your host machine
DATABASE_URL="postgresql://clubsynk:clubsynk@localhost:5432/clubsynk" \
  npx prisma migrate dev --name your_migration_name

# Then rebuild Docker so the new migration file is included
docker compose up --build
```

---

## Production (Vercel)

For Vercel deployment, you don't use Docker. Instead:

1. Push code to GitHub
2. Import repo in Vercel
3. Add a **Vercel Postgres** database in the Storage tab
4. Copy the env vars Vercel provides (`DATABASE_URL`, `DATABASE_URL_UNPOOLED`) into your project's Environment Variables
5. Add `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` (set to your Vercel domain)
6. Deploy — Vercel runs `prisma generate && next build` automatically via the `build` script in `package.json`
7. After first deploy, run the seed once from your local machine:
   ```bash
   DATABASE_URL="<vercel-postgres-url>" \
   BETTER_AUTH_URL="https://your-app.vercel.app" \
   BETTER_AUTH_SECRET="<your-secret>" \
     npx tsx prisma/seed.ts
   ```
