# Fix for Teacher Routes "Invalid Hook Call" Error

## Problem
When clicking "View Faculty" or "Add Teacher" buttons, you get an error:
```
Invalid hook call. Hooks can only be called inside of the body of a function component.
TypeError: Cannot read properties of null (reading 'useContext')
```

## Root Cause
This is a React Router context issue caused by stale build cache or the dev server not properly hot-reloading the route changes.

## Solution

### Step 1: Stop the Development Server
Press `Ctrl+C` in the terminal where your frontend dev server is running.

### Step 2: Clear Build Cache
Run these commands in the `frontend` directory:

```powershell
# Windows PowerShell
Remove-Item -Recurse -Force .tanstack,.vite,dist -ErrorAction SilentlyContinue
```

Or manually delete these folders:
- `frontend/.tanstack`
- `frontend/.vite`
- `frontend/dist`

### Step 3: Restart the Development Server
```bash
cd frontend
npm run dev
```

### Step 4: Hard Refresh Your Browser
- Press `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
- Or open DevTools (F12) → Right-click the refresh button → "Empty Cache and Hard Reload"

## Alternative Quick Fix (If Above Doesn't Work)

If the issue persists, try reinstalling dependencies:

```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

## Why This Happens

The error occurs because:
1. **Stale build cache**: Vite/TanStack caches compiled routes, and sometimes the cache gets out of sync
2. **Hot Module Replacement (HMR) issues**: The dev server doesn't always properly reload route changes
3. **React Context not initialized**: The router context isn't being passed down correctly due to cached modules

## Verification

After restarting, test these actions:
1. Click "Add Teacher" button on `/teachers` page
2. Click "View Faculty" button (eye icon) on any teacher row
3. Both should navigate without errors

## Prevention

To avoid this in the future:
- Restart the dev server after making route changes
- Clear cache regularly during development
- Use `npm run dev` instead of `npm start` for better HMR support
