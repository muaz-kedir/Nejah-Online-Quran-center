# VERCEL DEPLOYMENT FIX - Follow These Steps

## Current Status
- ✅ Backend deployed: https://nejah-online-quran-center.onrender.com
- ⏳ Frontend deployment needs fixing
- ❌ Database tables not created yet (migrations not run)

## Problem Identified
1. Vercel was using an OLD cached commit (0c7d873) 
2. The vercel.json configuration had incorrect settings
3. Database migrations have not been run yet

## FIXED Issues
- ✅ Updated vercel.json with correct build configuration
- ✅ Removed `rootDirectory` setting that was causing path issues
- ✅ Added proper build and install commands
- ✅ Created .vercelignore to exclude backend files
- ✅ Pushed new commit (90758f8) to GitHub

---

## STEP 1: Run Database Migrations on Render

**IMPORTANT: Do this FIRST before the frontend will work!**

1. Go to: https://dashboard.render.com
2. Find and click on your service: `nejah-online-quran-center`
3. Click the **"Shell"** tab at the top
4. Run these commands one by one:

```bash
# Navigate to backend directory
cd backend

# Run migrations to create database tables
npm run migration:run

# Seed the super admin user
npm run seed:superadmin
```

5. You should see output like:
   - "Migration ... has been executed successfully"
   - "Super admin user created successfully"

**If you get "relation does not exist" errors, the migrations haven't run yet.**

---

## STEP 2: Force Vercel to Use New Commit

### Option A: Redeploy from Vercel Dashboard (RECOMMENDED)

1. Go to: https://vercel.com/dashboard
2. Find your project (probably named `Nejah-Online-Quran-center` or similar)
3. Click on the project
4. Go to the **"Deployments"** tab
5. Look at the latest deployment and check:
   - ❌ If it shows commit `0c7d873` → OLD (wrong)
   - ✅ If it shows commit `90758f8` → NEW (correct)
6. If it's using the old commit:
   - Click **"Redeploy"** button (three dots menu → Redeploy)
   - OR click **"Visit Project Settings"** → **"Git"** → Click **"Redeploy"**
7. Wait for the new deployment (2-5 minutes)

### Option B: Clear Cache and Redeploy

If redeploying doesn't work:

1. In Vercel project settings
2. Go to **"General"** tab
3. Scroll down to **"Build & Development Settings"**
4. Check that these are set correctly:
   - **Framework Preset:** None (or Other)
   - **Build Command:** `cd frontend && npm install && npm run build`
   - **Output Directory:** `frontend/.output/public`
   - **Install Command:** `npm install --prefix frontend`
5. If they're wrong, update them and click **"Save"**
6. Go to **"Deployments"** tab
7. Click the three dots on the latest deployment → **"Redeploy"**
8. Make sure to check **"Use existing Build Cache"** is UNCHECKED

---

## STEP 3: Add Environment Variables in Vercel

**CRITICAL: These must be set in the Vercel dashboard, not in code!**

1. In your Vercel project
2. Go to **"Settings"** → **"Environment Variables"**
3. Add these variables:

| Name | Value | Environment |
|------|-------|-------------|
| `VITE_API_URL` | `https://nejah-online-quran-center.onrender.com/api` | Production |
| `VITE_WS_URL` | `https://nejah-online-quran-center.onrender.com` | Production |

4. Click **"Save"**
5. **IMPORTANT:** After adding environment variables, you MUST redeploy:
   - Go to **"Deployments"** tab
   - Click the three dots → **"Redeploy"**

---

## STEP 4: Update Backend CORS Settings

After your frontend is deployed and you have the Vercel URL:

1. Go to: https://dashboard.render.com
2. Click on your `nejah-online-quran-center` service
3. Go to **"Environment"** tab
4. Find or add these variables:

```
FRONTEND_URL=https://your-app-name.vercel.app
CORS_ORIGINS=https://your-app-name.vercel.app,https://nejah-online-quran-center.onrender.com
```

