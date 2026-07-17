# Dishes Booking Manager API

Backend API for managing dishes, carts, reservations, and pickups.

This project exposes REST APIs only. It does not include a public frontend.

## Tech Stack

- Nest.js
- TypeScript
- pnpm
- Prisma ORM 7
- PostgreSQL
- JWT
- HTTP-only cookies
- Swagger / OpenAPI
- class-validator
- bcrypt

## Main Features

- Customer/admin authentication
- Email and password login
- Google login
- Apple login
- Refresh token flow
- Role-based access control
- Admin dish management
- Customer dish listing
- Customer cart management
- Reservation creation from cart
- Reservation status management: `PENDING`, `CONFIRMED`, `REJECTED`
- Pickup management linked to reservations
- Swagger API documentation

## Roles

The application supports two user roles:

```text
CUSTOMER
ADMIN
```

A customer can:

- register;
- log in and log out;
- view active dishes;
- manage their own cart;
- create reservations;
- view their own reservations.

An admin can:

- manage dishes;
- view all reservations;
- confirm or reject reservations;
- manage reservation pickups.

## Requirements

- Node.js
- pnpm
- PostgreSQL

## Installation

```bash
pnpm install
```

## Environment Configuration

Create a `.env` file in the project root.

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/dishes_booking_manager_api?schema=public"

JWT_ACCESS_SECRET="change-me-access-secret"
JWT_REFRESH_SECRET="change-me-refresh-secret"

JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

GOOGLE_CLIENT_ID=""
APPLE_CLIENT_ID=""

NODE_ENV="development"
PORT="3000"
```

## Database

The project uses Prisma ORM 7 with PostgreSQL.

In Prisma 7, the database connection string is not defined inside `schema.prisma`. It is configured in `prisma.config.ts`.

Example `prisma.config.ts`:

```ts
import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
```

The datasource in `schema.prisma` should only define the provider:

```prisma
datasource db {
  provider = "postgresql"
}
```

## Prisma Commands

Validate the schema:

```bash
pnpm prisma validate
```

Create a migration:

```bash
pnpm prisma migrate dev --name init
```

Generate Prisma Client:

```bash
pnpm prisma generate
```

Open Prisma Studio:

```bash
pnpm prisma studio
```

## Development

Start the development server:

```bash
pnpm run start:dev
```

The API will be available at:

```text
http://localhost:3000
```

Swagger documentation will be available at:

```text
http://localhost:3000/docs
```

## Authentication

Authentication uses:

- short-lived access tokens;
- longer-lived refresh tokens;
- HTTP-only cookies;
- hashed refresh tokens stored in the database.

Expected cookies:

```text
access_token
refresh_token
```

The backend supports three login methods:

```text
email/password
Google login
Apple login
```

For Google and Apple login, the client should obtain an identity token using the native SDK and send it to the backend. The backend verifies the identity token, creates or retrieves the user, and issues its own session tokens.

## Planned API

### Auth

```text
POST /auth/register
POST /auth/login
POST /auth/google
POST /auth/apple
POST /auth/refresh
POST /auth/logout
GET  /auth/me
```

### Dishes

Customer endpoints:

```text
GET /dishes
GET /dishes/:id
```

Admin endpoints:

```text
GET    /admin/dishes
POST   /admin/dishes
PATCH  /admin/dishes/:id
DELETE /admin/dishes/:id
```

### Cart

```text
GET    /cart
POST   /cart/items
PATCH  /cart/items/:id
DELETE /cart/items/:id
DELETE /cart
```

### Reservations

Customer endpoints:

```text
GET  /reservations
GET  /reservations/:id
POST /reservations
```

Admin endpoints:

```text
GET   /admin/reservations
GET   /admin/reservations/:id
PATCH /admin/reservations/:id/status
```

### Pickups

```text
POST  /admin/reservations/:reservationId/pickup
PATCH /admin/pickups/:id
```

## Data Model

Main entities:

- `User`
- `AuthAccount`
- `Dish`
- `CartItem`
- `Reservation`
- `ReservationDish`
- `Pickup`

Main relationships:

- one user can have multiple OAuth accounts;
- one user can have multiple cart items;
- one user can have multiple reservations;
- one reservation contains multiple dishes through `ReservationDish`;
- one reservation can have one pickup.

## Business Rules

- Customers can only see active dishes.
- Admins can manage all dishes.
- Dish deletion should preferably be implemented as a soft delete by setting `active = false`.
- A reservation can only be created if the cart is not empty.
- When a reservation is created, cart items are copied into the reservation.
- The dish price is stored in the reservation at creation time.
- After reservation creation, the cart is cleared.
- The initial reservation status is always `PENDING`.
- Only admins can change reservation status to `CONFIRMED` or `REJECTED`.
- A pickup is linked to a confirmed reservation.

## Suggested Project Structure

```text
src/
├─ app.module.ts
├─ main.ts
├─ prisma/
│  ├─ prisma.module.ts
│  └─ prisma.service.ts
├─ auth/
│  ├─ auth.module.ts
│  ├─ auth.controller.ts
│  ├─ auth.service.ts
│  ├─ dto/
│  ├─ guards/
│  └─ decorators/
├─ users/
├─ dishes/
├─ cart/
├─ reservations/
└─ pickups/
```

## Security

- Never store plain-text passwords.
- Store passwords using bcrypt hashes.
- Store refresh tokens only as hashes.
- Use HTTP-only cookies.
- Use `secure: true` cookies in production.
- Protect admin routes with role guards.
- Validate all request input through DTOs.
- Never expose `passwordHash` or `refreshTokenHash` in API responses.

## Project Status

The project is in its initial development phase.

Technical roadmap:

1. Prisma 7 + PostgreSQL setup
2. PrismaModule
3. Email/password authentication
4. Google authentication
5. Apple authentication
6. Dishes module
7. Cart module
8. Reservations module
9. Pickups module
10. Complete Swagger documentation
