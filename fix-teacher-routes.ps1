# Fix Teacher Routes - Clear Cache and Restart
Write-Host "=== Fixing Teacher Routes ===" -ForegroundColor Green
Write-Host ""

# Step 1: Navigate to frontend directory
Write-Host "Step 1: Navigating to frontend directory..." -ForegroundColor Yellow
Set-Location -Path "frontend"

# Step 2: Clear build cache
Write-Host "Step 2: Clearing build cache..." -ForegroundColor Yellow
if (Test-Path ".tanstack") {
    Remove-Item -Recurse -Force ".tanstack"
    Write-Host "  Removed .tanstack" -ForegroundColor Green
}
if (Test-Path ".vite") {
    Remove-Item -Recurse -Force ".vite"
    Write-Host "  Removed .vite" -ForegroundColor Green
}
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
    Write-Host "  Removed dist" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Cache Cleared Successfully ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Run: npm run dev" -ForegroundColor White
Write-Host "2. Wait for the dev server to start" -ForegroundColor White
Write-Host "3. Open your browser and press Ctrl+Shift+R to hard refresh" -ForegroundColor White
Write-Host "4. Test the Add Teacher and View Faculty buttons" -ForegroundColor White
Write-Host ""