Replace `your-app-name.vercel.app` with your actual Vercel URL.

5. Click **"Save Changes"**
6. This will automatically redeploy your backend (takes 2-3 minutes)

---

## STEP 5: Verify Deployment

### Test Backend Directly

Open in browser: https://nejah-online-quran-center.onrender.com/api

You should see: `{"message":"Nejah Online Quran Center API"}`

### Test Frontend

1. Open your Vercel URL (e.g., `https://your-app.vercel.app`)
2. You should see the login page
3. Try logging in with:
   - Email: `nejahsuperadmin@gmail.com`
   - Password: `SuperAdmin123`

### Check for Errors

Open browser DevTools (F12) and check:
- **Console tab:** Should see no red errors
- **Network tab:** API calls should return 200 (not 404 or 500)
- **Application tab:** Check if token is stored in localStorage

---

## Common Issues & Solutions

### Issue 1: "Build Command Failed" in Vercel

**Solution:**
- Go to Vercel project settings
- Verify Build Command: `cd frontend && npm install && npm run build`
- Verify Output Directory: `frontend/.output/public`
- Redeploy with cache cleared

### Issue 2: "relation does not exist" error

**Solution:**
- Migrations haven't been run yet
- Go to Render Shell and run: `npm run migration:run`
- Then run: `npm run seed:superadmin`

### Issue 3: White screen or 404 errors

**Solution:**
- Check Vercel build logs for errors
- Verify Output Directory is `frontend/.output/public`
- Check that `vercel.json` has the rewrites section

### Issue 4: CORS errors in browser console

**Solution:**
- Update `CORS_ORIGINS` in Render backend
- Make sure it includes your Vercel URL
- Redeploy backend after updating

### Issue 5: "Cannot connect to API"

**Solution:**
- Verify `VITE_API_URL` is set in Vercel environment variables
- Make sure it's: `https://nejah-online-quran-center.onrender.com/api`
- Must include `/api` at the end
- Redeploy after adding environment variables

---

## What Was Changed

### File: `vercel.json`
```json
{
  "framework": null,
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/.output/public",
  "installCommand": "npm install --prefix frontend",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**Key changes:**
- Removed `rootDirectory` (was causing path issues)
- Changed build command to `cd frontend && ...` (works from monorepo root)
- Changed output to `frontend/.output/public` (full path from root)
- Added rewrites for SPA routing

### New File: `.vercelignore`
Created to exclude backend files and prevent confusion.

---

## Expected URLs After Deployment

| Service | URL |
|---------|-----|
| Backend API | https://nejah-online-quran-center.onrender.com/api |
| Frontend | https://your-app.vercel.app |
| Database | Internal Render PostgreSQL |

---

## Next Steps After Successful Deployment

1. ✅ Test all features (login, dashboard, CRUD operations)
2. ✅ Add more test data via the admin panel
3. ✅ Configure email settings (MAIL_* variables in Render)
4. ✅ Set up Zoom integration (ZOOM_* variables in Render)
5. ✅ Consider custom domain (optional)
6. ✅ Set up monitoring and error tracking

---

## Support

If you still have issues after following these steps:

1. **Check Vercel Build Logs:**
   - Go to Deployments tab
   - Click on the latest deployment
   - Look for red error messages

2. **Check Render Logs:**
   - Go to your service dashboard
   - Click "Logs" tab
   - Look for errors during startup

3. **Check Browser Console:**
   - Press F12 in your browser
   - Look for error messages
   - Check Network tab for failed requests

---

## Quick Command Reference

**Check latest Git commit:**
```bash
git log --oneline -1
```
Current commit should be: `90758f8 Fix Vercel deployment configuration`

**Force push (if needed - use carefully):**
```bash
git push origin main --force
```

**Run migrations on Render Shell:**
```bash
cd backend
npm run migration:run
npm run seed:superadmin
```

---

**Last Updated:** June 16, 2026
**Status:** Ready to deploy ✅
