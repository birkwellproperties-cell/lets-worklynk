import {
  isSupabaseConfigured,
  supabase,
} from "../../../services/supabase";

function requireSupabase() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error(
      "Supabase is not configured.",
    );
  }

  return supabase;
}

function requireIdentifier(
  value,
  label,
) {
  if (!value) {
    throw new Error(
      `${label} is required.`,
    );
  }

  return value;
}

function normalizeArray(value) {
  return Array.isArray(value)
    ? value
    : [];
}

function mapRole(record) {
  if (!record) {
    return null;
  }

  return {
    id: record.id,
    organizationId:
      record.organization_id ??
      null,
    code:
      record.code,
    name:
      record.name,
    description:
      record.description,
    isSystem:
      Boolean(record.is_system),
    isActive:
      Boolean(record.is_active),
    permissionCount:
      Number(
        record.permission_count ??
        0,
      ),
    assignedAt:
      record.assigned_at ??
      null,
    assignedBy:
      record.assigned_by ??
      null,
    createdAt:
      record.created_at ??
      null,
    updatedAt:
      record.updated_at ??
      null,
  };
}

function mapPermissionOverride(
  record,
) {
  if (!record) {
    return null;
  }

  return {
    id:
      record.id,
    permissionId:
      record.permission_id,
    permissionCode:
      record.permission_code,
    module:
      record.module,
    action:
      record.action,
    description:
      record.description,
    effect:
      record.effect,
    reason:
      record.reason,
    createdAt:
      record.created_at,
    updatedAt:
      record.updated_at,
  };
}

function mapMember(record) {
  if (!record) {
    return null;
  }

  return {
    membershipId:
      record.membership_id,
    organizationId:
      record.organization_id,
    userId:
      record.user_id,
    status:
      record.membership_status,
    title:
      record.title,

    invitedAt:
      record.invited_at,
    joinedAt:
      record.joined_at,
    suspendedAt:
      record.suspended_at,
    revokedAt:
      record.revoked_at,
    archivedAt:
      record.archived_at,
    createdAt:
      record.created_at,
    updatedAt:
      record.updated_at,

    email:
      record.email,
    firstName:
      record.first_name,
    lastName:
      record.last_name,
    displayName:
      record.display_name,
    phone:
      record.phone,
    avatarUrl:
      record.avatar_url,
    accountStatus:
      record.account_status,

    roles:
      normalizeArray(
        record.roles,
      )
        .map(mapRole)
        .filter(Boolean),

    permissionOverrides:
      normalizeArray(
        record.permission_overrides,
      )
        .map(
          mapPermissionOverride,
        )
        .filter(Boolean),
  };
}

function mapMembershipRecord(
  record,
) {
  if (!record) {
    return null;
  }

  return {
    membershipId:
      record.id,
    organizationId:
      record.organization_id,
    userId:
      record.user_id,
    status:
      record.status,
    title:
      record.title,

    invitedAt:
      record.invited_at,
    joinedAt:
      record.joined_at,
    suspendedAt:
      record.suspended_at,
    revokedAt:
      record.revoked_at,
    archivedAt:
      record.archived_at,
    createdAt:
      record.created_at,
    updatedAt:
      record.updated_at,
  };
}

async function invokeRpc(
  functionName,
  parameters,
) {
  const client =
    requireSupabase();

  const {
    data,
    error,
  } = await client.rpc(
    functionName,
    parameters,
  );

  if (error) {
    const message =
      error.message ||
      error.details ||
      error.hint ||
      `RPC ${functionName} failed.`;

    const normalizedError =
      new Error(message);

    normalizedError.code =
      error.code ?? null;

    normalizedError.details =
      error.details ?? null;

    normalizedError.hint =
      error.hint ?? null;

    throw normalizedError;
  }

  return data;
}

export class OrganizationMembersRepository {
  async getOrganizationMembers(
    organizationId,
  ) {
    const data =
      await invokeRpc(
        "get_organization_member_directory",
        {
          requested_organization_id:
            requireIdentifier(
              organizationId,
              "Organization ID",
            ),
        },
      );

    return normalizeArray(data)
      .map(mapMember)
      .filter(Boolean);
  }

