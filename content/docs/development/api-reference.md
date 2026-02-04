---
title: API Reference
description: Bistro API endpoints reference
navigation:
  title: API Reference
  order: 3
---

# API Reference

Bistro provides REST API endpoints for all features.

## Authentication

### Better Auth Routes

All auth routes are handled by Better Auth at `/api/auth/*`:

| Method | Endpoint                    | Description            |
| ------ | --------------------------- | ---------------------- |
| POST   | `/api/auth/sign-in/email`   | Email/password login   |
| POST   | `/api/auth/sign-up/email`   | Email registration     |
| POST   | `/api/auth/sign-out`        | Sign out               |
| GET    | `/api/auth/session`         | Get current session    |
| POST   | `/api/auth/forgot-password` | Request password reset |
| POST   | `/api/auth/reset-password`  | Reset password         |

### OAuth

| Method | Endpoint                                   | Description  |
| ------ | ------------------------------------------ | ------------ |
| GET    | `/api/auth/sign-in/social?provider=github` | GitHub OAuth |
| GET    | `/api/auth/sign-in/social?provider=google` | Google OAuth |

## Todos

| Method | Endpoint                | Description       |
| ------ | ----------------------- | ----------------- |
| GET    | `/api/todos`            | List user's todos |
| POST   | `/api/todos`            | Create todo       |
| GET    | `/api/todos/:id`        | Get todo by ID    |
| PUT    | `/api/todos/:id`        | Update todo       |
| DELETE | `/api/todos/:id`        | Delete todo       |
| POST   | `/api/todos/:id/toggle` | Toggle completion |

### Query Parameters

`GET /api/todos` supports:

- `filter` - `all`, `active`, `completed`
- `sort` - `newest`, `oldest`, `alphabetical`

### Request Body

```json
{
  "title": "Task title",
  "description": "Optional description"
}
```

## Organizations

| Method | Endpoint                   | Description               |
| ------ | -------------------------- | ------------------------- |
| GET    | `/api/organizations`       | List user's organizations |
| POST   | `/api/organizations`       | Create organization       |
| GET    | `/api/organizations/:slug` | Get organization          |
| PUT    | `/api/organizations/:slug` | Update organization       |
| DELETE | `/api/organizations/:slug` | Delete organization       |

### Members

| Method | Endpoint                               | Description        |
| ------ | -------------------------------------- | ------------------ |
| GET    | `/api/organizations/:slug/members`     | List members       |
| POST   | `/api/organizations/:slug/members`     | Invite member      |
| PUT    | `/api/organizations/:slug/members/:id` | Update member role |
| DELETE | `/api/organizations/:slug/members/:id` | Remove member      |

### Invites

| Method | Endpoint                                  | Description        |
| ------ | ----------------------------------------- | ------------------ |
| GET    | `/api/organizations/invite/:token`        | Get invite details |
| POST   | `/api/organizations/invite/:token/accept` | Accept invite      |

## User

| Method | Endpoint                         | Description         |
| ------ | -------------------------------- | ------------------- |
| GET    | `/api/user/profile`              | Get profile         |
| PUT    | `/api/user/profile`              | Update profile      |
| PUT    | `/api/user/current-organization` | Switch organization |
| DELETE | `/api/user/delete-account`       | Delete account      |

## Admin

Requires `ADMIN` or `SUPER_ADMIN` role.

| Method | Endpoint                      | Description         |
| ------ | ----------------------------- | ------------------- |
| GET    | `/api/admin/users`            | List all users      |
| PUT    | `/api/admin/users/:id/role`   | Update user role    |
| POST   | `/api/admin/impersonate`      | Start impersonation |
| POST   | `/api/admin/impersonate/stop` | Stop impersonation  |

## Error Responses

All errors follow this format:

```json
{
  "statusCode": 400,
  "message": "Error description"
}
```

Common status codes:

- `400` - Bad request (validation error)
- `401` - Unauthorized (not logged in)
- `403` - Forbidden (insufficient permissions)
- `404` - Not found
- `500` - Server error
