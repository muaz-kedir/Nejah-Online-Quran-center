# Nejah API Test Script
# Run this in PowerShell: .\test-api.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🚀 Nejah API Testing Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$API_URL = "http://localhost:3000/api"

# Test 1: Register
Write-Host "📝 Test 1: Registering new user..." -ForegroundColor Yellow
try {
    $registerBody = @{
        email = "test@nejah.com"
        password = "test123456"
        name = "Test User"
        role = "student"
    } | ConvertTo-Json

    $registerResponse = Invoke-RestMethod -Uri "$API_URL/auth/register" `
        -Method Post `
        -ContentType "application/json" `
        -Body $registerBody `
        -ErrorAction Stop

    Write-Host "✅ Registration successful!" -ForegroundColor Green
    Write-Host "User ID: $($registerResponse.user.id)" -ForegroundColor Gray
    Write-Host "Email: $($registerResponse.user.email)" -ForegroundColor Gray
    Write-Host ""
} catch {
    if ($_.Exception.Response.StatusCode -eq 409) {
        Write-Host "⚠️  User already exists (this is OK)" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Registration failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Make sure the backend is running: cd backend && npm run start:dev" -ForegroundColor Yellow
        exit 1
    }
    Write-Host ""
}

# Test 2: Login
Write-Host "🔐 Test 2: Logging in..." -ForegroundColor Yellow
try {
    $loginBody = @{
        email = "test@nejah.com"
        password = "test123456"
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "$API_URL/auth/login" `
        -Method Post `
        -ContentType "application/json" `
        -Body $loginBody `
        -ErrorAction Stop

    $token = $loginResponse.access_token
    Write-Host "✅ Login successful!" -ForegroundColor Green
    Write-Host "Token: $($token.Substring(0, 30))..." -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 3: Get Profile
Write-Host "👤 Test 3: Getting user profile..." -ForegroundColor Yellow
try {
    $headers = @{
        Authorization = "Bearer $token"
    }

    $profileResponse = Invoke-RestMethod -Uri "$API_URL/auth/profile" `
        -Method Get `
        -Headers $headers `
        -ErrorAction Stop

    Write-Host "✅ Profile retrieved!" -ForegroundColor Green
    Write-Host "Name: $($profileResponse.name)" -ForegroundColor Gray
    Write-Host "Email: $($profileResponse.email)" -ForegroundColor Gray
    Write-Host "Role: $($profileResponse.role)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "❌ Failed to get profile: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 4: Get All Students
Write-Host "🎓 Test 4: Getting all students..." -ForegroundColor Yellow
try {
    $studentsResponse = Invoke-RestMethod -Uri "$API_URL/students" `
        -Method Get `
        -Headers $headers `
        -ErrorAction Stop

    Write-Host "✅ Students retrieved!" -ForegroundColor Green
    Write-Host "Total students: $($studentsResponse.Count)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "⚠️  No students found (this is OK for a new database)" -ForegroundColor Yellow
    Write-Host ""
}

# Test 5: Get All Teachers
Write-Host "👨‍🏫 Test 5: Getting all teachers..." -ForegroundColor Yellow
try {
    $teachersResponse = Invoke-RestMethod -Uri "$API_URL/teachers" `
        -Method Get `
        -Headers $headers `
        -ErrorAction Stop

    Write-Host "✅ Teachers retrieved!" -ForegroundColor Green
    Write-Host "Total teachers: $($teachersResponse.Count)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "⚠️  No teachers found (this is OK for a new database)" -ForegroundColor Yellow
    Write-Host ""
}

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ All tests completed successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Open test-api.html in your browser for a visual interface" -ForegroundColor White
Write-Host "2. Check backend/TESTING.md for more testing options" -ForegroundColor White
Write-Host "3. Use Postman or Thunder Client for advanced testing" -ForegroundColor White
Write-Host ""