  async getOrganizationMember(
    organizationId,
    membershipId,
  ) {
    const members =
      await this.getOrganizationMembers(
        organizationId,
      );

    return (
      members.find(
        (member) =>
          member.membershipId ===
          membershipId,
      ) ?? null
    );
  }

  async getOrganizationRoles(
    organizationId,
  ) {
    const data =
      await invokeRpc(
        "get_organization_roles",
        {
          requested_organization_id:
            requireIdentifier(
              organizationId,
              "Organization ID",
            ),
        },
      );

    return normalizeArray(data)
      .map(mapRole)
      .filter(Boolean);
  }

  async updateMembershipStatus(
    membershipId,
    status,
    {
      title = null,
    } = {},
  ) {
    const data =
      await invokeRpc(
        "update_organization_membership_status",
        {
          requested_membership_id:
            requireIdentifier(
              membershipId,
              "Membership ID",
            ),

          requested_status:
            requireIdentifier(
              status,
              "Membership status",
            ),

          requested_title:
            title,
        },
      );

    return mapMembershipRecord(
      data,
    );
  }

  async activateMembership(
    membershipId,
    options,
  ) {
    return this.updateMembershipStatus(
      membershipId,
      "active",
      options,
    );
  }

  async markMembershipInvited(
    membershipId,
    options,
  ) {
    return this.updateMembershipStatus(
      membershipId,
      "invited",
      options,
    );
  }

  async suspendMembership(
    membershipId,
    options,
  ) {
    return this.updateMembershipStatus(
      membershipId,
      "suspended",
      options,
    );
  }

  async revokeMembership(
    membershipId,
    options,
  ) {
    return this.updateMembershipStatus(
      membershipId,
      "revoked",
      options,
    );
  }

  async replaceMembershipRoles(
    membershipId,
    roleIds,
  ) {
    const normalizedRoleIds =
      Array.from(
        new Set(
          normalizeArray(roleIds)
            .filter(Boolean),
        ),
      );

    const data =
      await invokeRpc(
        "replace_organization_membership_roles",
        {
          requested_membership_id:
            requireIdentifier(
              membershipId,
              "Membership ID",
            ),

          requested_role_ids:
            normalizedRoleIds,
        },
      );

    return normalizeArray(data).map(
      (assignment) => ({
        membershipId:
          assignment.membership_id,
        roleId:
          assignment.role_id,
        assignedAt:
          assignment.assigned_at,
        assignedBy:
          assignment.assigned_by,
      }),
    );
  }

  async setPermissionOverride(
    membershipId,
    permissionCode,
    effect,
    {
      reason = null,
    } = {},
  ) {
    const data =
      await invokeRpc(
        "set_organization_permission_override",
        {
          requested_membership_id:
            requireIdentifier(
              membershipId,
              "Membership ID",
            ),

          requested_permission_code:
            requireIdentifier(
              permissionCode,
              "Permission code",
            ),

          requested_effect:
            requireIdentifier(
              effect,
              "Permission effect",
            ),

          requested_reason:
            reason,
        },
      );

    return {
      id:
        data?.id ?? null,
      membershipId:
        data?.membership_id ??
        membershipId,
      permissionId:
        data?.permission_id ??
        null,
      effect:
        data?.effect ??
        effect,
      reason:
        data?.reason ??
        reason,
      createdAt:
        data?.created_at ??
        null,
      updatedAt:
        data?.updated_at ??
        null,
    };
  }

  async allowPermission(
    membershipId,
    permissionCode,
    options,
  ) {
    return this.setPermissionOverride(
      membershipId,
      permissionCode,
      "allow",
      options,
    );
  }

  async denyPermission(
    membershipId,
    permissionCode,
    options,
  ) {
    return this.setPermissionOverride(
      membershipId,
      permissionCode,
      "deny",
      options,
    );
  }

  async removePermissionOverride(
    membershipId,
    permissionCode,
  ) {
    const data =
      await invokeRpc(
        "remove_organization_permission_override",
        {
          requested_membership_id:
            requireIdentifier(
              membershipId,
              "Membership ID",
            ),

          requested_permission_code:
            requireIdentifier(
              permissionCode,
              "Permission code",
            ),
        },
      );

    return Boolean(data);
  }
}

export function createOrganizationMembersRepository() {
  return new OrganizationMembersRepository();
}

export const organizationMembersRepository =
  createOrganizationMembersRepository();
