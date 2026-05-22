# How to Start the Application

## Prerequisites
1. ✅ PostgreSQL must be running
2. ✅ Node.js installed
3. ✅ Dependencies installed (`npm install` in both frontend and backend)

## Step-by-Step Startup

### 1. Start PostgreSQL Database
Make sure PostgreSQL is running on your system.

**Windows:**
- Open Services (Win+R → `services.msc`)
- Find "postgresql-x64-XX" service
- Click "Start" if it's not running

**Or check if it's running:**
```powershell
Get-Service -Name postgresql*
```

### 2. Start Backend Server (Terminal 1)
```powershell
cd backend
npm run start:dev
```

**Wait for this message:**
```
Nest application successfully started
Application is running on: http://localhost:3000
```

### 3. Start Frontend Server (Terminal 2)
Open a **NEW terminal** and run:
```powershell
cd frontend
npm run dev
```

**Wait for this message:**
```
Local: http://localhost:8080/
```

### 4. Access the Application
Open your browser and go to:
- **Frontend:** http://localhost:8080
- **Backend API:** http://localhost:3000/api

## Common Issues

### Issue: ERR_CONNECTION_REFUSED
**Cause:** Backend server is not running

**Solution:**
1. Open a terminal
2. Run: `cd backend`
3. Run: `npm run start:dev`
4. Wait for "Application is running on: http://localhost:3000"

### Issue: Database connection error
**Cause:** PostgreSQL is not running

**Solution:**
1. Start PostgreSQL service
2. Check connection in `backend/.env`:
   ```
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=your_password
   DB_DATABASE=nejah_db
   ```

### Issue: Port already in use
**Cause:** Another process is using port 3000 or 8080

**Solution:**
```powershell
# Find process on port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

## Quick Start Script

Run this PowerShell script to start the backend:
```powershell
.\start-backend.ps1
```

## Verification Checklist

Before using the app, verify:
- [ ] PostgreSQL service is running
- [ ] Backend is running on http://localhost:3000
- [ ] Frontend is running on http://localhost:8080
- [ ] No connection errors in browser console

## Current Error Fix

Your error `ERR_CONNECTION_REFUSED` means:
1. Backend is NOT running
2. You need to start it with: `cd backend && npm run start:dev`
3. Wait for it to fully start before trying to register/login
