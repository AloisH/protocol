import type {
  Organization,
  OrganizationMember,
  OrganizationRole,
  Prisma,
  Session,
  Todo,
  User,
} from '../../prisma/generated/client';
import { db } from './testDb';

/**
 * Create a test user with sensible defaults.
 *
 * Email uniqueness is guaranteed via timestamp + random pattern. All fields
 * have sensible defaults but can be overridden via the overrides parameter.
 *
 * **Default Values:**
 * - email: `test-${Date.now()}-${random}@example.com` (unique)
 * - name: "Test User"
 * - role: "USER"
 * - emailVerified: false
 * - onboardingCompleted: false
 * - emailNotifications: true
 *
 * **Performance:** <50ms per fixture
 *
 * @param overrides - Partial user data to override defaults
 * @returns Created user object with generated CUID
 * @see CLAUDE.md Test Infrastructure for usage patterns
 *
 * @example
 * ```typescript
 * // Default user
 * const user = await createTestUser()
 *
 * // Admin user with custom email
 * const admin = await createTestUser({
 *   role: 'ADMIN',
 *   email: 'admin@test.com',
 *   emailVerified: true
 * })
 *
 * // Use returned ID for relationships
 * const todo = await createTestTodo(user.id)
 * ```
 */
export async function createTestUser(overrides?: Partial<Prisma.UserCreateInput>): Promise<User> {
  const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const defaults: Prisma.UserCreateInput = {
    email: `test-${uniqueSuffix}@example.com`,
    name: 'Test User',
    password: 'hashed-password-placeholder',
    emailVerified: false,
    role: 'USER',
    banned: false,
    onboardingCompleted: false,
    emailNotifications: true,
  };

  return db.user.create({
    data: { ...defaults, ...overrides },
  });
}

/**
 * Create a test organization with unique slug.
 *
 * Slug uniqueness is guaranteed via timestamp + random pattern. Use this
 * fixture to test organization-scoped features and multi-tenancy.
 *
 * **Default Values:**
 * - name: "Test Organization"
 * - slug: `test-org-${Date.now()}-${random}` (unique)
 * - planType: "free"
 *
 * **Performance:** <50ms per fixture
 *
 * @param overrides - Partial organization data to override defaults
 * @returns Created organization object with generated CUID
 * @see CLAUDE.md Test Infrastructure for usage patterns
 *
 * @example
 * ```typescript
 * // Default organization
 * const org = await createTestOrg()
 *
 * // Premium organization with custom name
 * const premiumOrg = await createTestOrg({
 *   planType: 'premium',
 *   name: 'Premium Corp',
 *   description: 'Premium customer'
 * })
 *
 * // Create org membership
 * const user = await createTestUser()
 * await db.organizationMember.create({
 *   data: { userId: user.id, organizationId: org.id, role: 'OWNER' }
 * })
 * ```
 */
export async function createTestOrg(
  overrides?: Partial<Prisma.OrganizationCreateInput>,
): Promise<Organization> {
  const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const defaults: Prisma.OrganizationCreateInput = {
    name: 'Test Organization',
    slug: `test-org-${uniqueSuffix}`,
    planType: 'free',
  };

  return db.organization.create({
    data: { ...defaults, ...overrides },
  });
}

/**
 * Create a test todo linked to an organization.
 *
 * Todos require a valid organizationId and createdBy - create an org and user first.
 * This demonstrates the org-scoped relationship pattern used throughout the codebase.
 *
 * **Default Values:**
 * - title: "Test Todo"
 * - description: null
 * - completed: false
 * - organizationId: (from parameter - required)
 * - createdBy: (from parameter - required)
 *
 * **Performance:** <50ms per fixture
 *
 * @param organizationId - Organization ID that owns this todo (required - must exist)
 * @param createdBy - User ID that created this todo (required - must exist)
 * @param overrides - Partial todo data to override defaults
 * @returns Created todo object with generated CUID
 * @see CLAUDE.md Test Infrastructure for usage patterns
 *
 * @example
 * ```typescript
 * // Basic todo
 * const user = await createTestUser()
 * const org = await createTestOrg()
 * const todo = await createTestTodo(org.id, user.id)
 *
 * // Completed todo with description
 * const completedTodo = await createTestTodo(org.id, user.id, {
 *   title: 'Important Task',
 *   description: 'This needs to be done',
 *   completed: true
 * })
 * ```
 */
export async function createTestTodo(
  organizationId: string,
  createdBy: string,
  overrides?: Partial<Omit<Prisma.TodoCreateInput, 'organization' | 'creator'>>,
): Promise<Todo> {
  return db.todo.create({
    data: {
      title: overrides?.title ?? 'Test Todo',
      description: overrides?.description,
      completed: overrides?.completed ?? false,
      organization: { connect: { id: organizationId } },
      creator: { connect: { id: createdBy } },
    },
  });
}

/**
 * Create a test session for authentication.
 *
 * Sessions are required for testing authenticated API endpoints. This fixture
 * creates a valid session linked to a user, which can be passed via cookie
 * header in test requests.
 *
 * **Default Values:**
 * - token: `test-${Date.now()}-${random}` (unique)
 * - userId: (from parameter - required)
 * - expiresAt: 7 days from now
 * - userAgent: "test-agent"
 * - ipAddress: "127.0.0.1"
 *
 * **Performance:** <50ms per fixture
 *
 * @param user - User object that owns this session (required)
 * @returns Created session object with token for cookie auth
 * @see CLAUDE.md Test Infrastructure for API testing patterns
 *
 * @example
 * ```typescript
 * // Create authenticated request
 * const user = await createTestUser()
 * const session = await createTestSession(user)
 * const event = createMockEvent({
 *   headers: { cookie: `better-auth.session_token=${session.token}` }
 * })
 * ```
 */
export async function createTestSession(user: User): Promise<Session> {
  const token = `test-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  return db.session.create({
    data: {
      token,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      userAgent: 'test-agent',
      ipAddress: '127.0.0.1',
    },
  });
}

/**
 * Create a test organization member relationship.
 *
 * Links a user to an organization with a specific role. Required for testing
 * organization-scoped endpoints and multi-tenancy features.
 *
 * **Default Values:**
 * - userId: (from parameter - required)
 * - organizationId: (from parameter - required)
 * - role: "MEMBER" (can be overridden)
 *
 * **Performance:** <50ms per fixture
 *
 * @param userId - User ID to add as member (required)
 * @param organizationId - Organization ID to add user to (required)
 * @param role - Organization role (OWNER/ADMIN/MEMBER/GUEST, default: MEMBER)
 * @returns Created organization member relationship
 * @see CLAUDE.md Test Infrastructure for organization testing patterns
 *
 * @example
 * ```typescript
 * // Add user as member
 * const user = await createTestUser()
 * const org = await createTestOrg()
 * await createTestOrgMember(user.id, org.id, 'MEMBER')
 *
 * // Add user as owner
 * await createTestOrgMember(user.id, org.id, 'OWNER')
 * ```
 */
export async function createTestOrgMember(
  userId: string,
  organizationId: string,
  role: OrganizationRole = 'MEMBER',
): Promise<OrganizationMember> {
  return db.organizationMember.create({
    data: { userId, organizationId, role },
  });
}
