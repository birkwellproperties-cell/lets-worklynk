import {
  getOrganizationPermissions,
  organizationMembersRepository,
} from "../api";

const MEMBERSHIP_STATUSES = new Set([
  "invited",
  "active",
  "suspended",
  "revoked",
]);

const PERMISSION_EFFECTS = new Set([
  "allow",
  "deny",
]);

function trimOrNull(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const normalized =
    String(value).trim();

  return normalized || null;
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

function normalizeRoleIds(roleIds) {
  return Array.from(
    new Set(
      (
        Array.isArray(roleIds)
          ? roleIds
          : []
      ).filter(Boolean),
    ),
  );
}

function normalizeSearch(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function memberMatchesSearch(
  member,
  search,
) {
  if (!search) {
    return true;
  }

  const searchableValues = [
    member.displayName,
    member.firstName,
    member.lastName,
    member.email,
    member.phone,
    member.title,
    ...member.roles.map(
      (role) => role.name,
    ),
    ...member.roles.map(
      (role) => role.code,
    ),
  ];

  return searchableValues.some(
    (value) =>
      String(value ?? "")
        .toLowerCase()
        .includes(search),
  );
}

export class OrganizationMembersService {
  constructor({
    repository =
      organizationMembersRepository,
  } = {}) {
    this.repository =
      repository;
  }

  async getMembers(
    organizationId,
    {
      search = "",
      status = "all",
      roleId = "all",
    } = {},
  ) {
    requireIdentifier(
      organizationId,
      "Organization ID",
    );

    const members =
      await this.repository
        .getOrganizationMembers(
          organizationId,
        );

    const normalizedSearch =
      normalizeSearch(search);

    return members.filter(
      (member) => {
        const matchesSearch =
          memberMatchesSearch(
            member,
            normalizedSearch,
          );

        const matchesStatus =
          status === "all" ||
          member.status === status;

        const matchesRole =
          roleId === "all" ||
          member.roles.some(
            (role) =>
              role.id === roleId,
          );

        return (
          matchesSearch &&
          matchesStatus &&
          matchesRole
        );
      },
    );
  }

  async getMember(
    organizationId,
    membershipId,
  ) {
    requireIdentifier(
      organizationId,
      "Organization ID",
    );

    requireIdentifier(
      membershipId,
      "Membership ID",
    );

    return this.repository
      .getOrganizationMember(
        organizationId,
        membershipId,
      );
  }

  async getPermissions() {
    return getOrganizationPermissions();
  }
  async getRoles(
    organizationId,
    {
      includeInactive = false,
    } = {},
  ) {
    requireIdentifier(
      organizationId,
      "Organization ID",
    );

    const roles =
      await this.repository
        .getOrganizationRoles(
          organizationId,
        );

    if (includeInactive) {
      return roles;
    }

    return roles.filter(
      (role) =>
        role.isActive,
    );
  }

  async updateStatus(
    membershipId,
    status,
    {
      title = null,
      currentUserId = null,
      memberUserId = null,
      isPlatformAdministrator = false,
    } = {},
  ) {
    requireIdentifier(
      membershipId,
      "Membership ID",
    );

    if (
      !MEMBERSHIP_STATUSES.has(
        status,
      )
    ) {
      throw new Error(
        "Membership status is invalid.",
      );
    }

    if (
      currentUserId &&
      memberUserId &&
      currentUserId ===
        memberUserId &&
      [
        "suspended",
        "revoked",
      ].includes(status) &&
      !isPlatformAdministrator
    ) {
      throw new Error(
        "You cannot suspend or revoke your own organization membership.",
      );
    }

    return this.repository
      .updateMembershipStatus(
        membershipId,
        status,
        {
          title:
            trimOrNull(title),
        },
      );
  }

  async activateMember(
    membershipId,
    options,
  ) {
    return this.updateStatus(
      membershipId,
      "active",
      options,
    );
  }

  async markMemberInvited(
    membershipId,
    options,
  ) {
    return this.updateStatus(
      membershipId,
      "invited",
      options,
    );
  }

  async suspendMember(
    membershipId,
    options,
  ) {
    return this.updateStatus(
      membershipId,
      "suspended",
      options,
    );
  }

  async revokeMember(
    membershipId,
    options,
  ) {
    return this.updateStatus(
      membershipId,
      "revoked",
      options,
    );
  }

  async replaceRoles(
    membershipId,
    roleIds,
  ) {
    requireIdentifier(
      membershipId,
      "Membership ID",
    );

    return this.repository
      .replaceMembershipRoles(
        membershipId,
        normalizeRoleIds(
          roleIds,
        ),
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
    requireIdentifier(
      membershipId,
      "Membership ID",
    );

    requireIdentifier(
      permissionCode,
      "Permission code",
    );

    if (
      !PERMISSION_EFFECTS.has(
        effect,
      )
    ) {
      throw new Error(
        "Permission override effect must be allow or deny.",
      );
    }

    return this.repository
      .setPermissionOverride(
        membershipId,
        permissionCode,
        effect,
        {
          reason:
            trimOrNull(reason),
        },
      );
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
    requireIdentifier(
      membershipId,
      "Membership ID",
    );

    requireIdentifier(
      permissionCode,
      "Permission code",
    );

    return this.repository
      .removePermissionOverride(
        membershipId,
        permissionCode,
      );
  }
}

export function createOrganizationMembersService(
  options,
) {
  return new OrganizationMembersService(
    options,
  );
}

export const organizationMembersService =
  createOrganizationMembersService();
