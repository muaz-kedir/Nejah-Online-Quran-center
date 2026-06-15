# Deployment Status

## ✅ Backend Deployment (Render) - COMPLETED

**Backend URL:** https://nejah-online-quran-center.onrender.com

**Status:** Live and running

**Database:** PostgreSQL (Frankfurt region)

**Next Steps for Backend:**

1. **Add Environment Variables in Render Dashboard:**
   - Go to: https://dashboard.render.com
   - Select your service
   - Go to Environment tab
   - Add/Update these variables:

   ```
   NODE_ENV=production
   PORT=10000
   DATABASE_URL=postgresql://nejah_db_user:kIKYguf84ZmP4EGNgXsf1bOoDqWDhKuy@dpg-d8o4lfbsq97s73f5tidg-a/nejah_db
   JWT_SECRET=<GENERATE-THIS>
   FRONTEND_URL=http://localhost:3000
   CORS_ORIGINS=http://localhost:3000
   ```

2. **Generate JWT_SECRET:**
   ```powershell
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. **Run Database Migrations:**
   - Open Render Shell from your service dashboard
   - Run: `npm run migration:run`
   - Run: `npm run seed:superadmin`

4. **After Vercel deployment, update:**
   - `FRONTEND_URL=https://your-vercel-app.vercel.app`
   - `CORS_ORIGINS=https://your-vercel-app.vercel.app,https://nejah-online-quran-center.onrender.com`

## 🚀 Frontend Deployment (Vercel) - READY TO DEPLOY

**Configuration:** Ready (vercel.json created)

**Environment:** Configured (.env.production points to backend)

### Deploy to Vercel:

1. Go to https://vercel.com/new
2. Import your GitHub repository: `muaz-kedir/Nejah-Online-Quran-center`
3. Configure:
   - **Root Directory:** `./` (default)
   - **Build Command:** `cd frontend && npm install && npm run build`
   - **Output Directory:** `frontend/.output/public`
   - **Install Command:** `npm install --prefix frontend`
4. Add Environment Variable:
   - `VITE_API_URL` = `https://nejah-online-quran-center.onrender.com/api`
5. Click Deploy

**Full Instructions:** See `VERCEL_DEPLOYMENT.md`

## Default Credentials

After seeding the database:

**Super Admin:**
- Email: `nejahsuperadmin@gmail.com`
- Password: `SuperAdmin123`

**Demo Accounts:**
- Admin: `admin@nejah.com` / `Admin123`
- Teacher: `teacher@nejah.com` / `Teacher123`
- Student: `student@nejah.com` / `Student123`
- Parent: `parent@nejah.com` / `Parent123`

## Architecture

```
Frontend (Vercel)
   ↓
   → https://your-app.vercel.app
   ↓
Backend API (Render)
   ↓
   → https://nejah-online-quran-center.onrender.com/api
   ↓
PostgreSQL Database (Render)
   ↓
   → dpg-d8o4lfbsq97s73f5tidg-a (Frankfurt)
```

## Important Notes

1. **Render Free Tier:** Backend sleeps after 15 min inactivity - first request may take 30s
2. **Vercel Free Tier:** Frontend always active with CDN
3. **Security:** Change default passwords immediately after first login
4. **Migrations:** Must be run manually via Render Shell
5. **Monitoring:** Check Render logs for backend issues

## Troubleshooting

### Backend Issues
- Check Render logs
- Verify environment variables are set
- Ensure migrations were run

### Frontend Issues
- Check Vercel build logs
- Verify VITE_API_URL is correct
- Check browser console for errors

### CORS Issues
- Update CORS_ORIGINS in Render after Vercel deployment
- Redeploy backend after changing CORS settings

## Files Reference

- `VERCEL_DEPLOYMENT.md` - Detailed Vercel deployment guide
- `DEPLOYMENT_GUIDE.md` - Complete deployment documentation
- `backend/.env.render` - Backend environment variables template
- `frontend/.env.production` - Frontend production configuration
- `vercel.json` - Vercel build configuration
