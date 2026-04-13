# POS Backend API

A point-of-sale backend application built with Bun and Hono, designed to manage users, products, suppliers, and password reset workflows. The API uses SQLite for persistence and includes authentication, logging, and email-based password reset support.

## Features

- User signup and login
- Product CRUD operations
- Supplier lookup and management
- Password reset request + token-based password update
- SQLite database schema loaded from `pos_tables.sql`
- Email integration using AWS SES / MailSlurp support
- Structured JSON API responses with timestamp metadata

## Tech Stack

- Bun
- Hono
- TypeScript
- SQLite (`bun:sqlite`)
- Pino logging
- Zod validation
- AWS SES and MailSlurp for email flows

## Requirements

- Bun installed: https://bun.sh/

## Getting Started

1. Install dependencies

```sh
bun install
```

2. Run the app in development mode

```sh
bun run dev
```

3. Start the production server

```sh
bun run start
```

4. Seed the database (if needed)

```sh
bun run seed
```

The application listens on port `5000` by default.

## Database

This project uses SQLite and loads the schema from `pos_tables.sql`.

The current `src/db_service.ts` bootstraps `concrete.db` and runs the SQL schema when the database is initialized.

## API Endpoints

### User Endpoints

- `POST /users/signup` — create a new user
- `POST /users/login` — authenticate a user and return a JWT-like bearer token
- `GET /users/all` — list all users
- `GET /users/active` — list active users
- `GET /users/:id` — fetch user details by ID
- `GET /users?email=...` — find user by email
- `GET /users?username=...` — find user by username
- `GET /users?role=...` — find user by role

### Product Endpoints

- `POST /products/create` — add a new product
- `GET /products/all` — list all products
- `GET /products/active` — list active products
- `GET /products/:id` — fetch product details by ID
- `PATCH /products/update/:id` — update product details
- `DELETE /products/delete/:id` — delete a product
- `GET /products?code=...` — find product by code
- `GET /products?barcode=...` — find products by barcode
- `GET /products?category=...` — filter products by category
- `GET /products?supplier=...` — filter products by supplier

### Supplier Endpoints

- `GET /suppliers/all` — list all suppliers
- `GET /suppliers/active` — list active suppliers
- `GET /suppliers?tin=...` — search suppliers by TIN
- `GET /suppliers?phone=...` — search suppliers by phone
- `GET /suppliers?company=...` — search suppliers by company name
- `PATCH /suppliers/update` — update a supplier
- `DELETE /suppliers/delete/:id` — delete a supplier

### Password Reset Endpoints

- `POST /reset-password` — request password reset by email
- `POST /reset-password/:token` — update password for a valid reset token

## Notes

- CORS is enabled for the `/api/*` path.
- Authentication middleware is configured for `/auth/*` routes, while core API routes are mounted at the app root.
- The app uses Bun's built-in SQLite driver and Bun password hashing.
- Logging uses `pino` via `src/logger.ts`.

## Project Structure

- `src/index.ts` — application entrypoint
- `src/routes/` — HTTP route handlers
- `src/db_service.ts` — database service initialization
- `src/db/` — database models, repositories, and schemas
- `src/services/` — business logic services
- `src/auth/` — signup, login, email, and reset utilities
- `src/middleware/` — request middleware
- `src/scripts/seed.ts` — database seeding script

## License

This repository does not specify a license. Add one if you plan to share or publish this project.

