# Organizations System (Multi-Tenancy)

**Related docs:** project_architecture.md, database_schema.md, authentication_system.md

---

## Overview

**Type:** Multi-tenant organization workspaces
**Roles:** OWNER, ADMIN, MEMBER, GUEST
**Features:** Create orgs, invite members, role management, org switching
**Isolation:** Data scoped by organizationId
**Pages:** `/org/*` (create, select, invite, [slug]/\*)

---

## Architecture

### Multi-Tenancy Model

**User ↔ OrganizationMember ↔ Organization**

- Users can belong to multiple organizations
- Each membership has a role (OWNER/ADMIN/MEMBER/GUEST)
- Session tracks currentOrganizationId
- All org data queries filtered by organizationId

---

## Organization Roles

### Role Hierarchy

```prisma
enum OrganizationRole {
  OWNER    // Full control, can delete org
  ADMIN    // Manage members, settings
  MEMBER   // Standard access
  GUEST    // Limited read-only
}
```

### Permission Matrix

| Action          | OWNER | ADMIN | MEMBER | GUEST        |
| --------------- | ----- | ----- | ------ | ------------ |
| View org data   | ✅    | ✅    | ✅     | ✅ (limited) |
| Create projects | ✅    | ✅    | ✅     | ❌           |
| Manage members  | ✅    | ✅    | ❌     | ❌           |
| Change settings | ✅    | ✅    | ❌     | ❌           |
| Delete org      | ✅    | ❌    | ❌     | ❌           |
| Change plan     | ✅    | ❌    | ❌     | ❌           |

---

## Database Schema

### Organization

```prisma
model Organization {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  description String?
  image       String?
  planType    String   @default("free")

  members OrganizationMember[]
  invites OrganizationInvite[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Key fields:**

- `slug`: URL-friendly identifier (must be unique)
- `planType`: Subscription tier (free, pro, enterprise)

### OrganizationMember

```prisma
model OrganizationMember {
  id             String           @id @default(cuid())
  userId         String
  organizationId String
  role           OrganizationRole @default(MEMBER)

  user         User         @relation(...)
  organization Organization @relation(...)

  @@unique([userId, organizationId])
}
```

**Constraints:**

- User can only be member once per org
- Cascade delete when user or org deleted

### OrganizationInvite

```prisma
model OrganizationInvite {
  id             String           @id @default(cuid())
  email          String
  organizationId String
  invitedById    String?
  role           OrganizationRole @default(MEMBER)
  token          String           @unique
  expiresAt      DateTime
  acceptedAt     DateTime?

  organization Organization @relation(...)
  invitedBy    User?        @relation(...)
}
```

**Key fields:**

- `token`: Unique invite link token
- `expiresAt`: Invite expiration (default 7 days)
- `acceptedAt`: Null if pending, timestamp when accepted

---

## API Endpoints

### Organizations

**GET /api/organizations**

- List user's organizations
- Returns: `{ organizations: Organization[] }`

**POST /api/organizations**

- Create new organization
- Body: `{ name, slug, description? }`
- Auto-creates OWNER membership
- Returns: `{ organization: Organization }`

**GET /api/organizations/[slug]**

- Get organization by slug
- Requires: User is member
- Returns: `{ organization: Organization, role: OrganizationRole }`

**PUT /api/organizations/[slug]**

- Update organization
- Requires: OWNER or ADMIN role
- Body: `{ name?, description?, image? }`
- Returns: `{ organization: Organization }`

**DELETE /api/organizations/[slug]**

- Delete organization
- Requires: OWNER role only
- Cascades to members, invites
- Returns: `{ success: true }`

### Members

**GET /api/organizations/[slug]/members**

- List organization members
- Requires: Member of org
- Returns: `{ members: OrganizationMember[] }`

**PUT /api/organizations/[slug]/members/[userId]/role**

- Update member role
- Requires: OWNER or ADMIN
- Cannot demote last OWNER
- Body: `{ role: OrganizationRole }`
- Returns: `{ member: OrganizationMember }`

**DELETE /api/organizations/[slug]/members/[userId]**

- Remove member
- Requires: OWNER or ADMIN (or self)
- Cannot remove last OWNER
- Returns: `{ success: true }`

### Invites

**GET /api/organizations/[slug]/invites**

- List pending invites
- Requires: OWNER or ADMIN
- Returns: `{ invites: OrganizationInvite[] }`

**POST /api/organizations/[slug]/invites**

- Create invite
- Requires: OWNER or ADMIN
- Body: `{ email, role }`
- Sends email (if configured)
- Returns: `{ invite: OrganizationInvite, token: string }`

**GET /api/organizations/invites/[token]**

- Get invite by token
- Public endpoint (no auth)
- Returns: `{ invite: OrganizationInvite, organization: Organization }`

**POST /api/organizations/invites/accept**

- Accept invite
- Requires: Auth
- Body: `{ token }`
- Creates OrganizationMember
- Returns: `{ organization: Organization }`

**DELETE /api/organizations/[slug]/invites/[inviteId]**

- Revoke invite
- Requires: OWNER or ADMIN
- Returns: `{ success: true }`

### Session Management

**PUT /api/user/current-organization**

- Switch active organization
- Body: `{ organizationId }`
- Updates `Session.currentOrganizationId`
- Returns: `{ success: true }`

---

## Pages

### /org/create

**Purpose:** Create new organization

**Flow:**

1. Form with name, slug, description
2. Validate slug uniqueness
3. Create org via API
4. Auto-create OWNER membership
5. Redirect to `/org/[slug]/dashboard`

### /org/select

**Purpose:** Organization switcher/selector

**Flow:**

1. List user's organizations
2. Show current organization
3. Click to switch
4. Update session currentOrganizationId
5. Redirect to org dashboard

### /org/invite

**Purpose:** Accept organization invite

**Flow:**

1. Extract token from URL query
2. Fetch invite details
3. Show org info, role being granted
4. Accept button calls API
5. Redirect to org dashboard

### /org/[slug]/dashboard

**Purpose:** Organization workspace

**Content:**

- Org overview
- Recent activity
- Quick actions

### /org/[slug]/members

**Purpose:** Member management

**Features:**

- List members with roles
- Invite new members
- Change member roles (OWNER/ADMIN only)
- Remove members (OWNER/ADMIN only)

### /org/[slug]/settings

**Purpose:** Organization settings

**Tabs:**

- General: Name, description, image
- Billing: Plan type, upgrade (planned)
- Danger zone: Delete organization (OWNER only)

---

## Components

### OrganizationSwitcher

**Location:** `app/components/OrganizationSwitcher.vue`

**Purpose:** Dropdown to switch between orgs

**Props:** None (fetches from API)

**Example:**

```vue
<template>
  <UDropdown>
    <template #trigger>
      <UButton>{{ currentOrg?.name }}</UButton>
    </template>
    <UDropdownItem v-for="org in organizations" :key="org.id" @click="switchOrg(org.id)">
      {{ org.name }}
    </UDropdownItem>
  </UDropdown>
