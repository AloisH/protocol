---
title: Contributing
description: How to contribute to Bistro
navigation:
  title: Contributing
  order: 2
---

# Contributing

We welcome contributions to Bistro! This guide will help you get started.

## Getting Started

1. Fork the repository on GitHub
2. Clone your fork locally
3. Set up the development environment (see [Installation](/docs/getting-started/installation))

## Development Workflow

### Branch Naming

Use descriptive branch names:

- `feat/add-user-profile` - New features
- `fix/auth-redirect-loop` - Bug fixes
- `docs/update-installation` - Documentation
- `refactor/simplify-auth` - Code improvements

### Making Changes

1. Create a new branch from `main`
2. Make your changes
3. Write or update tests
4. Run the test suite

```bash
bun test:run
```

5. Run linting and type checks

```bash
bun lint
bun typecheck
```

### Commit Messages

Follow conventional commits:

```
type(scope): description

feat(auth): add magic link authentication
fix(api): handle null user in session
docs(readme): update installation steps
```

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`

## Code Standards

### TypeScript

- Enable strict mode
- Use explicit types for function parameters
- Prefer `interface` over `type` for objects

### Vue Components

- Use `<script setup>` syntax
- Keep components focused and small
- Use composables for shared logic

### Testing

- Place tests next to source files: `Component.test.ts`
- Test behavior, not implementation
- Mock external dependencies

## Pull Requests

### Before Submitting

- [ ] Tests pass (`bun test:run`)
- [ ] Linting passes (`bun lint`)
- [ ] Types check (`bun typecheck`)
- [ ] Build succeeds (`bun build`)

### PR Description

Include:

- What the PR does
- Why the change is needed
- How to test it
- Screenshots (for UI changes)

## Project Structure

```
bistro/
├── apps/
│   └── web/              # Main Nuxt app
│       ├── app/          # Pages, components, composables
│       ├── server/       # API routes, utils
│       ├── prisma/       # Database schema
│       └── content/      # Blog & docs
├── packages/             # Shared packages (future)
└── docker-compose.yml    # Dev services
```

## Need Help?

- Open an issue for bugs or feature requests
- Start a discussion for questions
- Join our community chat (coming soon)
