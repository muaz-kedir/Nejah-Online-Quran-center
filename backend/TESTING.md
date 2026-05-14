# Testing the Nejah Backend API

You have several options to test the API. Choose the one that works best for you!

## Option 1: Using cURL (Built-in, No Installation Needed) ✅

cURL is already installed on Windows, Mac, and Linux. Just open your terminal!

### 1. Start the Backend

```bash
cd backend
npm run start:dev
```

Wait for: `🚀 Nejah Backend API is running on: http://localhost:3000/api`

### 2. Test Registration

```bash
curl -X POST http://localhost:3000/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@nejah.com\",\"password\":\"admin123\",\"name\":\"Admin User\",\"role\":\"admin\"}"
```

**Expected Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-here",
    "email": "admin@nejah.com",
    "name": "Admin User",
    "role": "admin"
  }
}
```

### 3. Test Login

```bash
curl -X POST http://localhost:3000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@nejah.com\",\"password\":\"admin123\"}"
```

**Copy the `access_token` from the response!**

### 4. Test Protected Endpoint (Get Profile)

Replace `YOUR_TOKEN` with the token from login:

```bash
curl -X GET http://localhost:3000/api/auth/profile ^
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 5. Get All Users (Admin Only)

```bash
curl -X GET http://localhost:3000/api/users ^
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Option 2: Using PowerShell (Windows) ✅

PowerShell has `Invoke-RestMethod` built-in!

### Register User

```powershell
$body = @{
    email = "admin@nejah.com"
    password = "admin123"
    name = "Admin User"
    role = "admin"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body
```

### Login

```powershell
$body = @{
    email = "admin@nejah.com"
    password = "admin123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body

# Save the token
$token = $response.access_token
Write-Host "Token: $token"
```

### Get Profile (Protected)

```powershell
$headers = @{
    Authorization = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:3000/api/auth/profile" `
  -Method Get `
  -Headers $headers
```

---

## Option 3: Using Browser (Simple GET Requests) ✅

For simple GET requests, just open your browser:

1. **Health Check:**
   ```
   http://localhost:3000/api/auth/profile
   ```
   (This will show 401 Unauthorized - that's expected without a token!)

---

## Option 4: Create a Simple HTML Test Page ✅

I'll create a test page for you!

Save this as `test-api.html` and open it in your browser:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Nejah API Tester</title>
    <style>
        body { font-family: Arial; max-width: 800px; margin: 50px auto; padding: 20px; }
        button { padding: 10px 20px; margin: 5px; cursor: pointer; }
        .success { color: green; }
        .error { color: red; }
        pre { background: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; }
        input { padding: 8px; margin: 5px; width: 300px; }
    </style>
</head>
<body>
    <h1>🚀 Nejah API Tester</h1>
    
    <div>
        <h2>1. Register User</h2>
        <input type="email" id="regEmail" placeholder="Email" value="admin@nejah.com">
        <input type="password" id="regPassword" placeholder="Password" value="admin123">
        <input type="text" id="regName" placeholder="Name" value="Admin User">
        <button onclick="register()">Register</button>
    </div>

    <div>
        <h2>2. Login</h2>
        <input type="email" id="loginEmail" placeholder="Email" value="admin@nejah.com">
        <input type="password" id="loginPassword" placeholder="Password" value="admin123">
        <button onclick="login()">Login</button>
    </div>

    <div>
        <h2>3. Get Profile (Protected)</h2>
        <button onclick="getProfile()">Get Profile</button>
    </div>

    <div>
        <h2>4. Get All Users (Admin Only)</h2>
        <button onclick="getUsers()">Get Users</button>
    </div>

    <div id="result"></div>

    <script>
        const API_URL = 'http://localhost:3000/api';
        let token = '';

        function showResult(data, isError = false) {
            const resultDiv = document.getElementById('result');
            resultDiv.innerHTML = `
                <h3 class="${isError ? 'error' : 'success'}">
                    ${isError ? '❌ Error' : '✅ Success'}
                </h3>
                <pre>${JSON.stringify(data, null, 2)}</pre>
            `;
        }

        async function register() {
            try {
                const response = await fetch(`${API_URL}/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: document.getElementById('regEmail').value,
                        password: document.getElementById('regPassword').value,
                        name: document.getElementById('regName').value,
                        role: 'admin'
                    })
                });
                const data = await response.json();
                if (response.ok) {
                    token = data.access_token;
                    showResult(data);
                } else {
                    showResult(data, true);
                }
            } catch (error) {
                showResult({ error: error.message }, true);
            }
        }

        async function login() {
            try {
                const response = await fetch(`${API_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: document.getElementById('loginEmail').value,
                        password: document.getElementById('loginPassword').value
                    })
                });
                const data = await response.json();
                if (response.ok) {
                    token = data.access_token;
                    showResult({ ...data, message: 'Token saved! You can now test protected endpoints.' });
                } else {
                    showResult(data, true);
                }
            } catch (error) {
                showResult({ error: error.message }, true);
            }
        }

        async function getProfile() {
            if (!token) {
                showResult({ error: 'Please login first to get a token!' }, true);
                return;
            }
            try {
                const response = await fetch(`${API_URL}/auth/profile`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                showResult(data, !response.ok);
            } catch (error) {
                showResult({ error: error.message }, true);
            }
        }

        async function getUsers() {
            if (!token) {
                showResult({ error: 'Please login first to get a token!' }, true);
                return;
            }
            try {
                const response = await fetch(`${API_URL}/users`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                showResult(data, !response.ok);
            } catch (error) {
                showResult({ error: error.message }, true);
            }
        }
    </script>
</body>
</html>
```

---

## Option 5: Using Postman (Optional) 📮

If you prefer a GUI tool:

1. Download Postman: https://www.postman.com/downloads/
2. Import this collection:

**Postman Collection:**
```json
{
  "info": {
    "name": "Nejah API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Register",
          "request": {
            "method": "POST",
            "header": [{"key": "Content-Type", "value": "application/json"}],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"admin@nejah.com\",\n  \"password\": \"admin123\",\n  \"name\": \"Admin User\",\n  \"role\": \"admin\"\n}"
            },
            "url": {"raw": "http://localhost:3000/api/auth/register"}
          }
        },
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "header": [{"key": "Content-Type", "value": "application/json"}],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"admin@nejah.com\",\n  \"password\": \"admin123\"\n}"
            },
            "url": {"raw": "http://localhost:3000/api/auth/login"}
          }
        }
      ]
    }
  ]
}
```

---

## Quick Test Script

I'll also create a test script for you!

Save this as `test-api.sh` (Mac/Linux) or `test-api.ps1` (Windows):

### For Windows (PowerShell):
```powershell
# test-api.ps1
Write-Host "🚀 Testing Nejah API..." -ForegroundColor Green

