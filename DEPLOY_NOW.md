# 🚀 DEPLOY NOW - Quick Action Guide

**Last commit pushed:** `7f4aa05` - Fix Vercel install command

---

## ✅ WHAT'S FIXED

1. ✅ Fixed doubled path issue (`frontend/frontend` → `frontend`)
2. ✅ Simplified install and build commands
3. ✅ Added `.vercelignore` to exclude backend files
4. ✅ Pushed to GitHub (Vercel will auto-deploy)

---

## 🎯 IMMEDIATE ACTIONS NEEDED

### ACTION 1: Run Database Migrations (URGENT - DO THIS FIRST!)

The backend is deployed but the database tables don't exist yet.

**Steps:**
1. Go to: https://dashboard.render.com
2. Click on: `nejah-online-quran-center` service
3. Click: **"Shell"** tab (top right)
4. Run these commands:

```bash
cd backend
npm run migration:run
npm run seed:superadmin
```

**Expected output:**
```
✓ Migration CreateUsers1234567890123 has been executed successfully
✓ Migration CreateTeachers1234567890123 has been executed successfully
...
✓ Super admin user created successfully
```

**If you get errors:** The database connection might be wrong. Check environment variables.

---

### ACTION 2: Wait for Vercel Auto-Deploy

Vercel should automatically deploy the new commit.

**Check deployment status:**
1. Go to: https://vercel.com/dashboard
2. Find your project
3. Click on it
4. Go to **"Deployments"** tab
5. Look for the latest deployment with commit `7f4aa05`
6. Wait until it shows "Ready" (2-5 minutes)

**If it fails or uses old commit:**
- Click the three dots (⋮) → **"Redeploy"**
- Make sure **"Use existing Build Cache"** is UNCHECKED

---

### ACTION 3: Add Environment Variables in Vercel

**IMPORTANT:** Do this AFTER the deployment completes.

1. In Vercel, go to your project
2. Click **"Settings"** → **"Environment Variables"**
3. Add these:

| Variable Name | Value | Apply To |
|---------------|-------|----------|
| `VITE_API_URL` | `https://nejah-online-quran-center.onrender.com/api` | Production |
| `VITE_WS_URL` | `https://nejah-online-quran-center.onrender.com` | Production |

4. Click **"Save"**
5. Go back to **"Deployments"** → Click ⋮ → **"Redeploy"**

---

### ACTION 4: Update Backend CORS

After Vercel gives you a URL (e.g., `https://nejah-quran-center.vercel.app`):

1. Go to: https://dashboard.render.com
2. Click: `nejah-online-quran-center` service
3. Go to: **"Environment"** tab
4. Find or add these variables:

```
FRONTEND_URL=https://your-vercel-url.vercel.app
CORS_ORIGINS=https://your-vercel-url.vercel.app,https://nejah-online-quran-center.onrender.com
```

5. Click **"Save Changes"** (auto-redeploys backend)

---

## 🧪 TEST YOUR DEPLOYMENT

### Step 1: Test Backend

Open in browser: https://nejah-online-quran-center.onrender.com/api

**Expected:** 
```json
{"message":"Nejah Online Quran Center API"}
```

### Step 2: Test Frontend

1. Open your Vercel URL
2. You should see the login page
3. Try logging in:
   - **Email:** `nejahsuperadmin@gmail.com`
   - **Password:** `SuperAdmin123`

### Step 3: Check Browser Console

Press F12 and check:
- ✅ No red errors in Console
- ✅ API calls return 200 status
- ✅ No CORS errors

---

## ⚠️ TROUBLESHOOTING

### Issue: "relation does not exist" in backend logs

**Solution:** You forgot to run migrations!
```bash
cd backend
npm run migration:run
npm run seed:superadmin
```

### Issue: Vercel still showing old commit

**Solution:** 
1. Go to Settings → General → scroll down
2. Clear any cached settings
3. Go to Deployments → Redeploy with cache unchecked

### Issue: CORS errors in browser

**Solution:**
1. Add `VITE_API_URL` in Vercel environment variables
2. Update `CORS_ORIGINS` in Render backend
3. Redeploy both services

### Issue: White screen or blank page

**Solution:**
1. Check Vercel build logs for errors
2. Verify Output Directory is `frontend/.output/public`
3. Check if environment variables are set

---

## 📊 CURRENT STATUS

| Component | Status | URL |
|-----------|--------|-----|
| Backend | ✅ Deployed | https://nejah-online-quran-center.onrender.com |
| Database | ⏳ Needs migrations | (Internal Render PostgreSQL) |
| Frontend | 🔄 Deploying | (Wait for Vercel) |

---

## 📝 WHAT CHANGED IN LAST COMMIT

**File: `vercel.json`**
```json
{
  "buildCommand": "cd frontend && npm run build",
  "installCommand": "cd frontend && npm install",
  "outputDirectory": "frontend/.output/public"
}
```

**Key fix:**
- Changed `npm install --prefix frontend` to `cd frontend && npm install`
- This prevents the double path issue (`frontend/frontend/package.json`)

---

## 🎉 NEXT STEPS AFTER SUCCESS

1. ✅ Test all features thoroughly
2. ✅ Add custom domain (optional)
3. ✅ Set up email service (MAIL_* variables)
4. ✅ Configure Zoom integration (ZOOM_* variables)
5. ✅ Set up monitoring/error tracking
6. ✅ Create backups schedule

---

## 📞 QUICK LINKS

- **Render Dashboard:** https://dashboard.render.com
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Backend URL:** https://nejah-online-quran-center.onrender.com
- **GitHub Repo:** https://github.com/muaz-kedir/Nejah-Online-Quran-center

---

**Status:** Ready to deploy ✅  
**Last updated:** June 16, 2026  
**Current commit:** `7f4aa05`
