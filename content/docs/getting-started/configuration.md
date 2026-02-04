---
title: Configuration
description: Configure Bistro for your needs
navigation:
  title: Configuration
  order: 2
---

# Configuration

Learn how to configure Bistro for your specific needs.

## Environment Variables

Bistro uses environment variables for configuration. All variables are defined in your `.env` file.

### Required Variables

```bash
# Database connection string
DATABASE_URL=postgresql://user:password@host:port/database

# Secret key for authentication (generate with: openssl rand -base64 32)
AUTH_SECRET=your-secret-key-min-32-characters
```

### Optional Variables

#### OAuth Providers

```bash
# GitHub OAuth
GITHUB_CLIENT_ID=your-client-id
GITHUB_CLIENT_SECRET=your-client-secret

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

#### Email (Resend)

```bash
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

#### Application

```bash
# Base URL for your application
APP_URL=http://localhost:3000
```

## Nuxt Configuration

The main configuration file is `apps/web/nuxt.config.ts`.

### Modules

Bistro uses the following Nuxt modules:

- `@nuxt/eslint` - ESLint integration
- `@nuxt/content` - Content management
- `@nuxt/ui` - Nuxt UI components

**Important:** The module order matters! `@nuxt/content` must come before `@nuxt/ui` for proper Tailwind CSS processing.

### Public Routes

Routes that don't require authentication are defined in `runtimeConfig.public.publicRoutes`:

```typescript
publicRoutes: [
  '/',
  '/auth/login',
  '/auth/register',
  '/blog',
  '/blog/*',
  '/docs',
  '/docs/*',
  '/legal/privacy',
  '/legal/terms',
];
```

Add your own public routes to this array.

## Database Configuration

Prisma configuration is in `apps/web/prisma/schema.prisma`.

### Change Database Provider

By default, Bistro uses PostgreSQL. To use a different database:

1. Update `datasource db` in `schema.prisma`
2. Update `DATABASE_URL` in `.env`
3. Run `bun db:migrate` to apply schema

## Content Configuration

Content collections are defined in `apps/web/content.config.ts`.

You can customize schemas for blog posts, documentation, and legal pages.

## Next Steps

- [Authentication](/docs/features/authentication) - Set up OAuth providers
- [Database](/docs/features/database) - Work with Prisma
