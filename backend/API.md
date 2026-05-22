# Nejah API Documentation

Base URL: `http://localhost:3000/api`

## Authentication

All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## Auth Endpoints

### Register User
```http
POST /auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "role": "student",
  "phone": "+1234567890"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "student"
  }
}
```

### Login
```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "student"
  }
}
```

### Get Profile
```http
GET /auth/profile
```
**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "student"
}
```

---

## Users Endpoints

### Get All Users (Admin Only)
```http
GET /users
```
**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
[
  {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "student",
    "phone": "+1234567890",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### Get User by ID
```http
GET /users/:id
```
**Headers:** `Authorization: Bearer <token>`

### Create User (Admin Only)
```http
POST /users
```
**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "name": "Jane Doe",
  "role": "teacher",
  "phone": "+1234567890"
}
```

### Update User
```http
PATCH /users/:id
```
**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Updated Name",
  "phone": "+0987654321",
  "isActive": true
}
```

### Delete User (Admin Only)
```http
DELETE /users/:id
```
**Headers:** `Authorization: Bearer <token>`

---

## Students Endpoints

### Get All Students
```http
GET /students
```
**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
[
  {
    "id": "uuid",
    "userId": "uuid",
    "user": {
      "id": "uuid",
      "name": "Student Name",
      "email": "student@example.com"
    },
    "level": "beginner",
    "enrollmentDate": "2024-01-01T00:00:00.000Z",
    "isActive": true
  }
]
```

### Get Student by ID
```http
GET /students/:id
```
**Headers:** `Authorization: Bearer <token>`

### Create Student
```http
POST /students
```
**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "userId": "uuid",
  "parentId": "uuid",
  "dateOfBirth": "2010-01-01",
  "address": "123 Main St",
  "emergencyContact": "+1234567890",
  "level": "beginner",
  "enrollmentDate": "2024-01-01"
}
```

### Delegate Student to Teacher
```http
POST /students/delegate
```
**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "studentId": "uuid",
  "teacherId": "uuid",
  "startTime": "2024-01-15T10:00:00Z",
  "endTime": "2024-01-15T11:00:00Z",
  "className": "Quran Class",
  "meetingLink": "https://zoom.us/j/..."
}
```

**Response:**
```json
{
  "message": "Student successfully delegated to teacher",
  "student": {
    "id": "uuid",
    "fullName": "Student Name",
    "teacherId": "uuid"
  },
  "schedule": {
    "id": "uuid",
    "studentId": "uuid",
    "teacherId": "uuid",
    "startTime": "2024-01-15T10:00:00Z",
    "endTime": "2024-01-15T11:00:00Z",
    "className": "Quran Class",
    "meetingLink": "https://zoom.us/j/..."
  }
}
```

### Update Student
```http
PATCH /students/:id
```
**Headers:** `Authorization: Bearer <token>`

### Delete Student
```http
DELETE /students/:id
```
**Headers:** `Authorization: Bearer <token>`

---

## Schedules Endpoints

### Get All Schedules
```http
GET /schedules
```
**Query Parameters:**
- `studentId` (optional): Filter by student
- `teacherId` (optional): Filter by teacher

**Headers:** `Authorization: Bearer <token>`

### Get Student Schedules
```http
GET /schedules/student/:studentId
```
**Headers:** `Authorization: Bearer <token>`

### Get Teacher Schedules
```http
GET /schedules/teacher/:teacherId
```
**Headers:** `Authorization: Bearer <token>`

### Get Schedule by ID
```http
GET /schedules/:id
```
**Headers:** `Authorization: Bearer <token>`

---

## Teachers Endpoints

### Get All Teachers
```http
GET /teachers
```
**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
[
  {
    "id": "uuid",
    "userId": "uuid",
    "user": {
      "id": "uuid",
      "name": "Teacher Name",
      "email": "teacher@example.com"
    },
    "specialty": "Tajweed & Hifz",
    "yearsOfExperience": 10,
    "rating": 4.8,
    "isActive": true
  }
]
```

### Get Teacher by ID
```http
GET /teachers/:id
```
**Headers:** `Authorization: Bearer <token>`

---

## Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": ["email must be an email", "password must be longer than 6 characters"],
  "error": "Bad Request"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "User not found",
  "error": "Not Found"
}
```

### 409 Conflict
```json
{
  "statusCode": 409,
  "message": "Email already exists",
  "error": "Conflict"
}
```

---

## User Roles

- `admin` - Full system access
- `teacher` - Teacher-specific features
- `student` - Student-specific features
- `parent` - Parent-specific features

---

## Testing with cURL

### Register
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User",
    "role": "student"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Get Profile
```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```
