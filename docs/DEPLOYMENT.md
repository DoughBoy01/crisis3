# Cloudflare Deployment Guide

## Architecture Overview

This project uses **Cloudflare Pages** for the frontend and **Cloudflare Workers** for Durable Objects.

```
┌─────────────────────────────────────────────────────────────┐
│  Cloudflare Pages (crisis2)                                 │
│  - React Frontend (dist/)                                   │
│  - Pages Functions (functions/*.ts)                         │
│  - Bindings: DB, JWT_SECRET, MARKET_FEED_ROOM              │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  Cloudflare Worker (crisis2-durable-objects)               │
│  - Durable Object: MarketFeedRoom                          │
│  - WebSocket connection management                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

1. **Cloudflare Account** with Pages and Workers enabled
2. **Wrangler CLI** installed: `npm install -g wrangler`
3. **Authenticated**: `wrangler login`

---

## Step 1: Create D1 Database

```bash
# Create D1 database
wrangler d1 create crisis2-db

# Copy the database_id from output
# database_id: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

Save the `database_id` for later.

---

## Step 2: Deploy Durable Objects Worker

The Durable Objects **must be deployed as a separate Worker** before Pages.

```bash
# Deploy the Durable Objects Worker
wrangler deploy --config wrangler-worker.jsonc

# Output should show:
# ✅ Deployed crisis2-durable-objects
```

**What this does:**
- Deploys `MarketFeedRoom` Durable Object class
- Creates the Worker at: `crisis2-durable-objects.your-subdomain.workers.dev`

---

## Step 3: Configure Cloudflare Pages (Dashboard)

### 3.1 Create Pages Project

1. Go to **Cloudflare Dashboard** → **Pages**
2. Click **Create a project** → **Connect to Git**
3. Select your repository: `Dawnsignal17_3/crisis2`
4. **Project name:** `crisis2`

### 3.2 Build Configuration

**CRITICAL:** Set the correct build command:

```
Framework preset: None (or Vite)
Build command: npm run build
Build output directory: dist
```

**DO NOT USE:** `npx wrangler deploy` (this is for Workers, not Pages)

### 3.3 Environment Variables

Add these in **Settings** → **Environment variables**:

```
VITE_SUPABASE_URL=<not used anymore - can be removed>
VITE_SUPABASE_ANON_KEY=<not used anymore - can be removed>
NODE_VERSION=18
```

---

## Step 4: Add Bindings to Pages (Dashboard)

Go to **Pages Project** → **Settings** → **Functions** → **Bindings**

### 4.1 Add D1 Database Binding

- **Type:** D1 Database
- **Variable name:** `DB`
- **D1 Database:** `crisis2-db` (select from dropdown)

### 4.2 Add Durable Object Binding

- **Type:** Durable Object
- **Variable name:** `MARKET_FEED_ROOM`
- **Durable Object:** `MarketFeedRoom`
- **Script name:** `crisis2-durable-objects` (the Worker deployed in Step 2)

### 4.3 Add Secret (JWT_SECRET)

In **Settings** → **Environment variables** → **Add**:

- **Variable name:** `JWT_SECRET`
- **Value:** (generate a secure random string)
- **Type:** Secret (encrypted)

```bash
# Generate a secure JWT secret
openssl rand -base64 32
```

---

## Step 5: Deploy Pages

### Option A: Deploy via Git Push (Recommended)

```bash
git add .
git commit -m "Add Cloudflare configuration"
git push origin main
```

Cloudflare will automatically build and deploy on push.

### Option B: Manual Deploy

```bash
# Build locally
npm run build

# Deploy to Pages
npx wrangler pages deploy dist --project-name=crisis2
```

---

## Step 6: Initialize D1 Database Schema

Once deployed, run your database migrations:

```bash
# Apply schema to production D1 database
wrangler d1 execute crisis2-db --file=./schemas/schema.sql --remote

# Or run migrations one by one if needed
wrangler d1 execute crisis2-db --command="CREATE TABLE users (...)" --remote
```

---

## Verification Checklist

After deployment, verify everything works:

- [ ] **Pages deployed successfully**
  - Visit: `https://crisis2.pages.dev`

- [ ] **Durable Objects Worker deployed**
  - Check: Cloudflare Dashboard → Workers & Pages → `crisis2-durable-objects`

- [ ] **D1 Database created and bound**
  - Run: `wrangler d1 info crisis2-db`

- [ ] **Bindings configured in Pages**
  - Check: Pages Settings → Functions → Bindings
  - Should see: `DB`, `MARKET_FEED_ROOM`, `JWT_SECRET`

