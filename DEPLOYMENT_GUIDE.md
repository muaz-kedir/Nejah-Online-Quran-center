# Nejah Online Quran Center - Deployment Guide

## Overview
This guide covers the complete deployment process for both frontend (Vercel) and backend (Render) of the Nejah Online Quran Center application.

## Backend Deployment (Render)

### Current Deployment
- **URL**: https://nejah-online-quran-center.onrender.com
- **Database**: PostgreSQL (Render managed)
  - Host: dpg-d8o4lfbsq97s73f5tidg-a
  - Database: nejah_db
  - User: nejah_db_user

### Environment Variables Required on Render

```bash
# Application
NODE_ENV=production
PORT=3000
API_PREFIX=api

# Database (Render provides DATABASE_URL automatically)
DB_HOST=<provided-by-render>
DB_PORT=5432
DB_USERNAME=nejah_db_user
DB_PASSWORD=<provided-by-render>
DB_NAME=nejah_db

# JWT
JWT_SECRET=<generate-strong-secret>
JWT_EXPIRATION=7d

# Zoom API (for auto-creating meetings)
ZOOM_ACCOUNT_ID=4n4pB5R5QLeq1hI7VccrwA
ZOOM_CLIENT_ID=I1rcFuVQTQCQqgOIRPww5A
ZOOM_CLIENT_SECRET=3qEsFaBZkhdyrIa964GQLS9pfoyVZBl6
ZOOM_SECRET_TOKEN=sl8uTpezSUeqYc7DXpKK3w
ENCRYPTION_KEY=<generate-32-byte-key>

# CORS (Add Vercel frontend URL once deployed)
CORS_ORIGIN=https://your-vercel-app.vercel.app,http://localhost:8080
```

### Post-Deployment Steps on Render

1. **Run Database Migrations**:
   ```bash
   npm run migration:run
   ```
   This will create all necessary tables including the Zoom fields (zoomMeetingId, zoomPassword) for ClassSession.

2. **Seed Super Admin**:
   ```bash
   npm run seed:superadmin
   ```
   This creates the initial super admin account for system access.

3. **Update CORS** (After frontend deployment):
   - Go to Render dashboard → Environment
   - Update `CORS_ORIGIN` to include your Vercel URL
   - Example: `https://your-vercel-app.vercel.app,http://localhost:8080`

## Frontend Deployment (Vercel)

### Configuration
The frontend is configured in `frontend/vercel.json`:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": null,
  "installCommand": "npm install",
  "buildCommand": "npm run build:vercel",
  "outputDirectory": ".vercel/output",
  "env": {
    "VITE_API_URL": "https://nejah-online-quran-center.onrender.com/api",
    "VITE_WS_URL": "https://nejah-online-quran-center.onrender.com"
  }
}
```

### Deployment Steps

1. **Connect Repository to Vercel**:
   - Go to [Vercel Dashboard](https://vercel.com)
   - Click "Add New" → "Project"
   - Import your GitHub repository
   - Select the repository: `muaz-kedir/Nejah-Online-Quran-center`

2. **Configure Project Settings**:
   - **Framework Preset**: Other
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build:vercel`
   - **Output Directory**: `.vercel/output`
   - **Install Command**: `npm install`

3. **Environment Variables** (already configured in vercel.json):
   - `VITE_API_URL`: https://nejah-online-quran-center.onrender.com/api
   - `VITE_WS_URL`: https://nejah-online-quran-center.onrender.com

4. **Deploy**:
   - Click "Deploy"
   - Wait for build to complete
   - Copy the deployment URL (e.g., `https://your-app.vercel.app`)

5. **Update Backend CORS**:
   - Go back to Render dashboard
   - Update `CORS_ORIGIN` environment variable to include your Vercel URL
   - Redeploy backend service

## Key Features Deployed

### 1. Zoom Meeting Auto-Creation
- Teachers can start class sessions without manually creating Zoom meetings
- System automatically creates meetings via Zoom API
- Stores `zoomMeetingId` and `zoomPassword` in database
- Falls back to manual link entry if auto-creation fails

### 2. Fixed Hydration Issues
- React hydration errors resolved in:
  - `Toaster` component (sonner notifications)
  - `Navbar` theme toggle
- Both use mounted state checks to prevent SSR/client mismatches

### 3. Web Push Notifications
- Push subscription service for student/parent notifications
- Requires `web-push` package (already installed)

## Verification Checklist

### Backend (Render)
- [ ] Service is running at https://nejah-online-quran-center.onrender.com
- [ ] Database migrations completed successfully
- [ ] Super admin seeded
- [ ] CORS includes Vercel frontend URL
- [ ] All environment variables configured
- [ ] Health check endpoint responds: `GET /api/health`

### Frontend (Vercel)
- [ ] Build completes without errors
- [ ] Application loads at Vercel URL
- [ ] API calls work (check Network tab)
- [ ] WebSocket connection establishes
- [ ] Login/Register functionality works
- [ ] No hydration errors in console
- [ ] Theme toggle works smoothly

## Troubleshooting

### Backend Issues

**Migrations fail**:
- Ensure database is accessible
- Check connection string in environment variables
- Verify TypeORM configuration in `src/database/data-source.ts`

**CORS errors**:
- Verify `CORS_ORIGIN` includes frontend URL
- Check for trailing slashes (inconsistent URLs)
- Restart Render service after updating

### Frontend Issues

**Build fails on Vercel**:
- Check build logs for specific errors
- Verify all dependencies in package.json
- Ensure `build:vercel` script runs locally

**API connection fails**:
- Verify `VITE_API_URL` is correct
- Check backend is running and accessible
- Inspect Network tab for CORS or 404 errors

**Hydration errors persist**:
- Clear browser cache
- Verify latest code is deployed
- Check for conditional rendering based on `window` or browser-only APIs

## Database Schema Updates

The latest migration (`1718582400000-AddZoomFieldsToClassSession`) adds:
- `zoomMeetingId` (nullable varchar) to `class_sessions`
- `zoomPassword` (nullable varchar) to `class_sessions`

These fields support automatic Zoom meeting creation for class sessions.

## Post-Deployment Testing

1. **Authentication**:
   - Register a new parent account
   - Login with super admin
   - Test role-based access

2. **Class Sessions**:
   - Create a new class session
   - Start meeting without providing Zoom link (test auto-creation)
   - Verify meeting link is generated and stored

3. **Real-time Features**:
   - Test WebSocket connection
   - Check notifications
   - Verify chat functionality

4. **UI/UX**:
   - Toggle theme (light/dark)
   - Switch languages (English/Arabic/Amharic)
   - Test mobile responsive design

## Support

For issues or questions:
- Check application logs in Render/Vercel dashboards
- Review error messages in browser console
- Verify environment variables are correctly set
- Ensure all services are running and accessible

## Changelog

### Latest Updates
- ✅ Fixed Vercel monorepo configuration
- ✅ Added Zoom auto-create meeting feature
- ✅ Fixed React hydration errors (Toaster, Navbar)
- ✅ Installed web-push dependency
- ✅ Resolved git merge conflicts
- ✅ Updated migration for Zoom fields
- ✅ Backend deployed on Render
- ✅ Frontend configured for Vercel deployment

## Next Steps

1. Deploy frontend to Vercel using configuration above
2. Copy Vercel URL
3. Update CORS_ORIGIN on Render backend
4. Test end-to-end functionality
5. Monitor for any errors in production
