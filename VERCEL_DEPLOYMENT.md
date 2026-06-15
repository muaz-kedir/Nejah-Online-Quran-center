# Vercel Frontend Deployment Guide

## Prerequisites
- GitHub repository: https://github.com/muaz-kedir/Nejah-Online-Quran-center
- Vercel account (sign up at https://vercel.com)
- Backend deployed at: https://nejah-online-quran-center.onrender.com

## Step-by-Step Deployment

### 1. Import Project to Vercel

1. Go to https://vercel.com/new
2. Click **"Import Git Repository"**
3. Select your GitHub account and authorize Vercel
4. Find and select: `muaz-kedir/Nejah-Online-Quran-center`
5. Click **"Import"**

### 2. Configure Project Settings

In the import screen, configure:

**Framework Preset:** Other (or None)

**Root Directory:** `./` (leave as default - monorepo root)

**Build and Output Settings:**
- **Build Command:** `cd frontend && npm install && npm run build`
- **Output Directory:** `frontend/.output/public`
- **Install Command:** `npm install --prefix frontend`

### 3. Environment Variables

Click **"Environment Variables"** and add:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://nejah-online-quran-center.onrender.com/api` |

### 4. Deploy

1. Click **"Deploy"**
2. Wait for the build to complete (3-5 minutes)
3. Once deployed, you'll get a URL like: `https://your-project.vercel.app`

### 5. Update Backend CORS

After deployment, update your Render backend environment variables:

1. Go to https://dashboard.render.com
2. Select your `nejah-online-quran-center` service
3. Go to **Environment** tab
4. Update these variables:
   ```
   FRONTEND_URL=https://your-project.vercel.app
   CORS_ORIGINS=https://your-project.vercel.app,https://nejah-online-quran-center.onrender.com
   ```
5. Save and redeploy

### 6. Test Your Deployment

Visit your Vercel URL and test:
- ✅ Login page loads
- ✅ Can login with credentials
- ✅ Dashboard loads correctly
- ✅ API calls work (check browser console for no CORS errors)

## Default Credentials

After running migrations and seeding:

**Super Admin:**
- Email: `nejahsuperadmin@gmail.com`
- Password: `SuperAdmin123`

**Demo Accounts:**
- Admin: `admin@nejah.com` / `Admin123`
- Teacher: `teacher@nejah.com` / `Teacher123`
- Student: `student@nejah.com` / `Student123`
- Parent: `parent@nejah.com` / `Parent123`

## Custom Domain (Optional)

To add a custom domain:

1. In Vercel dashboard, go to your project
2. Click **Settings** → **Domains**
3. Add your domain
4. Update DNS records as instructed by Vercel
5. Update `FRONTEND_URL` and `CORS_ORIGINS` in Render with your custom domain

## Troubleshooting

### Build Fails

If build fails with module errors:
1. Check that `frontend/package.json` exists
2. Verify build command is correct
3. Check Vercel build logs for specific errors

### API Calls Fail (CORS Error)

1. Verify `VITE_API_URL` is set correctly in Vercel
2. Update `CORS_ORIGINS` in Render backend
3. Redeploy backend after CORS changes

### White Screen / 404 Errors

1. Verify `Output Directory` is set to `frontend/.output/public`
2. Check that rewrites are configured in `vercel.json`
3. Review build logs to ensure files were generated

## Important Notes

- **Free Tier:** Vercel free tier includes unlimited deployments
- **Auto Deploy:** Vercel automatically redeploys on git push to main
- **Environment:** Production env vars are in `frontend/.env.production`
- **Render Sleep:** Backend on Render free tier sleeps after 15 min inactivity (first request may be slow)

## Support

For issues:
1. Check Vercel build logs
2. Check browser console for errors
3. Verify environment variables are set correctly
4. Test backend API directly: https://nejah-online-quran-center.onrender.com/api