</template>
```

### OrganizationMembers

**Location:** `app/components/OrganizationMembers.vue`

**Purpose:** Member list with role management

**Props:**

- `organizationId`: Organization ID
- `canManage`: Whether user can manage members

**Features:**

- List members with avatars
- Role badges
- Invite button (if canManage)
- Remove/change role actions (if canManage)

---

## Data Scoping

### CRITICAL: Always filter by organizationId

**❌ DON'T: Global queries**

```typescript
// WILL LEAK DATA ACROSS ORGANIZATIONS
const projects = await db.project.findMany();
```

**✅ DO: Organization-scoped queries**

```typescript
// Safe: filtered by organization
const projects = await db.project.findMany({
  where: { organizationId },
});
```

### Get current organizationId

**Server-side:**

```typescript
import { serverAuth } from '~/server/features/auth/auth-session';

export default defineEventHandler(async (event) => {
  const session = await serverAuth().getSession({ headers: event.headers });
  if (!session?.user) {
    throw createError({ statusCode: 401 });
  }

  const organizationId = session.currentOrganizationId;
  if (!organizationId) {
    throw createError({ statusCode: 400, message: 'No organization selected' });
  }

  // Use organizationId for scoped queries
  const data = await db.project.findMany({
    where: { organizationId },
  });

  return { data };
});
```

**Client-side:**

```vue
<script setup lang="ts">
const { session } = useAuth();
const currentOrgId = computed(() => session.value?.currentOrganizationId);

