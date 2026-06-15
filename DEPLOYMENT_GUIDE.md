# Deployment Guide: Nejah Online Quran Center

This guide covers deploying the backend to Render and the frontend to Vercel.

---

## Prerequisites

1. GitHub account (to push your code)
2. Render account (https://render.com)
3. Vercel account (https://vercel.com)
4. PostgreSQL database (Render provides free PostgreSQL)

---

## Part 1: Deploy Backend to Render

### Step 1: Prepare Your Code

1. **Push your code to GitHub** (if not already done):
   ```bash
   cd C:\Users\hp\Music\Nejah-Online-Quran-center
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Ensure `.gitignore` excludes sensitive files**:
   - `backend/.env` ✓ (already in .gitignore)
   - `backend/node_modules/` ✓
   - `backend/dist/` ✓

### Step 2: Create PostgreSQL Database on Render

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"PostgreSQL"**
3. Configure:
   - **Name**: `nejah-db`
   - **Database**: `nejah_quran_center`
   - **User**: (auto-generated)
   - **Region**: Choose closest to your users
   - **Plan**: Free (or paid for production)
4. Click **"Create Database"**
5. **Save these credentials** (you'll need them):
   - Internal Database URL
   - External Database URL
   - PSQL Command

### Step 3: Create Web Service on Render

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure the service:

   **Basic Settings:**
   - **Name**: `nejah-backend`
   - **Region**: Same as database
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start:prod`

   **Environment Variables** (click "Add Environment Variable"):
   ```
   NODE_ENV=production
   PORT=3000
   
   # Database (use Internal Database URL from Step 2)
   DATABASE_HOST=<your-db-host>
   DATABASE_PORT=5432
   DATABASE_USERNAME=<your-db-user>
   DATABASE_PASSWORD=<your-db-password>
   DATABASE_NAME=nejah_quran_center
   DATABASE_URL=<your-internal-database-url>
   
   # JWT Secret (generate a strong secret)
   JWT_SECRET=<generate-a-strong-random-secret-at-least-32-chars>
   JWT_EXPIRATION=7d
   
   # Email Configuration
   MAIL_HOST=smtp.gmail.com
   MAIL_PORT=587
   MAIL_USER=your-email@gmail.com
   MAIL_PASSWORD=your-app-password
   MAIL_FROM=noreply@nejah-quran.com
   
   # Zoom API (if using Zoom integration)
   ZOOM_ACCOUNT_ID=your-zoom-account-id
   ZOOM_CLIENT_ID=your-zoom-client-id
   ZOOM_CLIENT_SECRET=your-zoom-client-secret
   
   # Frontend URL (add after deploying frontend)
   FRONTEND_URL=https://your-app.vercel.app
   
   # CORS Origins (add after deploying frontend)
   CORS_ORIGINS=https://your-app.vercel.app,https://www.your-app.vercel.app
   ```

5. Click **"Create Web Service"**

6. **Wait for deployment** (5-10 minutes)

7. **Note your backend URL**: `https://nejah-backend.onrender.com`

### Step 4: Run Database Migrations

After deployment, open the Render shell:

1. Go to your service dashboard
2. Click **"Shell"** tab
3. Run migrations:
   ```bash
   npm run migration:run
   ```

4. Create super admin user:
   ```bash
   npm run seed:superadmin
   ```

---

## Part 2: Deploy Frontend to Vercel

### Step 1: Update Frontend Configuration

1. **Update API URL** in `frontend/src/lib/api.ts`:
   
   The file should already use environment variables. Create a `.env` file:

   ```env
   VITE_API_URL=https://nejah-backend.onrender.com
   ```

2. **Commit changes**:
   ```bash
   git add .
   git commit -m "Update API URL for production"
   git push origin main
   ```

### Step 2: Deploy to Vercel

1. Go to https://vercel.com/dashboard
2. Click **"Add New"** → **"Project"**
3. Import your GitHub repository
4. Configure the project:

   **Project Settings:**
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

   **Environment Variables:**
   ```
   VITE_API_URL=https://nejah-backend.onrender.com
   ```

5. Click **"Deploy"**

6. **Wait for deployment** (2-5 minutes)

7. **Note your frontend URL**: `https://your-app.vercel.app`

### Step 3: Update Backend CORS

1. Go back to Render dashboard → Your backend service
2. Update environment variables:
   ```
   FRONTEND_URL=https://your-app.vercel.app
   CORS_ORIGINS=https://your-app.vercel.app,https://www.your-app.vercel.app
   ```
3. Click **"Save Changes"** (this will redeploy)

---

## Part 3: Post-Deployment Setup

### 1. Test the Application

1. Open your Vercel URL: `https://your-app.vercel.app`
2. Try to register/login
3. Test API endpoints

### 2. Custom Domain (Optional)

**For Frontend (Vercel):**
1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

**For Backend (Render):**
1. Go to Service Settings → Custom Domains
2. Add your custom domain
3. Update DNS records as instructed

### 3. Enable HTTPS (Auto-enabled)
Both Render and Vercel automatically provide SSL certificates.

### 4. Monitor Your Apps

**Render:**
- View logs: Service Dashboard → Logs tab
- Monitor metrics: Dashboard → Metrics

**Vercel:**
- View logs: Project → Deployments → View logs
- Monitor analytics: Project → Analytics

---

## Troubleshooting

### Backend Issues

**Database Connection Failed:**
- Verify DATABASE_URL is correct
- Check if database is in same region
- Use Internal Database URL (not External)

**Build Failed:**
- Check build logs in Render
- Verify all dependencies in package.json
- Try building locally first: `npm run build`

**Server Won't Start:**
- Check start command: `npm run start:prod`
- Verify dist/main.js exists after build
- Check environment variables

### Frontend Issues

**API Calls Failing:**
- Verify VITE_API_URL is correct
- Check CORS settings in backend
- Inspect browser console for errors

**Build Failed:**
- Check build logs in Vercel
- Verify all dependencies in package.json
- Try building locally: `npm run build`

**Environment Variables Not Working:**
- Variables must start with `VITE_`
- Redeploy after adding variables
- Clear Vercel build cache

---

## Environment Variables Reference

### Backend (Render)

| Variable | Description | Example |
|----------|-------------|---------|
| NODE_ENV | Environment | `production` |
| PORT | Server port | `3000` |
| DATABASE_URL | PostgreSQL connection | `postgresql://user:pass@host/db` |
| JWT_SECRET | Secret for JWT tokens | `your-secret-key-min-32-chars` |
| JWT_EXPIRATION | Token expiration | `7d` |
| FRONTEND_URL | Frontend URL | `https://app.vercel.app` |
| CORS_ORIGINS | Allowed origins | `https://app.vercel.app` |
| MAIL_HOST | Email server | `smtp.gmail.com` |
| MAIL_PORT | Email port | `587` |
| MAIL_USER | Email username | `your@email.com` |
| MAIL_PASSWORD | Email password | `app-password` |

### Frontend (Vercel)

| Variable | Description | Example |
|----------|-------------|---------|
| VITE_API_URL | Backend API URL | `https://backend.onrender.com` |

---

## Cost Estimates

### Free Tier Limits

**Render (Free Plan):**
- 750 hours/month (enough for 1 service)
- Services spin down after 15 min inactivity
- 512 MB RAM
- PostgreSQL: 1 GB storage, 90 day backup retention

**Vercel (Hobby - Free):**
- Unlimited deployments
- 100 GB bandwidth/month
- Automatic HTTPS
- No credit card required

### Paid Plans (If Needed)

**Render:**
- Starter: $7/month (always on, no spin down)
- Standard: $25/month (more resources)

**Vercel:**
- Pro: $20/month (more bandwidth, analytics)

---

## Security Checklist

- [ ] Strong JWT_SECRET (min 32 characters)
- [ ] Database credentials not in code
- [ ] CORS properly configured
- [ ] HTTPS enabled (auto on both platforms)
- [ ] .env files in .gitignore
- [ ] Rate limiting enabled (already in code)
- [ ] Input validation active (class-validator)
- [ ] SQL injection protection (TypeORM)

---

## Maintenance

### Update Deployment

**Backend:**
```bash
git add .
git commit -m "Update backend"
git push origin main
# Render auto-deploys on push
```

**Frontend:**
```bash
git add .
git commit -m "Update frontend"
git push origin main
# Vercel auto-deploys on push
```

### Database Backups

**Render PostgreSQL:**
- Free tier: 90-day retention
- Paid tier: Point-in-time recovery
- Manual backups: Use pg_dump

### Monitoring

Set up monitoring alerts:
- Render: Enable email alerts for crashes
- Vercel: Set up error tracking (Sentry integration)

---

## Support Resources

- **Render Docs**: https://render.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **NestJS Docs**: https://docs.nestjs.com
- **TanStack Start**: https://tanstack.com/start/latest

---

## Next Steps

1. ✅ Deploy backend to Render
2. ✅ Deploy frontend to Vercel  
3. ✅ Configure environment variables
4. ✅ Test the application
5. 🎯 Add custom domain
6. 🎯 Set up monitoring
7. 🎯 Create database backups
8. 🎯 Configure email service

**Your app will be live at:**
- Frontend: `https://your-app.vercel.app`
- Backend: `https://nejah-backend.onrender.com`

Good luck with your deployment! 🚀
