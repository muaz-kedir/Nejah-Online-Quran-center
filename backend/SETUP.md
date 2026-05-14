# Backend Setup Guide

## Prerequisites

1. **Node.js** 18 or higher
2. **PostgreSQL** 14 or higher
3. **npm** or **yarn**

## Step-by-Step Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Setup PostgreSQL Database

Create a new PostgreSQL database:

```sql
CREATE DATABASE nejah_db;
```

Or using psql command:
```bash
psql -U postgres
CREATE DATABASE nejah_db;
\q
```

### 3. Configure Environment Variables

Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Application
NODE_ENV=development
PORT=3000
API_PREFIX=api

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_postgres_password
DB_DATABASE=nejah_db

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRATION=7d

# CORS
CORS_ORIGIN=http://localhost:8080
```

### 4. Start the Development Server

```bash
npm run start:dev
```

The API will be running at: `http://localhost:3000/api`

### 5. Test the API

#### Register a new user:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@nejah.com",
    "password": "admin123",
    "name": "Admin User",
    "role": "admin"
  }'
```

#### Login:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@nejah.com",
    "password": "admin123"
  }'
```

## Database Schema

The application will automatically create the following tables:

- `users` - User accounts
- `students` - Student profiles
- `teachers` - Teacher profiles

TypeORM is configured with `synchronize: true` in development, which automatically creates/updates tables based on your entities.

## Project Structure

```
backend/
├── src/
│   ├── auth/              # Authentication (JWT, Login, Register)
│   │   ├── dto/          # Data Transfer Objects
│   │   ├── guards/       # Auth Guards
│   │   ├── strategies/   # Passport Strategies
│   │   └── auth.module.ts
│   │
│   ├── users/            # User Management
│   │   ├── dto/
│   │   ├── entities/
│   │   └── users.module.ts
│   │
│   ├── students/         # Student Management
│   ├── teachers/         # Teacher Management
│   ├── parents/          # Parent Management (scaffold)
│   ├── attendance/       # Attendance Tracking (scaffold)
│   ├── schedules/        # Class Scheduling (scaffold)
│   ├── homework/         # Homework Management (scaffold)
│   ├── progress/         # Progress Tracking (scaffold)
│   ├── exams/            # Exam Management (scaffold)
│   ├── notifications/    # Notifications (scaffold)
│   ├── chat/             # Chat System (scaffold)
│   │
│   ├── common/           # Shared Code
│   │   ├── decorators/  # Custom Decorators
│   │   ├── guards/      # Custom Guards
│   │   └── enums/       # Enums
│   │
│   ├── app.module.ts    # Root Module
│   └── main.ts          # Entry Point
│
├── .env                 # Environment Variables
├── .env.example         # Environment Template
├── nest-cli.json        # Nest CLI Config
├── package.json
├── tsconfig.json
└── README.md
```

## Available Scripts

```bash
# Development
npm run start:dev        # Start with hot-reload

# Production
npm run build            # Build the project
npm run start:prod       # Start production server

# Code Quality
npm run lint             # Run ESLint
npm run format           # Format code with Prettier

# Testing
npm run test             # Run unit tests
npm run test:watch       # Run tests in watch mode
npm run test:cov         # Run tests with coverage
npm run test:e2e         # Run end-to-end tests
```

## API Endpoints

See [API.md](./API.md) for complete API documentation.

### Quick Reference:

**Auth:**
- `POST /api/auth/register` - Register
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Get profile (protected)

**Users:**
- `GET /api/users` - List users (admin)
- `GET /api/users/:id` - Get user
- `POST /api/users` - Create user (admin)
- `PATCH /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (admin)

**Students:**
- `GET /api/students` - List students
- `GET /api/students/:id` - Get student
- `POST /api/students` - Create student
- `PATCH /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

**Teachers:**
- `GET /api/teachers` - List teachers
- `GET /api/teachers/:id` - Get teacher

## Troubleshooting

### Database Connection Error

If you see `ECONNREFUSED` error:
1. Make sure PostgreSQL is running
2. Check your database credentials in `.env`
3. Verify the database exists

### Port Already in Use

If port 3000 is already in use, change the `PORT` in `.env`:
```env
PORT=3001
```

### Module Not Found

If you see module errors after pulling changes:
```bash
rm -rf node_modules package-lock.json
npm install
```

## Next Steps

1. **Implement remaining modules** - Attendance, Schedules, Homework, etc.
2. **Add database migrations** - For production deployments
3. **Setup testing** - Write unit and e2e tests
4. **Add API documentation** - Swagger/OpenAPI
5. **Implement WebSockets** - For real-time chat
6. **Add file uploads** - For homework submissions
7. **Setup email service** - For notifications

## Production Deployment

Before deploying to production:

1. Set `NODE_ENV=production` in `.env`
2. Change `JWT_SECRET` to a strong random string
3. Disable `synchronize` in TypeORM config
4. Setup database migrations
5. Configure proper CORS origins
6. Setup SSL/TLS
7. Use environment-specific configs
8. Setup logging and monitoring

## Support

For issues or questions:
- Check the [README.md](./README.md)
- Review [API.md](./API.md)
- Contact the development team
