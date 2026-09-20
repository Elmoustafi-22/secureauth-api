# 🔐 SecureAuth API

A secure authentication and account management REST API built with **NestJS**, **Drizzle ORM**, and **PostgreSQL**.

## ✨ Features

- **JWT Authentication** — Access tokens (15 min) + refresh tokens (30 days)
- **Refresh Token Rotation** — Old tokens are revoked on each refresh, preventing replay attacks
- **Argon2 Password Hashing** — Industry-leading, memory-hard hashing for stored passwords
- **Role-Based Access Control** — `user` and `admin` roles with guard-protected endpoints
- **Financial Accounts** — Create accounts and withdraw funds with balance tracking
- **Idempotent Withdrawals** — `Idempotency-Key` header prevents duplicate transactions
- **Paginated Queries** — Search, filter, sort, and paginate user listings
- **Session Management** — Revoke single sessions or all sessions at once
- **Input Validation** — `class-validator` with whitelist and auto-transform
- **Swagger / OpenAPI Docs** — Interactive API documentation at `/api/docs`
- **Dockerized PostgreSQL** — One-command database setup with Docker Compose

## 🛠 Tech Stack

| Layer          | Technology                                                     |
| -------------- | -------------------------------------------------------------- |
| Framework      | [NestJS](https://nestjs.com/) v11                              |
| Language       | TypeScript                                                     |
| Database       | PostgreSQL 17                                                  |
| ORM            | [Drizzle ORM](https://orm.drizzle.team/)                       |
| Authentication | [Passport](http://www.passportjs.org/) + JWT                   |
| Password Hash  | [Argon2](https://github.com/ranisalt/node-argon2)              |
| Validation     | [class-validator](https://github.com/typestack/class-validator) |
| API Docs       | [@nestjs/swagger](https://docs.nestjs.com/openapi/introduction) |
| Containers     | Docker Compose                                                 |

## 📋 Prerequisites

- **Node.js** >= 18
- **npm** >= 9
- **Docker** & **Docker Compose** (for PostgreSQL)

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Elmoustafi-22/secureauth-api.git
cd secureauth-api
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the database

```bash
docker compose up -d
```

This starts a PostgreSQL 17 container on port **5433**.

### 4. Configure environment variables

Create a `.env` file in the project root (or edit the existing one):

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/secureauth
JWT_SECRET=your-secret-key-here
```

> ⚠️ Use a strong, random `JWT_SECRET` in production.

### 5. Run database migrations

```bash
npx drizzle-kit push
```

### 6. Start the server

```bash
# Development (watch mode)
npm run start:dev

# Production
npm run build
npm run start:prod
```

The API is now running at `http://localhost:3000`.

## 📖 API Documentation (Swagger)

Once the server is running, visit:

```
http://localhost:3000/api/docs
```

The Swagger UI provides an interactive explorer for every endpoint, with request/response schemas, example values, and a built-in **"Authorize"** button to test protected routes with your JWT.

## 📡 API Endpoints

### Health

| Method | Endpoint | Auth | Description    |
| ------ | -------- | ---- | -------------- |
| `GET`  | `/`      | No   | Health check   |

### Auth

| Method | Endpoint           | Auth   | Description                       |
| ------ | ------------------ | ------ | --------------------------------- |
| `POST` | `/auth/register`   | No     | Register a new user               |
| `POST` | `/auth/login`      | No     | Login and receive tokens          |
| `POST` | `/auth/refresh`    | No     | Refresh access token (rotates refresh token) |
| `POST` | `/auth/logout`     | No     | Revoke a single session           |
| `POST` | `/auth/logout-all` | Bearer | Revoke all sessions for the user  |
| `GET`  | `/auth/me`         | Bearer | Get current authenticated user    |

### Users

| Method | Endpoint     | Auth         | Description                          |
| ------ | ------------ | ------------ | ------------------------------------ |
| `GET`  | `/users/:id` | No           | Get a user by UUID                   |
| `GET`  | `/users`     | Bearer/Admin | List all users (paginated, filterable) |

### Accounts

| Method | Endpoint                | Auth   | Headers            | Description              |
| ------ | ----------------------- | ------ | ------------------ | ------------------------ |
| `POST` | `/accounts/create`      | Bearer | —                  | Create a financial account |
| `POST` | `/accounts/withdraw`    | Bearer | `Idempotency-Key`  | Withdraw funds           |
| `GET`  | `/accounts/transactions`| Bearer | —                  | List account transactions |

## 🏗 Project Structure

```
src/
├── main.ts                    # App bootstrap + Swagger setup
├── app.module.ts              # Root module
├── app.controller.ts          # Health check endpoint
├── app.service.ts
│
├── auth/                      # Authentication module
│   ├── auth.controller.ts     # Login, register, refresh, logout endpoints
│   ├── auth.service.ts        # Auth business logic
│   ├── auth.module.ts
│   ├── dto/                   # LoginDto, RegisterDto
│   ├── guards/                # JwtAuthGuard, RolesGuard
│   ├── strategies/            # Passport JWT strategy
│   ├── decorators/            # @Roles() decorator
│   ├── types/                 # AuthenticatedRequest, AuthenticatedUser
│   └── utils/                 # Refresh token parser
│
├── users/                     # Users module
│   ├── users.controller.ts    # User lookup and listing endpoints
│   ├── users.service.ts       # User CRUD + paginated queries
│   ├── users.module.ts
│   ├── dto/                   # QueryUsersDto
│   └── types/                 # CreateUserInput
│
├── accounts/                  # Accounts module
│   ├── accounts.controller.ts # Account creation, withdrawal, transactions
│   ├── accounts.service.ts    # Financial operations with row-level locking
│   ├── accounts.module.ts
│   └── dto/                   # WithdrawDto
│
├── sessions/                  # Sessions module
│   ├── sessions.service.ts    # Session CRUD, rotation, revocation
│   └── sessions.module.ts
│
├── idempotency/               # Idempotency module
│   ├── idempotency.service.ts # Duplicate request detection
│   └── idempotency.module.ts
│
├── database/                  # Database module
│   ├── schema.ts              # Drizzle schema (users, sessions, accounts, transactions, idempotency_keys)
│   ├── database.provider.ts   # pg Pool + Drizzle instance
│   ├── database.module.ts
│   └── database.types.ts
│
└── common/                    # Shared utilities
    └── decorators/
```

## ⚙️ Environment Variables

| Variable       | Description                      | Default                                            |
| -------------- | -------------------------------- | -------------------------------------------------- |
| `DATABASE_URL` | PostgreSQL connection string     | `postgresql://postgres:postgres@localhost:5433/secureauth` |
| `JWT_SECRET`   | Secret key for signing JWTs      | —                                                  |
| `PORT`         | Server port                      | `3000`                                             |

## 🧪 Running Tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📜 Scripts

| Script             | Description                      |
| ------------------ | -------------------------------- |
| `npm run start:dev`  | Start in watch mode            |
| `npm run start:prod` | Start production build         |
| `npm run build`      | Compile TypeScript             |
| `npm run lint`       | Lint and auto-fix              |
| `npm run format`     | Format code with Prettier      |
| `npm run test`       | Run unit tests                 |
| `npm run test:e2e`   | Run end-to-end tests           |
| `npm run test:cov`   | Run tests with coverage report |

## 📄 License

This project is [UNLICENSED](./LICENSE) — private use only.
