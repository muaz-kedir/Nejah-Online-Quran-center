# Quick Deploy Reference

## 🚀 3-Step Deployment

### Step 1: Deploy to Vercel (5 minutes)

1. Go to https://vercel.com/dashboard
2. Click "Add New" → "Project"
3. Import: `muaz-kedir/Nejah-Online-Quran-center`
4. Configure:
   - Root Directory: `frontend`
   - Build Command: `npm run build:vercel`
   - Output Directory: `.vercel/output`
5. Click "Deploy"
6. **Copy your Vercel URL** (e.g., `https://nejah-xyz.vercel.app`)

### Step 2: Update Backend CORS (2 minutes)

1. Go to https://dashboard.render.com
2. Select: `nejah-online-quran-center`
3. Go to "Environment" tab
4. Update `CORS_ORIGIN`:
   ```
   https://your-vercel-url.vercel.app,http://localhost:8080
   ```
5. Click "Manual Deploy" → "Deploy latest commit"

### Step 3: Run Migrations (3 minutes)

1. In Render dashboard, click "Shell"
2. Run:
   ```bash
   npm run migration:run
   npm run seed:superadmin
   ```
3. Note the super admin credentials

## ✅ Verify

- [ ] Frontend loads: `https://your-vercel-url.vercel.app`
- [ ] Backend responds: `https://nejah-online-quran-center.onrender.com/api/health`
- [ ] Login works
- [ ] No CORS errors in browser console

## 📌 Key URLs

- **Frontend**: Your Vercel URL
- **Backend**: https://nejah-online-quran-center.onrender.com
- **Database**: postgresql://nejah_db_user:***@dpg-d8o4lfbsq97s73f5tidg-a/nejah_db

## 🔑 Environment Variables (Already Configured)

### Vercel (in vercel.json)
```
VITE_API_URL=https://nejah-online-quran-center.onrender.com/api
VITE_WS_URL=https://nejah-online-quran-center.onrender.com
```

### Render (verify in dashboard)
```
CORS_ORIGIN=https://your-vercel-url.vercel.app,http://localhost:8080
```

## 🆘 Quick Troubleshooting

**CORS Error**: Update CORS_ORIGIN on Render, redeploy

**Build Fails**: Check Vercel logs, ensure `frontend` is root directory

**Migration Error**: Verify database connection in Render environment

**500 Errors**: Check Render logs for specific error

## 📚 Full Documentation

- `DEPLOY_CHECKLIST.md` - Complete deployment checklist
- `DEPLOYMENT_GUIDE.md` - Detailed deployment guide

---

**That's it! Your app should be live in ~10 minutes.**
