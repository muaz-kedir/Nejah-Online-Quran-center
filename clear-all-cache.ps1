# Complete Cache Clear Script
Write-Host "=== Clearing All Caches ===" -ForegroundColor Cyan
Write-Host ""

# Navigate to frontend
Set-Location -Path "frontend"

# Clear Vite/Build cache
Write-Host "Clearing build cache..." -ForegroundColor Yellow
if (Test-Path ".tanstack") { Remove-Item -Recurse -Force ".tanstack"; Write-Host "  Removed .tanstack" -ForegroundColor Green }
if (Test-Path ".vite") { Remove-Item -Recurse -Force ".vite"; Write-Host "  Removed .vite" -ForegroundColor Green }
if (Test-Path "dist") { Remove-Item -Recurse -Force "dist"; Write-Host "  Removed dist" -ForegroundColor Green }

Write-Host ""
Write-Host "=== Cache Cleared! ===" -ForegroundColor Green
Write-Host ""
Write-Host "IMPORTANT NEXT STEPS:" -ForegroundColor Red
Write-Host "1. Restart dev server: npm run dev" -ForegroundColor White
Write-Host "2. In your browser, press Ctrl+Shift+Delete" -ForegroundColor White
Write-Host "3. Clear 'Cached images and files'" -ForegroundColor White
Write-Host "4. Or press Ctrl+Shift+R to hard refresh" -ForegroundColor White
Write-Host ""
Write-Host "The sidebar is ALREADY green in the code." -ForegroundColor Yellow
Write-Host "If you still see gray, it's your browser cache!" -ForegroundColor Yellow
Write-Host ""
