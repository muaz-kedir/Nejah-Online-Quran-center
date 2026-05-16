# PostgreSQL Password Reset Script
# Run this as Administrator

Write-Host "=== PostgreSQL Password Reset ===" -ForegroundColor Cyan
Write-Host ""

$newPassword = "postgres123"

Write-Host "Step 1: Stopping PostgreSQL service..." -ForegroundColor Yellow
Stop-Service postgresql-x64-18 -Force
Start-Sleep -Seconds 2

Write-Host "Step 2: Modifying pg_hba.conf to allow trust authentication..." -ForegroundColor Yellow
$pgHbaPath = "C:\Program Files\PostgreSQL\18\data\pg_hba.conf"
$backupPath = "C:\Program Files\PostgreSQL\18\data\pg_hba.conf.backup"

# Backup original file
Copy-Item $pgHbaPath $backupPath -Force

# Read and modify
$content = Get-Content $pgHbaPath
$newContent = $content -replace "^(host\s+all\s+all\s+127\.0\.0\.1/32\s+)\w+", '$1trust' `
                       -replace "^(host\s+all\s+all\s+::1/128\s+)\w+", '$1trust'
$newContent | Set-Content $pgHbaPath

Write-Host "Step 3: Starting PostgreSQL service..." -ForegroundColor Yellow
Start-Service postgresql-x64-18
Start-Sleep -Seconds 3

Write-Host "Step 4: Resetting password..." -ForegroundColor Yellow
$env:PGPASSWORD = ''
psql -U postgres -c "ALTER USER postgres WITH PASSWORD '$newPassword';"

Write-Host "Step 5: Restoring pg_hba.conf..." -ForegroundColor Yellow
Stop-Service postgresql-x64-18 -Force
Start-Sleep -Seconds 2
Copy-Item $backupPath $pgHbaPath -Force
Start-Service postgresql-x64-18
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "=== Password Reset Complete! ===" -ForegroundColor Green
Write-Host "New password: $newPassword" -ForegroundColor Green
Write