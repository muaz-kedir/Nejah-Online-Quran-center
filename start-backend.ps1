# Start Backend Server
Write-Host "=== Starting Backend Server ===" -ForegroundColor Cyan
Write-Host ""

# Navigate to backend directory
Set-Location -Path "backend"

Write-Host "Starting NestJS backend on port 3000..." -ForegroundColor Yellow
Write-Host ""
Write-Host "IMPORTANT:" -ForegroundColor Red
Write-Host "- Make sure PostgreSQL is running" -ForegroundColor White
Write-Host "- Backend will run on http://localhost:3000" -ForegroundColor White
Write-Host "- Press Ctrl+C to stop the server" -ForegroundColor White
Write-Host ""

# Start the backend
npm run start:dev
