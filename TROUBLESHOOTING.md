# Troubleshooting Guide

## Common Issues and Solutions

### 1. Git Push Email Privacy Error ✅ FIXED

**Error:**
```
remote: error: GH007: Your push would publish a private email address.
```

**Solution:**
```bash
git config user.email "muaz-kedir@users.noreply.github.com"
git commit --amend --reset-author --no-edit
git push origin main
```

---

### 2. Backend Won't Start

**Error:**
```
Error: Cannot find module '@nestjs/common'
```

**Solution:**
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
npm run start:dev
```

---

### 3. Database Connection Error

**Error:**
```
ECONNREFUSED 127.0.0.1:5432
```

**Solution:**
1. Make sure PostgreSQL is installed and running
2. Check your `.env` file in backend folder:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=nejah_db
```
3. Create the database:
```sql
CREATE DATABASE nejah_db;
```

---

### 4. Frontend Build Errors

**Error:**
```
Module not found or import errors
```

**Solution:**
```bash
cd frontend
rm -rf node_modules .tanstack dist
npm install
npm run build
```

---

### 5. Port Already in Use

**Error:**
```
Port 3000 is already in use
```

**Solution:**

**Windows:**
```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

**Or change the port in backend/.env:**
```env
PORT=3001
```

---

### 6. CORS Errors in Browser

**Error:**
```
Access to fetch blocked by CORS policy
```

**Solution:**
Update `backend/.env`:
```env
CORS_ORIGIN=http://localhost:8080
```

Make sure frontend is running on port 8080, or update the CORS_ORIGIN to match your frontend port.

---

### 7. JWT Token Errors

**Error:**
```
401 Unauthorized
```

**Solutions:**
1. Make sure you're logged in and have a valid token
2. Check token format: `Authorization: Bearer YOUR_TOKEN`
3. Token might be expired - login again
4. Check JWT_SECRET in backend/.env

---

### 8. TypeScript Errors in Backend

**Error:**
```
Cannot find name 'X' or type errors
```

**Solution:**
```bash
cd backend
npm install --save-dev @types/node @types/express
npm run build
```

---

### 9. Module Resolution Errors

**Error:**
```
Cannot find module '@/...'
```

**Solution:**
Check `tsconfig.json` has paths configured:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

---

### 10. Database Schema Sync Issues

**Error:**
```
relation "users" does not exist
```

**Solution:**
1. Make sure `synchronize: true` in development (app.module.ts)
2. Drop and recreate database:
```sql
DROP DATABASE nejah_db;
CREATE DATABASE nejah_db;
```
3. Restart backend - tables will be created automatically

---

## Quick Fixes

### Reset Everything (Nuclear Option)

**Frontend:**
```bash
cd frontend
rm -rf node_modules dist .tanstack
npm install
```

**Backend:**
```bash
cd backend
rm -rf node_modules dist
npm install
```

**Database:**
```sql
DROP DATABASE IF EXISTS nejah_db;
CREATE DATABASE nejah_db;
```

---

## Verification Checklist

Before asking for help, verify:

- [ ] Node.js 18+ installed: `node --version`
- [ ] PostgreSQL installed and running
- [ ] Database created: `nejah_db`
- [ ] `.env` file exists in backend folder
- [ ] Dependencies installed in both frontend and backend
- [ ] No other process using ports 3000 or 8080
- [ ] Git email configured correctly

---

## Getting Help

If none of these solutions work:

1. **Check the error message carefully**
2. **Note when it occurs** (install, build, runtime)
3. **Check the logs** for more details
4. **Try the nuclear option** (reset everything)
5. **Share the full error message** for specific help

---

## Useful Commands

```bash
# Check Node version
node --version

# Check npm version
npm --version

# Check PostgreSQL status (Windows)
sc query postgresql-x64-14

# Check what's running on port 3000
netstat -ano | findstr :3000

# Check what's running on port 8080
netstat -ano | findstr :8080

# View backend logs
cd backend
npm run start:dev

# View frontend logs
cd frontend
npm run dev

# Test database connection
psql -U postgres -d nejah_db
```

---

## Environment Setup Verification

Run this to verify your setup:

```bash
# Check Node.js
node --version

# Check npm
npm --version

# Check PostgreSQL
psql --version

# Check if database exists
psql -U postgres -c "\l" | grep nejah_db
```

---

## Still Having Issues?

1. Check the specific README files:
   - `backend/README.md`
   - `backend/SETUP.md`
   - `backend/TESTING.md`
   - `frontend/README.md`

2. Make sure you followed the setup steps in order

3. Try the test scripts:
   - `backend/test-api.html`
   - `backend/test-api.ps1`
