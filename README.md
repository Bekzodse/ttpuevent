# UniPortal — University Management System

A full-stack, responsive University Management System built with **Next.js 14 (TypeScript + Tailwind CSS)** and **Java 21 + Spring Boot 3 + Spring Security + JWT + PostgreSQL**.

---

## Key Features

### 1. Authentication & Security
- **JWT Authentication** (stateless Bearer tokens with expiration handling)
- **BCrypt Password Hashing** (strength 12)
- **Registration**: First name, last name, phone number, username, password, optional faculty/department
- **Duplicate Prevention**: Unique username (case-insensitive) and normalized phone number enforcement
- **Role-Based Access Control (RBAC)**: `ADMIN` and `USER` roles enforced via Spring Security & frontend route guards

### 2. User Dashboard (Personal Cabinet — `/dashboard`)
- View & edit personal details (first name, last name, phone number, faculty/department, bio)
- Upload, change, and delete profile pictures (`PNG`, `JPG`, `WEBP`, `GIF`, max 5 MB, server-side magic-byte validation)
- Change account password (current password verification + confirmation)
- View account metadata (account ID, username, role, registration date, last login time)
- View and manage registered campus events

### 3. Admin Panel (`/admin`)
- **Live Statistics**: Total registered users, currently active users (active within 15 minutes), active vs. deactivated accounts, users who have logged in, admin/student breakdown
- **User Directory**: Search by name/username/phone/department and filter by role, account status, and login activity
- **User Management**: View full details & per-user login history, edit user profiles/roles, activate/deactivate accounts, and delete accounts (with self-protection safeguards)
- **Login Activity Audit Log**: Chronological log of login attempts with timestamp, IP address, and success/failure status

### 4. Campus Events (`/events`)
- Browse, search, and filter university events backed by PostgreSQL
- One-click registration and cancellation for authenticated users
- Create new campus events (`/events/new`)

---

## Project Structure

```text
uems-frontend/
├── app/                     # Next.js 14 App Router pages
│   ├── page.tsx             # University Portal Home
│   ├── login/page.tsx       # Sign In
│   ├── register/page.tsx    # Student Registration
│   ├── dashboard/page.tsx   # User Personal Cabinet
│   ├── admin/page.tsx       # Admin Dashboard
│   └── events/              # Campus Events pages
├── components/              # AuthProvider, Navbar, Footer, UserAvatar, EventCard
├── lib/                     # Typed API client & TypeScript models
└── backend/                 # Java 21 + Spring Boot 3 Backend
    ├── pom.xml
    └── src/main/java/uz/university/uems/
        ├── config/          # DataInitializer (seed users & events)
        ├── controller/      # AuthController, UserController, AdminController, FileController, EventController
        ├── dto/             # Request & Response DTOs with Jakarta Validation
        ├── entity/          # User, Role, LoginActivity, UniversityEvent, EventRegistration
        ├── exception/       # GlobalExceptionHandler & custom exceptions
        ├── repository/      # Spring Data JPA repositories
        ├── security/        # JwtService, JwtAuthenticationFilter, SecurityConfig
        └── service/         # AuthService, UserService, AdminService, FileStorageService, EventService
```

---

## Running Locally

### Prerequisites
- **Java 21** & **Maven 3.9+**
- **PostgreSQL** running on `localhost:5432` with database `uems_db`
- **Node.js 18+** & **npm**

### 1. Backend (Spring Boot)
```bash
cd backend
mvn spring-boot:run
# Or build & run the packaged JAR:
mvn package
java -jar target/uems-backend-1.0.0.jar
```
Backend listens on `http://localhost:8080`.

Environment variables (optional overrides):
- `SPRING_DATASOURCE_URL` (default: `jdbc:postgresql://localhost:5432/uems_db`)
- `SPRING_DATASOURCE_USERNAME` (default: `macbookprom2pro`)
- `SPRING_DATASOURCE_PASSWORD`
- `JWT_SECRET` (Base64 256+ bit secret)
- `CORS_ALLOWED_ORIGINS` (default: `http://localhost:3000,http://127.0.0.1:3000`)

### 2. Frontend (Next.js)
```bash
npm install
npm run dev
```
Frontend listens on `http://localhost:3000` (configured via `NEXT_PUBLIC_API_URL`, defaulting to `http://localhost:8080`).

---

## Seeded Demo Accounts
- **Admin**: `admin` / `Admin123!`
- **Student**: `malika` / `Student123!`
