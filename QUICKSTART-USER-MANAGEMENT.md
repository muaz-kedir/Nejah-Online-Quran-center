# 🚀 Quick Start - User Management

## 1. Super Admin Already Created! ✅

**Login Credentials:**
```
Email: superadmin@nejah.com
Password: SuperAdmin123!
```

## 2. Test Login

### Option A: Using Frontend

1. Open browser: `http://localhost:8080`
2. Go to login page
3. Enter super admin credentials
4. You're in!

### Option B: Using API

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@nejah.com",
    "password": "SuperAdmin123!"
  }'
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "email": "superadmin@nejah.com",
    "name": "Super Administrator",
    "role": "super_admin"
  }
}
```

## 3. Access User Management

### Frontend Route
```
http://localhost:8080/users
```

### API Endpoints
```
GET    http://localhost:3000/api/users
POST   http://localhost:3000/api/users
PATCH  http://localhost:3000/api/users/:id
DELETE http://localhost:3000/api/users/:id
```

## 4. Create Your First User

### Using Frontend

1. Navigate to `/users`
2. Click "Add User" button
3. Fill in the form:
   - **Name**: John Teacher
   - **Email**: john@nejah.com
   - **Password**: teacher123
   - **Role**: Teacher
   - **Status**: ✅ Active
4. Click "Create User"
5. Done! ✅

### Using API

```bash
# Get your token first (from login response)
TOKEN="your_access_token_here"

# Create a teacher
curl -X POST http://localhost:3000/api/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Teacher",
    "email": "john@nejah.com",
    "password": "teacher123",
    "role": "teacher",
    "isActive": true
  }'
```

## 5. Search & Filter Users

### Search by Name
```bash
curl -X GET "http://localhost:3000/api/users?search=john" \
  -H "Authorization: Bearer $TOKEN"
```

### Filter by Role
```bash
curl -X GET "http://localhost:3000/api/users?role=teacher" \
  -H "Authorization: Bearer $TOKEN"
```

### Filter by Status
```bash
curl -X GET "http://localhost:3000/api/users?isActive=true" \
  -H "Authorization: Bearer $TOKEN"
```

### Combined Filters
```bash
curl -X GET "http://localhost:3000/api/users?search=john&role=teacher&page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

## 6. Update a User

```bash
curl -X PATCH http://localhost:3000/api/users/USER_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Updated",
    "role": "admin"
  }'
```

## 7. Toggle User Status

```bash
curl -X PATCH http://localhost:3000/api/users/USER_ID/toggle-status \
  -H "Authorization: Bearer $TOKEN"
```

## 8. Delete a User

```bash
curl -X DELETE http://localhost:3000/api/users/USER_ID \
  -H "Authorization: Bearer $TOKEN"
```

## 9. View Your Profile

```bash
curl -X GET http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer $TOKEN"
```

## 10. Change Password

```bash
curl -X POST http://localhost:3000/api/users/change-password \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "SuperAdmin123!",
    "newPassword": "NewSecurePass123!",
    "confirmPassword": "NewSecurePass123!"
  }'
```

## Common Tasks

### Create Multiple Users

```bash
# Create Admin
curl -X POST http://localhost:3000/api/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@nejah.com",
    "password": "admin123",
    "role": "admin",
    "isActive": true
  }'

# Create Teacher
curl -X POST http://localhost:3000/api/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Teacher User",
    "email": "teacher@nejah.com",
    "password": "teacher123",
    "role": "teacher",
    "isActive": true
  }'

# Create Student
curl -X POST http://localhost:3000/api/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Student User",
    "email": "student@nejah.com",
    "password": "student123",
    "role": "student",
    "isActive": true
  }'
```

### Get All Active Teachers

```bash
curl -X GET "http://localhost:3000/api/users?role=teacher&isActive=true" \
  -H "Authorization: Bearer $TOKEN"
```

### Get All Inactive Users

```bash
curl -X GET "http://localhost:3000/api/users?isActive=false" \
  -H "Authorization: Bearer $TOKEN"
```

## Troubleshooting

### 401 Unauthorized
**Problem:** Token expired or invalid
**Solution:** Login again to get a new token

### 403 Forbidden
**Problem:** Insufficient permissions
**Solution:** Check your role (only SUPER_ADMIN and ADMIN can manage users)

### 409 Conflict
**Problem:** Email already exists
**Solution:** Use a different email

### 404 Not Found
**Problem:** User doesn't exist
**Solution:** Check the user ID

## Role Permissions Quick Reference

| Action | SUPER_ADMIN | ADMIN | TEACHER | STUDENT | PARENT |
|--------|-------------|-------|---------|---------|--------|
| Create Users | ✅ | ✅* | ❌ | ❌ | ❌ |
| View Users | ✅ | ✅ | ❌ | ❌ | ❌ |
| Edit Users | ✅ | ✅* | ❌ | ❌ | ❌ |
| Delete Users | ✅ | ✅* | ❌ | ❌ | ❌ |
| Manage SUPER_ADMIN | ✅ | ❌ | ❌ | ❌ | ❌ |
| View Own Profile | ✅ | ✅ | ✅ | ✅ | ✅ |
| Edit Own Profile | ✅ | ✅ | ✅ | ✅ | ✅ |
| Change Password | ✅ | ✅ | ✅ | ✅ | ✅ |

*ADMIN cannot manage SUPER_ADMIN users

## Next Steps

1. ✅ Login as SUPER_ADMIN
2. ✅ Create an ADMIN user
3. ✅ Create some TEACHER users
4. ✅ Test the frontend UI at `/users`
5. ✅ Change SUPER_ADMIN password
6. 🔄 Start using the system!

## Need Help?

- **Full Guide**: See `USER-MANAGEMENT-GUIDE.md`
- **Summary**: See `USER-MANAGEMENT-SUMMARY.md`
- **Backend Logs**: Check terminal running `npm run start:dev`
- **Database**: Use pgAdmin to view data

---

**You're all set! 🎉**
