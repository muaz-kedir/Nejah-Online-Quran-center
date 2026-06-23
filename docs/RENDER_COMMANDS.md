# Render Shell Commands Reference

## After Frontend Deployment to Vercel

Once you have deployed to Vercel and have your URL, follow these commands in the Render Shell.

### 1. Access Render Shell

1. Go to: https://dashboard.render.com
2. Select service: `nejah-online-quran-center`
3. Click "Shell" tab (top right)
4. Wait for shell to load

### 2. Run Database Migrations

This creates the necessary database tables and adds the Zoom fields to `class_sessions` table.

```bash
npm run migration:run
```

**Expected Output**:
```
query: SELECT * FROM "information_schema"."tables" WHERE "table_schema" = current_schema() AND "table_name" = 'migrations'
query: SELECT * FROM "migrations" "migrations" ORDER BY "id" DESC
0 migrations are already loaded in the database.
1 migrations were found in the source code.
AddZoomFieldsToClassSession1718582400000 is the last executed migration. It was executed on [timestamp].
1 migrations are new migrations must be executed.
query: START TRANSACTION
query: ALTER TABLE "class_sessions" ADD "zoomMeetingId" character varying
query: ALTER TABLE "class_sessions" ADD "zoomPassword" character varying
query: INSERT INTO "migrations"("timestamp", "name") VALUES ($1, $2) -- PARAMETERS: [1718582400000,"AddZoomFieldsToClassSession1718582400000"]
Migration AddZoomFieldsToClassSession1718582400000 has been executed successfully.
query: COMMIT
```

If you see this, migrations ran successfully! ✅

### 3. Seed Super Admin Account

This creates the initial admin user to access the system.

```bash
npm run seed:superadmin
```

**Expected Output**:
```
🌱 Seeding super admin...
✅ Super admin created successfully!
   Email: admin@nejah.com
   Password: [generated-password]
   Role: SUPER_ADMIN
🎉 Please save these credentials in a secure location!
```

**IMPORTANT**: Copy these credentials immediately! You'll need them to log in.

### 4. Verify Application is Running

Check if the backend is responding:

```bash
curl http://localhost:3000/api/health
```

**Expected Output**:
```
{"status":"ok","timestamp":"2026-06-21T..."}
```

Or check externally:
- Visit: https://nejah-online-quran-center.onrender.com/api/health
- Should show: `{"status":"ok"}`

### 5. Check Environment Variables (Optional)

Verify critical environment variables are set:

```bash
echo "DB_HOST=$DB_HOST"
echo "DB_NAME=$DB_NAME"
echo "CORS_ORIGIN=$CORS_ORIGIN"
echo "ZOOM_CLIENT_ID=$ZOOM_CLIENT_ID"
```

Make sure `CORS_ORIGIN` includes your Vercel URL!

### 6. View Application Logs (Optional)

To see real-time logs:

```bash
npm run start:prod
```

Or in Render dashboard, go to "Logs" tab.

## Troubleshooting Commands

### Check Database Connection

```bash
npm run migration:show
```

This lists all migrations and their status.

### Revert Last Migration (if needed)

⚠️ **Use with caution!**

```bash
npm run migration:revert
```

### Check Node/NPM Version

```bash
node --version
npm --version
```

Expected: Node 18+ and npm 9+

### Clear npm Cache (if build fails)

```bash
npm cache clean --force
rm -rf node_modules
npm install
```

### Check Database Tables

If you want to verify tables were created:

```bash
psql $DATABASE_URL -c "\dt"
```

Should show tables including `class_sessions`, `users`, `teachers`, `students`, etc.

### Test Database Query

```bash
psql $DATABASE_URL -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'class_sessions';"
```

Should include `zoomMeetingId` and `zoomPassword` columns.

## Post-Deployment Verification

### 1. Health Check
```bash
curl https://nejah-online-quran-center.onrender.com/api/health
```

### 2. Test CORS (from your local machine)
```bash
curl -H "Origin: https://your-vercel-app.vercel.app" -I https://nejah-online-quran-center.onrender.com/api/health
```

Check the response headers for:
```
Access-Control-Allow-Origin: https://your-vercel-app.vercel.app
```

### 3. Test Login Endpoint
```bash
curl -X POST https://nejah-online-quran-center.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@nejah.com","password":"your-password"}'
```

Should return a JWT token.

## Common Issues & Fixes

### Issue: "Migration failed"
**Solution**:
```bash
# Check if database is accessible
psql $DATABASE_URL -c "SELECT NOW();"

# If successful, try migration again
npm run migration:run
```

### Issue: "Module not found"
**Solution**:
```bash
# Reinstall dependencies
npm install
npm run build
npm run start:prod
```

### Issue: "Port already in use"
**Solution**:
Render automatically manages ports. Just restart the service from the dashboard.

### Issue: "Super admin already exists"
**Output**:
```
Error: User with email admin@nejah.com already exists
```

This is normal if you've already seeded once. Just use the existing credentials.

## Environment Variables to Verify

Before running commands, ensure these are set in Render Environment:

```bash
NODE_ENV=production
PORT=3000
API_PREFIX=api

DB_HOST=dpg-d8o4lfbsq97s73f5tidg-a.oregon-postgres.render.com
DB_PORT=5432
DB_USERNAME=nejah_db_user
DB_PASSWORD=kIKYguf84ZmP4EGNgXsf1bOoDqWDhKuy
DB_NAME=nejah_db

JWT_SECRET=<strong-secret-here>
JWT_EXPIRATION=7d

ZOOM_ACCOUNT_ID=4n4pB5R5QLeq1hI7VccrwA
ZOOM_CLIENT_ID=I1rcFuVQTQCQqgOIRPww5A
ZOOM_CLIENT_SECRET=3qEsFaBZkhdyrIa964GQLS9pfoyVZBl6
ZOOM_SECRET_TOKEN=sl8uTpezSUeqYc7DXpKK3w
ENCRYPTION_KEY=<32-byte-key-here>

# UPDATE THIS WITH YOUR VERCEL URL
CORS_ORIGIN=https://your-vercel-app.vercel.app,http://localhost:8080
```

## Quick Command Summary

```bash
# Essential commands in order:
npm run migration:run           # Run migrations
npm run seed:superadmin         # Create admin account

# Verification commands:
npm run migration:show          # Show migration status
curl http://localhost:3000/api/health  # Check health

# Troubleshooting commands:
npm run migration:revert        # Revert last migration
npm cache clean --force         # Clear npm cache
psql $DATABASE_URL -c "\dt"     # List database tables
```

## Success Indicators

✅ Migration output shows "successfully"  
✅ Super admin credentials displayed  
✅ Health check returns {"status":"ok"}  
✅ No error messages in logs  
✅ CORS header includes Vercel URL  

## Next Steps After Commands

1. Save super admin credentials securely
2. Test login from frontend (Vercel URL)
3. Verify API calls work (check Network tab)
4. Test Zoom auto-create feature
5. Monitor Render logs for any errors

---

**Need Help?**
- Check Render logs: Dashboard → Logs tab
- Review deployment docs: DEPLOYMENT_GUIDE.md
- Full checklist: DEPLOY_CHECKLIST.md