- [ ] **WebSocket connection works**
  - Test: `wss://crisis2.pages.dev/api/feed_cache/connect`
  - Browser console should show: `[useMarketFeeds] WebSocket connected`

- [ ] **API endpoints respond**
  - Test: `https://crisis2.pages.dev/api/auth/me`
  - Should return 401 (if not logged in) or user data

---

## Troubleshooting

### Issue 1: "No Durable Object binding found"

**Cause:** Durable Objects Worker not deployed or binding not configured

**Fix:**
1. Deploy DO Worker: `wrangler deploy --config wrangler-worker.jsonc`
2. Add binding in Pages Dashboard → Functions → Bindings
3. Redeploy Pages

### Issue 2: "D1 database not found"

**Cause:** Database not created or binding incorrect

**Fix:**
1. Create DB: `wrangler d1 create crisis2-db`
2. Update binding in Pages Dashboard with correct database_id
3. Redeploy Pages

### Issue 3: "Build failed: wrangler.jsonc error"

**Cause:** Invalid JSON in wrangler.jsonc

**Fix:**
1. Validate JSON: `npx jsonlint wrangler.jsonc`
2. Check for trailing commas (not allowed in JSON)
3. Comments are allowed in `.jsonc` but not `.json`

### Issue 4: "Functions not working"

**Cause:** Incorrect build output directory

**Fix:**
1. Ensure `pages_build_output_dir: "dist"` in wrangler.jsonc
2. Ensure `functions/` folder is at repo root (not inside dist/)
3. Check build command is `npm run build` (not `npx wrangler deploy`)

---

## Development Workflow

### Local Development

```bash
# Terminal 1: Run Vite dev server
npm run dev

# Terminal 2: Run Wrangler Pages dev server (with bindings)
npx wrangler pages dev dist --compatibility-date=2024-01-01 --compatibility-flags=nodejs_compat --binding DB=... MARKET_FEED_ROOM=...
```

**Note:** Local Durable Objects require `wrangler pages dev` or `wrangler dev --local`

### Testing Locally

```bash
# Build for production
npm run build

# Test with local Workers runtime
npx wrangler pages dev dist --local --persist
```

---

## CI/CD with GitHub Actions (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: crisis2
          directory: dist
```

---

## Cost Estimate

### Free Tier Limits

- **Pages:** Unlimited requests, 500 builds/month
- **Workers:** 100,000 requests/day
- **Durable Objects:** 1M requests/month free, then $0.15/M
- **D1:** 5M rows read/day, 100K rows written/day

**Expected monthly cost:** ~$0-5 for typical usage

---

## Security Checklist

- [ ] `JWT_SECRET` set as encrypted environment variable
- [ ] D1 database not exposed publicly (access via Workers only)
- [ ] CORS configured properly in `_middleware.ts`
- [ ] Rate limiting enabled on auth endpoints
- [ ] WebSocket connections authenticated

---

## Useful Commands

```bash
# View Pages deployment logs
wrangler pages deployment tail

# View Durable Objects logs
wrangler tail crisis2-durable-objects

# List D1 databases
wrangler d1 list

# Query D1 database
wrangler d1 execute crisis2-db --command="SELECT * FROM users LIMIT 5" --remote

# Test WebSocket locally
wscat -c wss://crisis2.pages.dev/api/feed_cache/connect
```

---

## Next Steps After Deployment

1. **Set up scheduled cron jobs** (Workers Cron Triggers)
   - Fetch market feeds every 15 minutes
   - Generate daily briefs at 6am UTC
   - Run data scout agent overnight

2. **Configure monitoring** (Cloudflare Logpush, Analytics)
   - Error tracking
   - Performance metrics
   - WebSocket connection health

3. **Set up backups** (D1 automatic backups)
   - Enable point-in-time recovery
   - Export critical data periodically

4. **Add custom domain** (Pages → Custom domains)
   - `dawnsignal.com` → crisis2.pages.dev
   - SSL/TLS automatically managed

---

## Support

- **Cloudflare Docs:** https://developers.cloudflare.com/pages/
- **Wrangler Docs:** https://developers.cloudflare.com/workers/wrangler/
- **Durable Objects:** https://developers.cloudflare.com/durable-objects/

For issues specific to this project, see:
- [docs/WEBSOCKET-UPGRADE.md](WEBSOCKET-UPGRADE.md)
- [docs/BROKEN-FILES-FIXED.md](BROKEN-FILES-FIXED.md)
