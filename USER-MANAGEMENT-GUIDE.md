# User Management Module - Complete Guide

## Overview

Complete User Management system for Nejah Online Quran & Islamic Center with SUPER_ADMIN hierarchy and role-based access control.

## System Roles

### Role Hierarchy

1. **SUPER_ADMIN** - Full system control
2. **ADMIN** - Limited management access
3. **TEACHER** - Teaching staff
4. **STUDENT** - Students
5. **PARENT** - Parents/Guardians

## Role Permissions

### SUPER_ADMIN Can:
- ✅ Create/Edit/Delete all users (including admins)
- ✅ Manage all system settings
- ✅ Access all dashboards
- ✅ View all analytics and reports
- ✅ Activate/Deactivate any user
- ✅ Change any user's role
- ✅ Full system access

### ADMIN Can:
- ✅ Create/Edit/Delete teachers
- ✅ Create/Edit/Delete students
- ✅ Create/Edit/Delete parents
- ❌ Cannot manage SUPER_ADMIN
- ❌ Cannot delete SUPER_ADMIN
- ❌ Cannot change SUPER_ADMIN role
- ❌ Cannot create SUPER_ADMIN

### TEACHER/STUDENT/PARENT Can:
- ✅ View their own profile
- ✅ Update their own profile
- ✅ Change their own password
- ❌ Cannot access user management

## Backend API Endpoints

### User CRUD

```
POST   /api/users              - Create user (SUPER_ADMIN, ADMIN)
GET    /api/users              - List users with filters (SUPER_ADMIN, ADMIN)
GET    /api/users/:id          - Get user by ID (SUPER_ADMIN, ADMIN)
PATCH  /api/users/:id          - Update user (SUPER_ADMIN, ADMIN)
DELETE /api/users/:id          - Delete user (SUPER_ADMIN, ADMIN)
PATCH  /api/users/:id/toggle-status - Toggle user status (SUPER_ADMIN, ADMIN)
```

### Profile Management

```
GET    /api/users/profile      - Get current user profile (All authenticated)
PATCH  /api/users/profile      - Update own profile (All authenticated)
POST   /api/users/change-password - Change own password (All authenticated)
```

### Query Parameters for GET /api/users

```
?search=john          - Search by name or email
?role=teacher         - Filter by role
?isActive=true        - Filter by status
?page=1               - Page number
?limit=10             - Items per page
```

## Setup Instructions

### 1. Create Super Admin

Run this command to create the initial SUPER_ADMIN:

```bash
cd backend
npm run seed:superadmin
```

**Default Credentials:**
- Email: `superadmin@nejah.com`
- Password: `SuperAdmin123!`

⚠️ **IMPORTANT:** Change the password immediately after first login!

### 2. Start Backend

```bash
cd backend
npm run start:dev
```

Backend runs on: `http://localhost:3000`

### 3. Start Frontend

```bash
cd frontend
npm run dev
```

Frontend runs on: `http://localhost:8080`

### 4. Access User Management

1. Login with SUPER_ADMIN credentials
2. Navigate to `/users` route
3. Start managing users!

## Frontend Features

### User Management Page (`/users`)

**Features:**
- ✅ User table with pagination
- ✅ Search by name/email
- ✅ Filter by role
- ✅ Filter by status
- ✅ Add new user
- ✅ Edit user
- ✅ Delete user
- ✅ Toggle user status (Active/Inactive)
- ✅ Role badges with colors
- ✅ Responsive design

### Add User Modal

**Fields:**
- Full Name (required)
- Email (required)
- Password (required, min 6 characters)
- Role (dropdown)
- Status (Active/Inactive checkbox)

### Edit User Modal

**Features:**
- Update user information
- Change role
- Toggle active status
- Email uniqueness validation

### Delete User Modal

**Features:**
- Confirmation dialog
- Shows user name and email
- Cannot delete SUPER_ADMIN (unless you are SUPER_ADMIN)
- Cannot delete yourself

## Security Features

### Role-Based Access Control

```typescript
// Backend Guards
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
```

### Protection Rules

1. **SUPER_ADMIN Protection:**
   - Only SUPER_ADMIN can modify SUPER_ADMIN users
   - ADMIN cannot delete SUPER_ADMIN
   - ADMIN cannot change roles to SUPER_ADMIN

2. **Self-Protection:**
   - Users cannot delete themselves
   - Users cannot change their own role via profile update

3. **Password Security:**
   - Passwords hashed with bcrypt
   - Minimum 6 characters
   - Password confirmation required

## Database Schema

### User Entity

```typescript
{
  id: string (UUID)
  email: string (unique)
  password: string (hashed)
  name: string
  role: UserRole (enum)
  phone: string (optional)
  avatar: string (optional)
  isActive: boolean (default: true)
  createdAt: Date
  updatedAt: Date
}
```

## API Examples

### Create User

```bash
POST http://localhost:3000/api/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "teacher",
  "isActive": true
}
```

### Search Users

```bash
GET http://localhost:3000/api/users?search=john&role=teacher&page=1&limit=10
Authorization: Bearer <token>
```

### Update User

```bash
PATCH http://localhost:3000/api/users/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Updated",
  "role": "admin",
  "isActive": false
}
```

### Delete User

```bash
DELETE http://localhost:3000/api/users/:id
Authorization: Bearer <token>
```

### Change Password

```bash
POST http://localhost:3000/api/users/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "oldpass123",
  "newPassword": "newpass123",
  "confirmPassword": "newpass123"
}
```

## Error Handling

### Common Errors

- `409 Conflict` - Email already exists
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - User not found
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Not authenticated

## Testing

### Test Super Admin Creation

```bash
cd backend
npm run seed:superadmin
```

### Test API Endpoints

1. Login as SUPER_ADMIN
2. Get token from response
3. Use token in Authorization header
4. Test all endpoints

## Production Checklist

- [ ] Change SUPER_ADMIN password
- [ ] Set strong JWT_SECRET in .env
- [ ] Enable HTTPS
- [ ] Set up proper CORS
- [ ] Add rate limiting
- [ ] Enable audit logging
- [ ] Set up backup strategy
- [ ] Configure email notifications
- [ ] Add two-factor authentication (optional)

## Troubleshooting

### Cannot create SUPER_ADMIN

**Solution:** Run the seed script:
```bash
npm run seed:superadmin
```

### Permission Denied Errors

**Check:**
1. User role in JWT token
2. Route guards are properly applied
3. User is authenticated

### Email Already Exists

**Solution:** Use a different email or delete the existing user first

## Next Steps

1. ✅ User Management Complete
2. 🔄 Add email notifications
3. 🔄 Add user activity logs
4. 🔄 Add bulk user import
5. 🔄 Add user export (CSV/Excel)
6. 🔄 Add advanced analytics

## Support

For issues or questions, contact the development team.

---

**Built with ❤️ for Nejah Online Quran & Islamic Center**
