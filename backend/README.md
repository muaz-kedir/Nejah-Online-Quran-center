# Nejah Backend API

NestJS backend API for Nejah Online Quran & Islamic Center.

## Features

- ✅ **Authentication & Authorization** - JWT-based auth with role-based access control
- ✅ **User Management** - Complete CRUD operations for users
- ✅ **Student Management** - Student profiles and enrollment
- ✅ **Teacher Management** - Teacher profiles and specialties
- ✅ **Modular Architecture** - Clean, scalable module-based structure
- ✅ **Database Integration** - PostgreSQL with TypeORM
- ✅ **Validation** - Request validation with class-validator
- ✅ **Security** - Password hashing with bcrypt
- ✅ **CORS** - Configured for frontend integration

## Tech Stack

- **Framework**: NestJS 10
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Authentication**: JWT + Passport
- **Validation**: class-validator & class-transformer
- **Language**: TypeScript

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

## Installation

```bash
npm install
```

## Configuration

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Update the `.env` file with your configuration:
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=nejah_db

# JWT
JWT_SECRET=your-super-secret-key
JWT_EXPIRATION=7d

# Application
PORT=3000
CORS_ORIGIN=http://localhost:8080
```

3. Create the database:
```sql
CREATE DATABASE nejah_db;
```

## Running the App

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

The API will be available at `http://localhost:3000/api`

## Testing the API

You have multiple options to test the API:

### Option 1: HTML Test Page (Easiest!) 🌐
Open `test-api.html` in your browser - no installation needed!

```bash
# Just open the file in your browser
start test-api.html  # Windows
open test-api.html   # Mac
```

### Option 2: PowerShell Script (Windows) 💻
```bash
.\test-api.ps1
```

### Option 3: cURL Commands 🔧
```bash
# Register
curl -X POST http://localhost:3000/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test@nejah.com\",\"password\":\"test123\",\"name\":\"Test User\"}"

# Login
curl -X POST http://localhost:3000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test@nejah.com\",\"password\":\"test123\"}"
```

### Option 4: Postman (Optional) 📮
Download from https://www.postman.com/downloads/

**See [TESTING.md](./TESTING.md) for complete testing guide!**

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get current user profile (protected)

### Users
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create user (admin only)
- `PATCH /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (admin only)

### Students
- `GET /api/students` - Get all students
- `GET /api/students/:id` - Get student by ID
- `POST /api/students` - Create student
- `PATCH /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

### Teachers
- `GET /api/teachers` - Get all teachers
- `GET /api/teachers/:id` - Get teacher by ID

## Project Structure

```
backend/
├── src/
│   ├── auth/              # Authentication module
│   │   ├── dto/          # Data transfer objects
│   │   ├── guards/       # Auth guards
│   │   ├── strategies/   # Passport strategies
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.module.ts
│   │
│   ├── users/            # Users module
│   │   ├── dto/
│   │   ├── entities/
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   └── users.module.ts
│   │
│   ├── students/         # Students module
│   ├── teachers/         # Teachers module
│   ├── parents/          # Parents module
│   ├── attendance/       # Attendance module
│   ├── schedules/        # Schedules module
│   ├── homework/         # Homework module
│   ├── progress/         # Progress tracking module
│   ├── exams/            # Exams module
│   ├── notifications/    # Notifications module
│   ├── chat/             # Chat module
│   │
│   ├── common/           # Shared utilities
│   │   ├── decorators/  # Custom decorators
│   │   ├── guards/      # Custom guards
│   │   └── enums/       # Enums
│   │
│   ├── app.module.ts    # Root module
│   └── main.ts          # Application entry point
│
├── .env.example         # Environment variables template
├── nest-cli.json        # Nest CLI configuration
├── package.json
├── tsconfig.json
└── README.md
```

## User Roles

- `admin` - Full system access
- `teacher` - Teacher-specific features
- `student` - Student-specific features
- `parent` - Parent-specific features

## Development

```bash
# Run in watch mode
npm run start:dev

# Run linter
npm run lint

# Format code
npm run format

# Run tests
npm run test

# Run tests with coverage
npm run test:cov
```

## Database Migrations

TypeORM is configured with `synchronize: true` in development mode, which automatically syncs your entities with the database schema.

**⚠️ Warning**: Disable `synchronize` in production and use migrations instead.

## Security

- Passwords are hashed using bcrypt
- JWT tokens for authentication
- Role-based access control (RBAC)
- Request validation on all endpoints
- CORS configured for frontend origin

## Future Modules

The following modules are scaffolded and ready for implementation:

- **Attendance** - Track student attendance
- **Schedules** - Class scheduling system
- **Homework** - Homework assignment and submission
- **Progress** - Student progress tracking
- **Exams** - Exam management and grading
- **Notifications** - Push notifications
- **Chat** - Real-time messaging

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## License

MIT
