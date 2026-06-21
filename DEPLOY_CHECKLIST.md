# Deployment Checklist - Nejah Online Quran Center

## ✅ Pre-Deployment Verification

### Backend (Render) - COMPLETED
- [x] Service deployed at: https://nejah-online-quran-center.onrender.com
- [x] Database configured (PostgreSQL on Render)
- [x] All dependencies installed (including `web-push`)
- [x] Zoom fields migration created: `1718582400000-AddZoomFieldsToClassSession.ts`
- [x] Zoom auto-create logic implemented in `AttendanceService.startMeeting()`
- [x] Hydration fixes applied (Toaster, Navbar)
- [x] Latest code pulled from `origin/main`

### Frontend (Vercel) - READY TO DEPLOY
- [x] `vercel.json` configured correctly
- [x] Build script `build:vercel` exists in package.json
- [x] Environment variables pre-configured in vercel.json
- [x] API URL points to Render backend
- [x] WebSocket URL configured

## 📋 Deployment Steps

### Step 1: Deploy Frontend to Vercel

1. **Go to Vercel Dashboard**
   - Navigate to: https://vercel.com/dashboard
   - Click "Add New" → "Project"

2. **Import Repository**
   - Select: `muaz-kedir/Nejah-Online-Quran-center`
   - Click "Import"

3. **Configure Project**
   ```
   Framework Preset: Other
   Root Directory: frontend
   Build Command: npm run build:vercel
   Output Directory: .vercel/output
   Install Command: npm install
   ```

4. **Environment Variables** (Auto-configured from vercel.json)
   ```
   VITE_API_URL=https://nejah-online-quran-center.onrender.com/api
   VITE_WS_URL=https://nejah-online-quran-center.onrender.com
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait 2-5 minutes for build
   - **Copy the deployment URL** (e.g., `https://nejah-online-quran-center.vercel.app`)

### Step 2: Update Backend CORS

1. **Go to Render Dashboard**
   - Navigate to: https://dashboard.render.com
   - Select your service: `nejah-online-quran-center`

2. **Update Environment Variable**
   - Go to "Environment" tab
   - Find `CORS_ORIGIN` variable
   - Update value to:
     ```
     https://your-vercel-app.vercel.app,http://localhost:8080
     ```
   - Replace `your-vercel-app` with your actual Vercel deployment URL

3. **Redeploy Backend**
   - Click "Manual Deploy" → "Deploy latest commit"
   - Wait for deployment to complete

### Step 3: Run Database Migrations on Render

1. **Open Render Shell**
   - In Render dashboard, go to your service
   - Click "Shell" tab or use "Connect" → "Web Shell"

2. **Run Migration**
   ```bash
   npm run migration:run
   ```
   - This creates the Zoom fields in `class_sessions` table
   - Verify success: "Migration AddZoomFieldsToClassSession1718582400000 has been executed successfully"

3. **Seed Super Admin**
   ```bash
   npm run seed:superadmin
   ```
   - Creates initial admin account
   - Note the credentials displayed in output

### Step 4: Verify Deployment

#### Backend Health Check
- [ ] Visit: https://nejah-online-quran-center.onrender.com/api/health
- [ ] Should return: `{"status":"ok"}` or similar

#### Frontend Load Test
- [ ] Visit your Vercel URL
- [ ] Homepage loads without errors
- [ ] Theme toggle works (light/dark)
- [ ] Language selector works (English/Arabic/Amharic)
- [ ] No hydration errors in browser console

#### Authentication Test
- [ ] Click "Register" - page loads
- [ ] Click "Login" - page loads
- [ ] Try logging in with super admin credentials

#### API Connection Test
- [ ] Open browser DevTools → Network tab
- [ ] Attempt login or any API call
- [ ] Verify requests go to: `https://nejah-online-quran-center.onrender.com/api`
- [ ] Check for CORS errors (should be none)

#### WebSocket Test
- [ ] After login, check Network tab → WS filter
- [ ] Should see WebSocket connection to: `wss://nejah-online-quran-center.onrender.com`
- [ ] Connection status should be "connected"

## 🔧 Post-Deployment Configuration

### Environment Variables to Double-Check on Render

```bash
NODE_ENV=production
PORT=3000
API_PREFIX=api

# Database (verify these match your Render PostgreSQL)
DB_HOST=dpg-d8o4lfbsq97s73f5tidg-a.oregon-postgres.render.com
DB_PORT=5432
DB_USERNAME=nejah_db_user
DB_PASSWORD=kIKYguf84ZmP4EGNgXsf1bOoDqWDhKuy
DB_NAME=nejah_db

# JWT (update to strong secret)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRATION=7d

# Zoom API
ZOOM_ACCOUNT_ID=4n4pB5R5QLeq1hI7VccrwA
ZOOM_CLIENT_ID=I1rcFuVQTQCQqgOIRPww5A
ZOOM_CLIENT_SECRET=3qEsFaBZkhdyrIa964GQLS9pfoyVZBl6
ZOOM_SECRET_TOKEN=sl8uTpezSUeqYc7DXpKK3w
ENCRYPTION_KEY=change-this-to-a-32-byte-key-in-production

# CORS (UPDATE THIS with your Vercel URL)
CORS_ORIGIN=https://your-vercel-app.vercel.app,http://localhost:8080
```

## 🧪 Feature Testing Checklist

### Authentication & Authorization
- [ ] Register new parent account
- [ ] Login with parent account
- [ ] Login with super admin account
- [ ] Verify role-based access (admin vs parent views)
- [ ] Test logout functionality