const { data: projects } = await useFetch('/api/projects', {
  // organizationId passed in session, no need to send explicitly
});
</script>
```

---

## Invite Flow

### 1. Create Invite (OWNER/ADMIN)

```vue
<script setup lang="ts">
async function inviteMember(email: string, role: OrganizationRole) {
  const { invite, token } = await $fetch(`/api/organizations/${slug}/invites`, {
    method: 'POST',
    body: { email, role },
  });

  // Copy invite link
  const inviteUrl = `${window.location.origin}/org/invite?token=${token}`;
  await navigator.clipboard.writeText(inviteUrl);

  toast.add({ title: 'Invite sent', description: 'Link copied to clipboard' });
}
</script>
```

### 2. Accept Invite (Invitee)

```vue
<script setup lang="ts">
const route = useRoute();
const token = route.query.token as string;

const { data: invite } = await useFetch(`/api/organizations/invites/${token}`);

async function acceptInvite() {
  const { organization } = await $fetch('/api/organizations/invites/accept', {
    method: 'POST',
    body: { token },
  });

  await navigateTo(`/org/${organization.slug}/org/[slug]/dashboard`);
}
</script>
```

---

## Role Checking

### Server-side

```typescript
import { requireOrgRole } from '~/server/middleware/org-role-guard';

export default defineEventHandler(async (event) => {
  const { member } = await requireOrgRole(['OWNER', 'ADMIN'])(event);

  // User has OWNER or ADMIN role in current organization
  return { success: true };
});
```

### Client-side

```vue
<script setup lang="ts">
const { data: org } = await useFetch(`/api/organizations/${slug}`);

const isOwner = computed(() => org.value?.role === 'OWNER');
const canManage = computed(() => ['OWNER', 'ADMIN'].includes(org.value?.role));
</script>

<template>
  <div>
    <UButton v-if="canManage" @click="inviteMember">Invite Member</UButton>
    <UButton v-if="isOwner" color="error" @click="deleteOrg">Delete Organization</UButton>
  </div>
</template>
```

---

## Slug Generation

**Pattern:** Slugify organization name

```typescript
function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Example: "Acme Inc." → "acme-inc"
```

**Validation:**

- Unique across all organizations
- Alphanumeric + hyphens only
- 3-50 characters
- No leading/trailing hyphens

---

## Common Patterns

### Check Organization Membership

```typescript
// Server-side
export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug');
  const session = await serverAuth().getSession({ headers: event.headers });

  const member = await db.organizationMember.findFirst({
    where: {
      userId: session.user.id,
      organization: { slug },
    },
    include: { organization: true },
  });

  if (!member) {
    throw createError({ statusCode: 404, message: 'Organization not found' });
  }

  return { organization: member.organization, role: member.role };
});
```

### Prevent Removing Last Owner

```typescript
async function removeMember(orgId: string, userId: string) {
  const member = await db.organizationMember.findFirst({
    where: { organizationId: orgId, userId },
  });

  if (member.role === 'OWNER') {
    const ownerCount = await db.organizationMember.count({
      where: { organizationId: orgId, role: 'OWNER' },
    });

    if (ownerCount === 1) {
      throw createError({
        statusCode: 400,
        message: 'Cannot remove last owner',
      });
    }
  }

  await db.organizationMember.delete({
    where: { id: member.id },
  });
}
```

---

## Testing

**Unit tests:** Test organization service, repository, API endpoints

**Example:**

```typescript
describe('OrganizationService', () => {
  it('creates organization with owner membership', async () => {
    const org = await organizationService.create({
      name: 'Test Org',
      slug: 'test-org',
      userId: 'user-123',
    });

    expect(org.name).toBe('Test Org');

    const members = await db.organizationMember.findMany({
      where: { organizationId: org.id },
    });

    expect(members).toHaveLength(1);
    expect(members[0].role).toBe('OWNER');
  });
});
```

---

## Common Gotchas

1. **Data isolation**: ALWAYS filter queries by organizationId (prevents data leaks)
2. **Last owner**: Prevent removing/demoting last OWNER
3. **Slug uniqueness**: Validate before creation
4. **Session context**: Update currentOrganizationId when switching orgs
5. **Invite expiration**: Check expiresAt before accepting
6. **Role hierarchy**: OWNER > ADMIN > MEMBER > GUEST
7. **Cascade deletes**: Deleting org removes all members, invites, projects, etc.

---

## Future Enhancements

**Planned:**

- Billing integration: Per-org subscriptions
- Team limits: Member count by plan
- Audit logs: Track org activity
- Custom roles: Define custom permissions
- SSO: Organization-level SSO
- Webhooks: Org event notifications

---
