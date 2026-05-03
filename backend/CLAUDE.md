# WoodFlow Backend — CLAUDE.md

## Project Overview
WoodFlow backend is a Node.js + Express + TypeScript REST API for a custom furniture manufacturing ERP/MES system.

## Tech Stack
- **Runtime:** Node.js with Express (TypeScript)
- **Database:** MySQL
- **ORM:** Sequelize v6
- **Migrations:** Umzug (programmatic, production-ready)
- **Auth:** JWT with HttpOnly cookies
- **Password Hashing:** bcryptjs

## Architecture

### Directory Structure
```
src/
├── config/
│   └── database.ts       # Sequelize MySQL connection
├── migrations/           # Umzug migration files (ordered: 0001-, 0002-, etc.)
├── models/
│   ├── index.ts          # Model exports
│   ├── Role.ts           # Role model
│   ├── User.ts           # User model
│   └── Order.ts          # Order model with stage ENUM
├── middleware/
│   └── auth.ts           # JWT authenticate + checkRole RBAC
├── routes/
│   ├── auth.ts           # /api/auth (login, logout, me)
│   ├── orders.ts         # /api/orders (CRUD + stage advancement)
│   ├── inventory.ts      # /api/inventory
│   ├── fleet.ts          # /api/fleet
│   └── documents.ts      # /api/documents (AI placeholder)
├── umzug.ts              # Migration runner configuration
├── migrate.ts            # CLI entry for running migrations
├── seed.ts               # Database seeder (roles + users)
└── server.ts             # Express app entry point
```

## Database

### Migration Rules
- **NEVER** use `sequelize.sync()`, `alter: true`, or `force: true`
- All schema changes go through Umzug migration files in `src/migrations/`
- Migration files are named: `NNNN-description.ts` (e.g., `0001-create-roles-and-users.ts`)
- Migrations run automatically before dev server via `npm run dev`

### Models
| Model | Table | Key Fields |
|-------|-------|------------|
| Role | `roles` | id, role_name, permissions (JSON) |
| User | `users` | id, name, email, password_hash, role_id (FK) |
| Order | `orders` | id, client_name, client_email, client_phone, address, status (ENUM), assigned_to (FK), total_amount, notes |

### Order Lifecycle (Strict State Machine)
```
ESTIMATE → MEASUREMENT → DESIGN_APPROVAL → CUTTING → CNC → FINISHING → PACKING → INSTALLATION → COMPLETED
```
Orders can only advance forward one stage at a time via `PATCH /api/orders/:id/stage`.

## Authentication & Authorization

### Auth Flow
1. `POST /api/auth/login` — validates credentials, sets HttpOnly cookie `token`
2. Cookie is sent with every subsequent request (`credentials: 'include'`)
3. `authenticate` middleware extracts JWT from cookie
4. `checkRole(['Admin', 'Sales'])` middleware restricts by role

### Roles (seeded)
- **Admin** — full access (`*`)
- **Sales** — orders, clients
- **Designer** — orders (read), designs
- **Cutter** — tasks (factory floor)
- **Painter** — tasks (factory floor)
- **Installer** — schedule, fleet

### Seed Users (all password: `password123`)
- admin@woodflow.com, sarah@woodflow.com, derek@woodflow.com
- carl@woodflow.com, paula@woodflow.com, ian@woodflow.com

## API Endpoints

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| POST | /api/auth/login | Public | Login |
| POST | /api/auth/logout | Public | Logout |
| GET | /api/auth/me | Authenticated | Current user |
| GET | /api/orders | Authenticated | List orders (role-filtered) |
| POST | /api/orders | Admin, Sales | Create order |
| GET | /api/orders/:id | Authenticated | Order detail |
| PATCH | /api/orders/:id/stage | Admin, Cutter, Painter, Installer | Advance stage |
| GET | /api/orders/public/:id | Public | Client tracking |
| GET | /api/inventory | Authenticated | List inventory |
| PATCH | /api/inventory/:id/consume | Admin, Cutter | Deduct stock |
| GET | /api/fleet | Authenticated | List vehicles |
| POST | /api/fleet/checkout | Admin, Installer | Check out vehicle |
| POST | /api/documents/generate-offer | Admin, Sales | Generate PDF (placeholder) |

## Scripts
```bash
npm run dev      # Run migrations + start dev server (ts-node-dev)
npm run migrate  # Run pending migrations only
npm run seed     # Seed roles and demo users
npm run build    # Compile TypeScript
npm run start    # Start production build
```

## Environment Variables (`.env`)
```
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=woodflow
DB_USER=root
DB_PASSWORD=password
JWT_SECRET=woodflow-super-secret-key-change-in-production
JWT_EXPIRES_IN=7d
PORT=4000
FRONTEND_URL=http://localhost:7890
```

## Adding New Features

### New Migration
1. Create `src/migrations/NNNN-description.ts`
2. Export `up` and `down` functions receiving `{ context: QueryInterface }`
3. Run `npm run migrate`

### New API Route
1. Create `src/routes/my-route.ts`
2. Apply `authenticate` and `checkRole()` middleware
3. Mount in `src/server.ts`: `app.use('/api/my-route', myRoute)`

### New Model
1. Create `src/models/MyModel.ts`
2. Export from `src/models/index.ts`
3. Create corresponding migration file
