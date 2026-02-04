---
title: Organizations
description: Multi-tenancy with organizations and teams
navigation:
  title: Organizations
  order: 3
---

# Organizations

Bistro supports multi-tenancy through organizations, allowing users to collaborate in teams.

## Overview

Organizations provide:

- Team workspaces
- Member management
- Role-based access control
- Invite system

## Creating an Organization

Users can create organizations during onboarding or from the dashboard:

```typescript
// POST /api/organizations
{
  "name": "My Company",
  "slug": "my-company"  // Auto-generated if not provided
}
```

## Member Roles

Each organization member has a role:

| Role     | Permissions                     |
| -------- | ------------------------------- |
| `OWNER`  | Full control, can delete org    |
| `ADMIN`  | Manage members, settings        |
| `MEMBER` | Access features, create content |
| `GUEST`  | Read-only access                |

## Inviting Members

Admins and owners can invite new members:

1. Go to Organization Settings > Members
2. Click "Invite Member"
3. Enter email and select role
4. Invitation sent via email

Invites expire after 7 days.

## Switching Organizations

Users can belong to multiple organizations:

- Use the organization switcher in the sidebar
- API: `PUT /api/user/current-organization`

## Data Isolation

All data is scoped to organizations:

- Todos belong to the current organization
- API endpoints validate organization membership
- Server-side authorization on every request

## Organization Settings

Owners can manage:

- Organization name and slug
- Member roles
- Danger zone (delete organization)

## Best Practices

1. **Use descriptive names** - Help members identify the organization
2. **Assign appropriate roles** - Follow principle of least privilege
3. **Regular audits** - Review member access periodically
