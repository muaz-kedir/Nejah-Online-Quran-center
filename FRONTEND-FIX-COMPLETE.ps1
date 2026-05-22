# Complete Frontend Fix - Run this to resolve all dev server issues
Write-Host "=== Complete Frontend Dev Server Fix ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Kill any existing processes on port 8080
Write-Host "Step 1: Killing any processes on port 8080..." -ForegroundColor Yellow
$processes = netstat -ano | findstr :8080
if ($processes) {
    $pid = $processes -split '\s+' | Select-Object -Last 1
    Write-Host "Found process on port 8080 (PID: $pid), killing it..." -ForegroundColor Yellow
    taskkill /PID $pid /F -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

# Step 2: Navigate to frontend
Write-Host "Step 2: Navigating to frontend directory..." -ForegroundColor Yellow
Set-Location -Path "frontend"

# Step 3: Clear all caches
Write-Host "Step 3: Clearing all caches..." -ForegroundColor Yellow
Remove-Item -Recurse -Force .vite -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .tanstack -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules/.vite -ErrorAction SilentlyContinue

# Step 4: Clear npm cache
Write-Host "Step 4: Clearing npm cache..." -ForegroundColor Yellow
npm cache clean --force

# Step 5: Reinstall dependencies
Write-Host "Step 5: Reinstalling dependencies..." -ForegroundColor Yellow
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
npm install

# Step 6: Start dev server
Write-Host ""
Write-Host "=== Starting Frontend Dev Server ===" -ForegroundColor Green
Write-Host "The dev server will start on http://localhost:8080" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Green
Write-Host ""

npm run dev
