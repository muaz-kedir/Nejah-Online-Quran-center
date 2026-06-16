# Your Deployment Steps - Nejah Online Quran Center

## ✅ Step 1: Database Created (DONE)

You've successfully created the PostgreSQL database on Render:
- **Database Name**: nejah_db
- **Region**: Frankfurt
- **Internal URL**: `postgresql://nejah_db_user:kIKYguf84ZmP4EGNgXsf1bOoDqWDhKuy@dpg-d8o4lfbsq97s73f5tidg-a/nejah_db`

---

## 🚀 Step 2: Deploy Backend to Render

### 2.1 Create Web Service

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Click **"Build and deploy from a Git repository"**
4. Connect your GitHub account (if not already)
5. Select repository: **`Nejah-Online-Quran-center`**
6. Click **"Connect"**

### 2.2 Configure Service

**Basic Information:**
- **Name**: `nejah-backend` (or your preferred name)
- **Region**: **Frankfurt (EU Central)** ← Same as your database
- **Branch**: `main`
- **Root Directory**: `backend`

**Build & Deploy:**
- **Runtime**: **Node**
- **Build Command**: 
  ```
  npm install && npm run build
  ```
- **Start Command**:
  ```
  npm run start:prod
  ```

**Instance Type:**
- **Plan**: **Free** (or Starter $7/month for always-on)

### 2.3 Add Environment Variables

Click **"Add Environment Variable"** and add these ONE BY ONE:

#### Required Variables:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| `DATABASE_URL` | `postgresql://nejah_db_user:kIKYguf84ZmP4EGNgXsf1bOoDqWDhKuy@dpg-d8o4lfbsq97s73f5tidg-a/nejah_db` |
| `JWT_SECRET` | Generate a strong secret (see below) |
| `JWT_EXPIRATION` | `7d` |
| `FRONTEND_URL` | `http://localhost:8081` (update later) |
| `CORS_ORIGINS` | `http://localhost:8081` (update later) |

#### Generate JWT Secret:

**Option 1 - PowerShell:**
```powershell
-join ((65..90) + (97..122) + (48..57) + (33,35,36,37,38,42,43,45,61) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

**Option 2 - Online:**
Go to https://randomkeygen.com/ and use "CodeIgniter Encryption Keys"

**Option 3 - Simple:**
Use something like: `MyStr0ngS3cr3tK3y2024ForN3j4hQur4n!@#$`

### 2.4 Deploy

1. Click **"Create Web Service"**
2. Wait 5-10 minutes for deployment
3. Watch the logs for any errors

### 2.5 Check Deployment Status

You'll see logs like:
```
Building...
Installing dependencies...
Building application...
Starting application...
Your service is live 🎉
```

**Save your backend URL**: `https://nejah-backend-XXXX.onrender.com`

---

## 🗄️ Step 3: Run Database Migrations

### 3.1 Open Shell

1. In Render dashboard → Your service
2. Click **"Shell"** tab (top right)
3. Wait for shell to connect

### 3.2 Run Migrations

In the shell, run:
```bash
npm run migration:run
```

Expected output:
```
Running migrations...
✓ Migration CreateUsersTable executed
✓ Migration CreateStudentsTable executed
...
Migrations complete!
```

### 3.3 Create Super Admin

```bash
npm run seed:superadmin
```

This creates an admin user:
- **Email**: `admin@nejah.com`
- **Password**: `Admin@123`

**⚠️ IMPORTANT**: Change this password after first login!

---

## 🎨 Step 4: Deploy Frontend to Vercel

### 4.1 Prepare Repository

