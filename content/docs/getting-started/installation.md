---
title: Installation
description: Install and set up Bistro on your local machine
navigation:
  title: Installation
  order: 1
---

# Installation

Get Bistro running on your local machine in minutes.

## Prerequisites

Before you begin, ensure you have:

- **Node.js** 20.0.0 or higher
- **Bun** 1.0.0 or higher
- **PostgreSQL** 14 or higher (or Docker)
- **Git**

## Clone the Repository

```bash
git clone https://github.com/AloisH/bistro.git
cd bistro
```

## Install Dependencies

Bistro uses Bun as the package manager:

```bash
bun install
```

This will install all dependencies for the monorepo.

## Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Update `.env` with your configuration:

```bash
# Database
DATABASE_URL=postgresql://bistro:bistro@localhost:5432/bistro

# Authentication
AUTH_SECRET=your-secret-key-change-in-production

# Optional: OAuth providers
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

## Start PostgreSQL

Using Docker Compose (recommended):

```bash
docker compose up -d
```

This starts PostgreSQL and Redis in the background.

## Run Database Migrations

Apply the database schema:

```bash
bun db:migrate
```

## Start Development Server

```bash
bun dev
```

Your app will be available at [http://localhost:3000](http://localhost:3000)

## Verify Installation

1. Visit http://localhost:3000
2. Navigate to /auth/register to create an account
3. Log in to access the dashboard

## Next Steps

- [Configuration](/docs/getting-started/configuration) - Configure your application
- [Authentication](/docs/features/authentication) - Learn about auth features
- [Database](/docs/features/database) - Work with Prisma and PostgreSQL