### Class Session Management (Teacher View)
- [ ] Create new class session
- [ ] View scheduled sessions
- [ ] Start meeting WITHOUT providing Zoom link (tests auto-create)
  - Should automatically generate Zoom meeting
  - Should display meeting link and credentials
- [ ] Start meeting WITH manual Zoom link
- [ ] Record student attendance (join/leave)
- [ ] End session and add notes

### Student Dashboard (Parent View)
- [ ] View assigned students
- [ ] View attendance history
- [ ] Check attendance statistics
- [ ] View upcoming sessions
- [ ] Access live class (if session is running)

### Real-time Features
- [ ] Test notifications (meeting started, attendance recorded)
- [ ] Verify WebSocket connection stays active
- [ ] Test chat functionality (if applicable)

### UI/UX Testing
- [ ] Theme toggle (light → dark → light)
- [ ] Language switch (English → Arabic → Amharic)
- [ ] Mobile responsive design
  - Test on phone/tablet viewport
  - Mobile menu opens/closes
  - Forms are usable on mobile
- [ ] Page transitions are smooth
- [ ] No console errors

## 🚨 Troubleshooting

### Common Issues

#### 1. "CORS Error" in frontend
**Symptom**: API calls fail with CORS error in browser console

**Solution**:
- Verify `CORS_ORIGIN` on Render includes your Vercel URL
- Ensure no trailing slash in URLs
- Restart Render service after updating

#### 2. "Failed to auto-create Zoom meeting"
**Symptom**: Error when starting session without meeting link

**Possible Causes**:
- Teacher hasn't connected Zoom account
- Zoom API credentials invalid
- Zoom integration expired

**Solution**:
- Go to Settings → Zoom Integration
- Re-authorize Zoom account
- Or provide manual meeting link

#### 3. Hydration Errors in Console
**Symptom**: "Hydration failed" errors in browser console

**Solution**:
- Clear browser cache
- Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
- Verify latest code is deployed
- Check `Toaster` and `Navbar` components have `mounted` state

#### 4. Build Fails on Vercel
**Symptom**: Deployment fails during build

**Solution**:
- Check Vercel build logs for specific error
- Verify `build:vercel` script runs locally: `cd frontend && npm run build:vercel`
- Ensure all dependencies are in package.json
- Check for TypeScript errors

#### 5. Database Connection Error
**Symptom**: Backend returns 500 errors, logs show "Connection refused"

**Solution**:
- Verify database credentials in Render environment variables
- Check database is running (Render dashboard)
- Ensure `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME` are correct

#### 6. Migrations Don't Run
**Symptom**: "Column does not exist" errors

**Solution**:
```bash
# In Render Shell
npm run migration:run

# If that fails, check migration path in data-source.ts
# Should point to: src/migrations/*{.ts,.js}
```

## 📊 Monitoring

### What to Monitor After Deployment

1. **Render Dashboard**
   - CPU/Memory usage
   - Response times
   - Error logs
   - Database connection pool

2. **Vercel Analytics**
   - Page load times
   - Unique visitors
   - Build success rate

3. **Browser Console (Frontend)**
   - JavaScript errors
   - API call failures
   - WebSocket disconnections

4. **Application Logs (Backend)**
   - Unhandled exceptions
   - Database query errors
   - Zoom API failures
   - Notification delivery issues

## 📝 Notes

### Migration Information
- **Migration File**: `1718582400000-AddZoomFieldsToClassSession.ts`
- **What it does**: Adds `zoomMeetingId` and `zoomPassword` columns to `class_sessions` table
- **Required for**: Zoom auto-create meeting feature

### Key Features Deployed
1. ✅ Zoom Auto-Create Meetings (no manual link needed)
2. ✅ React Hydration Fixes (no console errors)
3. ✅ Web Push Notifications
4. ✅ Multi-language Support (EN/AR/AM)
5. ✅ Theme Toggle (Light/Dark)
6. ✅ Real-time Attendance Tracking
7. ✅ WebSocket Communication

## ✅ Final Checklist

Before considering deployment complete:

- [ ] Frontend deployed to Vercel
- [ ] Vercel URL copied
- [ ] Backend CORS updated with Vercel URL
- [ ] Backend redeployed
- [ ] Migrations run successfully
- [ ] Super admin seeded
- [ ] Authentication works
- [ ] API calls succeed (no CORS errors)
- [ ] WebSocket connection established
- [ ] Zoom auto-create tested
- [ ] Theme toggle works
- [ ] Language selector works
- [ ] No errors in browser console
- [ ] No errors in Render logs

## 🎉 Success Criteria

Deployment is successful when:
1. ✅ Frontend loads at Vercel URL
2. ✅ Backend responds to API requests
3. ✅ Login/registration works
4. ✅ Teacher can create and start sessions
5. ✅ Zoom meetings auto-create without manual links
6. ✅ Students can join live classes
7. ✅ Attendance tracking works
8. ✅ Real-time notifications deliver
9. ✅ No hydration or CORS errors
10. ✅ UI is responsive and functional

---

**Deployment Date**: _________________

**Deployed By**: _________________

**Vercel URL**: _________________

**Backend URL**: https://nejah-online-quran-center.onrender.com

**Database**: postgresql://nejah_db_user:***@dpg-d8o4lfbsq97s73f5tidg-a/nejah_db

**Status**: ⬜ Pending | ⬜ In Progress | ⬜ Complete
