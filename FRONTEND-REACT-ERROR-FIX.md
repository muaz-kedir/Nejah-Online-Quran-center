# Frontend React Error - Fix Instructions

## Error
```
Invalid hook call. Hooks can only be called inside of the body of a function component.
Cannot read properties of null (reading 'useState')
```

## Root Cause
React is null or there are multiple copies of React loaded. This happens when:
1. Vite's cache is corrupted
2. Multiple React versions in node_modules
3. Hot module reload (HMR) broke the React context

## IMMEDIATE FIX

### Step 1: Stop Frontend Dev Server
Press `Ctrl+C` in the terminal running the frontend

### Step 2: Clear Vite Cache
```bash
cd frontend
rm -rf node_modules/.vite
rm -rf .tanstack
```

**On Windows:**
```powershell
cd frontend
rmdir /s /q node_modules\.vite
rmdir /s /q .tanstack
```

### Step 3: Restart Frontend
```bash
npm run dev
```

### Step 4: Hard Refresh Browser
- Press `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac)
- Or open in incognito/private mode

---

## If Still Not Working

### Check for Multiple React Versions
```bash
cd frontend
npm ls react
```

Should show only ONE version. If multiple versions, run:
```bash
npm dedupe
```

### Nuclear Option - Reinstall Dependencies
```bash
cd frontend
rm -rf node_modules
rm package-lock.json
npm install
npm run dev
```

---

## Why This Happened
The teachers page imports modal components that use React hooks. When Vite's HMR (Hot Module Reload) gets corrupted, React's context breaks and hooks stop working.

## Prevention
- Restart dev server periodically during development
- Clear `.vite` cache when seeing strange errors
- Don't edit files while HMR is reloading
