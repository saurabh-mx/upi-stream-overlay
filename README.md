# UPI Stream Overlay

A full-stack streamer dashboard with RBAC, embeddable OBS widgets, and moderator-assisted workflows.

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS v4
- **Backend**: Node.js + Express 5 + TypeScript
- **Database**: PostgreSQL 16 + Drizzle ORM
- **Real-time**: Socket.IO
- **Auth**: JWT (access + refresh tokens) + bcrypt

## Quick Start

### Prerequisites

- Node.js 20+
- Docker (for PostgreSQL) or a local PostgreSQL instance

### 1. Start Database

```bash
docker-compose up -d postgres
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

```bash
cp .env.example packages/server/.env
# Edit packages/server/.env with your settings
```

### 4. Run Database Migrations

```bash
npm run db:generate --workspace=packages/server
npm run db:migrate --workspace=packages/server
```

### 5. Seed Sample Data

```bash
npm run db:seed --workspace=packages/server
```

### 6. Start Dev Servers

```bash
npm run dev
```

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3001
- **pgAdmin**: http://localhost:5050

### Default Users (password: `password123`)

| Email | Role |
|---|---|
| admin@example.com | Platform Admin |
| streamer@example.com | User (workspace owner) |
| mod@example.com | User (workspace moderator) |

## Project Structure

```
packages/
├── shared/     # Shared types, roles, Zod validators
├── server/     # Express API + Socket.IO + Drizzle ORM
└── client/     # React + Vite + Tailwind dashboard
```

## Key Features

- **Workspace-scoped RBAC**: Owner manages moderator permissions per-workspace
- **Goal Widgets**: Animated progress bars/circles, embeddable in OBS
- **Marathon Timer**: Server-authoritative countdown with donation-based bonuses
- **Leaderboard**: Aggregated donor rankings with period filtering
- **Invite System**: Unique invite codes for moderator onboarding

## License

MIT
