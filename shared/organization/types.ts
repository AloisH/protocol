import type { OrganizationRole } from './schemas';

export interface OrganizationMemberUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
}

export interface MemberWithUser {
  id: string;
  organizationId: string;
  userId: string;
  role: OrganizationRole;
  createdAt: Date;
  updatedAt: Date;
  user: OrganizationMemberUser;
}

export interface MembersListResponse {
  members: MemberWithUser[];
  currentUserRole: OrganizationRole;
}