# Register
Write-Host "`n1. Testing Registration..." -ForegroundColor Yellow
$registerBody = @{
    email = "test@nejah.com"
    password = "test123"
    name = "Test User"
    role = "student"
} | ConvertTo-Json

$registerResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" `
    -Method Post -ContentType "application/json" -Body $registerBody
Write-Host "✅ Registration successful!" -ForegroundColor Green
$registerResponse | ConvertTo-Json

# Login
Write-Host "`n2. Testing Login..." -ForegroundColor Yellow
$loginBody = @{
    email = "test@nejah.com"
    password = "test123"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" `
    -Method Post -ContentType "application/json" -Body $loginBody
$token = $loginResponse.access_token
Write-Host "✅ Login successful! Token received." -ForegroundColor Green

# Get Profile
Write-Host "`n3. Testing Get Profile..." -ForegroundColor Yellow
$headers = @{ Authorization = "Bearer $token" }
$profileResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/profile" `
    -Method Get -Headers $headers
Write-Host "✅ Profile retrieved!" -ForegroundColor Green
$profileResponse | ConvertTo-Json

Write-Host "`n✅ All tests passed!" -ForegroundColor Green
```

Run it:
```powershell
.\test-api.ps1
```

---

## Recommended: Start with cURL or the HTML Test Page

**Easiest for beginners:**
1. Use the **HTML test page** (just open in browser)
2. Or use **cURL** commands (copy-paste in terminal)

**For advanced users:**
- Use Postman or Thunder Client (VS Code extension)

---

## Troubleshooting

### CORS Error in Browser?
Make sure your backend `.env` has:
```env
CORS_ORIGIN=http://localhost:8080
```

### Connection Refused?
1. Make sure backend is running: `npm run start:dev`
2. Check the port in `.env` (default: 3000)

### 401 Unauthorized?
- Make sure you're using the token from login
- Token format: `Bearer YOUR_TOKEN_HERE`

---

## Next Steps

Once you've tested the basic endpoints:
1. Try creating students
2. Try creating teachers
3. Test the role-based access (admin vs student)
4. Connect the frontend to the backend

Happy testing! 🚀