Make sure your code is pushed to GitHub:
```bash
cd C:\Users\hp\Music\Nejah-Online-Quran-center
git status
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

### 4.2 Deploy to Vercel

1. Go to https://vercel.com/dashboard
2. Click **"Add New..."** → **"Project"**
3. Click **"Import Git Repository"**
4. Select **`Nejah-Online-Quran-center`**
5. Click **"Import"**

### 4.3 Configure Project

**Framework Preset**: Should auto-detect as **Vite**

**Root Directory**: 
- Click **"Edit"**
- Enter: `frontend`
- Click **"Continue"**

**Build and Output Settings**:
- **Build Command**: `npm run build` (should be auto-filled)
- **Output Directory**: `dist` (should be auto-filled)
- **Install Command**: `npm install` (should be auto-filled)

### 4.4 Add Environment Variables

Click **"Environment Variables"** and add:

| Name | Value |
|------|-------|
| `VITE_API_URL` | `https://nejah-backend-XXXX.onrender.com` |

*Replace `XXXX` with your actual Render URL*

### 4.5 Deploy

1. Click **"Deploy"**
2. Wait 2-5 minutes
3. Vercel will show deployment progress

**Save your frontend URL**: `https://your-app-XXXX.vercel.app`

---

## 🔗 Step 5: Connect Frontend & Backend

### 5.1 Update Backend Environment Variables

1. Go back to Render dashboard → Your backend service
2. Click **"Environment"** tab
3. **Update** these variables:

| Key | New Value |
|-----|-----------|
| `FRONTEND_URL` | `https://your-app-XXXX.vercel.app` |
| `CORS_ORIGINS` | `https://your-app-XXXX.vercel.app` |

4. Click **"Save Changes"**
5. Service will automatically redeploy (wait 2-3 minutes)

---

## ✅ Step 6: Test Your Application

### 6.1 Open Your App

Visit: `https://your-app-XXXX.vercel.app`

### 6.2 Test Login

1. Click **"Login"**
2. Use super admin credentials:
   - Email: `admin@nejah.com`
   - Password: `Admin@123`
3. You should be redirected to the dashboard

### 6.3 Test API Connection

1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Try to navigate around the app
4. You should see API calls to your Render backend

### 6.4 Change Admin Password

1. Go to Settings or Profile
2. Change the default password
3. Log out and log in with new password

---

## 🎉 Deployment Complete!

Your application is now live!

**Frontend**: `https://your-app-XXXX.vercel.app`  
**Backend**: `https://nejah-backend-XXXX.onrender.com`  
**Database**: PostgreSQL on Render (Frankfurt)

---

## 📝 Post-Deployment Checklist

- [ ] Backend deployed and running
- [ ] Database migrations completed
- [ ] Super admin created
- [ ] Frontend deployed
- [ ] Frontend can call backend (CORS working)
- [ ] Login works
- [ ] Admin password changed
- [ ] Save URLs in a safe place

---

## 🔧 Troubleshooting

### Backend won't start
- Check logs in Render dashboard
- Verify all environment variables are set
- Check DATABASE_URL is correct (internal URL)

### Frontend can't connect to backend
- Check VITE_API_URL in Vercel
- Verify CORS_ORIGINS in Render backend
- Open browser console for specific errors

### Database connection errors
- Make sure you used INTERNAL database URL
- Check database is in same region as backend (Frankfurt)
- Try running migrations again

### Free tier services sleep after 15 minutes
- First request may take 30-60 seconds to wake up
- Consider upgrading to Starter plan ($7/month) for always-on

---

## 🆘 Need Help?

- **Render Logs**: Dashboard → Logs tab
- **Vercel Logs**: Project → Deployments → Function Logs
- **Render Support**: https://render.com/docs
- **Vercel Support**: https://vercel.com/docs

---

## 🚀 Optional Enhancements

### Add Custom Domain
- Buy a domain (Namecheap, GoDaddy, etc.)
- Add to Vercel: Project Settings → Domains
- Add to Render: Service Settings → Custom Domain

### Set Up Email
- Get Gmail App Password
- Update MAIL_* environment variables in Render
- Test email sending

### Enable Monitoring
- Render: Enable email alerts for service health
- Vercel: Set up Sentry for error tracking
- Consider adding analytics (Google Analytics, Plausible)

---

Good luck with your deployment! 🎊
