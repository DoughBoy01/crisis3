# FIX: Remove Custom Deploy Command

## ❌ Error in Build Logs

```
Executing user deploy command: npx wrangler deploy
▲ [WARNING] It seems that you have run `wrangler deploy` on a Pages project
✘ [ERROR] Missing entry-point to Worker script
Failed: error occurred while running deploy command
```

---

## 🔧 THE FIX

You need to **REMOVE** the custom deploy command from your Pages project settings.

### Step-by-Step Instructions:

1. **Go to Cloudflare Dashboard**
   - Navigate to: https://dash.cloudflare.com

2. **Select your Pages project**
   - Workers & Pages → crisis2 (or your project name)

3. **Go to Settings**
   - Click **Settings** tab

4. **Find Build & deployments section**
   - Scroll to **Build configuration**

5. **REMOVE the deploy command**
   - Find field: **Deploy command** or **Custom build command**
   - Current value: `npx wrangler deploy` ❌
   - **DELETE THIS** - leave it **EMPTY** ✅

6. **Verify Build Settings**

Your settings should look like this:

```
Framework preset: None (or Vite)
Build command: npm run build
Build output directory: dist
Root directory: (leave empty or /)
Deploy command: (LEAVE EMPTY!)
```

7. **Save and Retry Deployment**
   - Click **Save**
   - Go to **Deployments** tab
   - Click **Retry deployment** on the latest failed build

---

## Why This Happens

When you create a Pages project via the CLI with `wrangler pages create`, it sometimes sets a custom deploy command. This command is for **Workers**, not **Pages**.

**Workers vs Pages:**
- `wrangler deploy` = Deploy a Worker ❌ (not for Pages)
- `wrangler pages deploy` = Deploy Pages manually ✅ (only if not using Git)
- **Git-based Pages** = No custom command needed ✅ (Cloudflare handles it)

---

## Alternative: Manual Deploy via CLI

If you prefer to deploy manually instead of via Git:

```bash
# Build locally
npm run build

# Deploy to Pages
npx wrangler pages deploy dist --project-name=crisis2
```

But for **Git-connected projects**, just push to your repo and let Cloudflare handle the build automatically (no custom command needed).

---

## Screenshot Guide

### Before (WRONG) ❌
```
Build command: npm run build
Deploy command: npx wrangler deploy  ← DELETE THIS
```

### After (CORRECT) ✅
```
Build command: npm run build
Deploy command: (empty)
```

---

## Verification

After removing the deploy command and retrying, you should see:

```
✓ Build command completed
✓ Deployment succeeded
🎉 Successfully deployed to https://crisis2.pages.dev
```

---

## If It Still Fails

1. **Check your wrangler.jsonc:**
   ```bash
   cat wrangler.jsonc
   ```
   Should have:
   ```jsonc
   {
     "name": "crisis2",
     "pages_build_output_dir": "dist"
   }
   ```

2. **Verify the functions folder:**
   ```bash
   ls -la functions/
   ```
   Should show your Pages Functions

3. **Clear cache and redeploy:**
   - In Cloudflare Dashboard → Deployments
   - Click on failed deployment → "Retry deployment"
   - Check "Clear cache before building"

---

## Summary

**Do this NOW:**
1. Go to Pages Settings in Cloudflare Dashboard
2. **Delete** the deploy command field (leave empty)
3. Save settings
4. Retry deployment

That's it! Your Pages project will build and deploy correctly without any custom deploy command.
