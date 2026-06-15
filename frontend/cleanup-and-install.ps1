# Force cleanup and reinstall script for Windows
Write-Host "Stopping all Node processes..."
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "Waiting for processes to stop..."
Start-Sleep -Seconds 3

Write-Host "Removing node_modules using robocopy (handles locked files)..."
if (Test-Path "node_modules") {
    # Create empty temp directory
    $emptyDir = Join-Path $env:TEMP "empty_$(Get-Random)"
    New-Item -ItemType Directory -Path $emptyDir -Force | Out-Null
    
    # Use robocopy to mirror empty directory (deletes everything in target)
    robocopy $emptyDir "node_modules" /MIR /R:0 /W:0 /NFL /NDL /NJH /NJS | Out-Null
    
    # Remove the now-empty node_modules directory
    Remove-Item "node_modules" -Force -ErrorAction SilentlyContinue
    Remove-Item $emptyDir -Force -Recurse -ErrorAction SilentlyContinue
    
    Write-Host "node_modules removed successfully"
}

Write-Host "Removing package-lock.json..."
Remove-Item "package-lock.json" -Force -ErrorAction SilentlyContinue

Write-Host "Clearing npm cache..."
npm cache clean --force 2>$null

Write-Host "Installing dependencies with npm..."
npm install --legacy-peer-deps

Write-Host ""
Write-Host "Installation complete! You can now run: npm run dev"
