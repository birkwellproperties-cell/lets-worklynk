function unique(values) {
  return [
    ...new Set(
      values.filter(Boolean),
    ),
  ];
}

function normalizeOrganization(
  membership,
) {
  const organization =
    membership?.organization;

  if (!organization) {
    return null;
  }

  return {
    id: organization.id,
    organizationNumber:
      organization.organization_number,
    organizationType:
      organization.organization_type,
    legalName:
      organization.legal_name,
    displayName:
      organization.display_name,
    slug:
      organization.slug,
    status:
      organization.status,
    email:
      organization.email,
    phone:
      organization.phone,
    websiteUrl:
      organization.website_url,
    verifiedAt:
      organization.verified_at,
    archivedAt:
      organization.archived_at,
  };
}

function normalizeMembership(
  membership,
) {
  return {
    id: membership.id,
    organizationId:
      membership.organization_id,
    userId:
      membership.user_id,
    status:
      membership.status,
    title:
      membership.title,
    invitedAt:
      membership.invited_at,
    joinedAt:
      membership.joined_at,
    suspendedAt:
      membership.suspended_at,
    revokedAt:
      membership.revoked_at,
    archivedAt:
      membership.archived_at,
    organization:
      normalizeOrganization(
        membership,
      ),
  };
}

function resolveMembershipRoles({
  memberships,
  membershipRoles,
}) {
  const rolesByMembership =
    new Map();

  memberships.forEach(
    (membership) => {
      rolesByMembership.set(
        membership.id,
        [],
      );
    },
  );

  membershipRoles.forEach(
    (assignment) => {
      if (
        !assignment.membership_id ||
        !assignment.role
      ) {
        return;
      }

      const existing =
        rolesByMembership.get(
          assignment.membership_id,
        ) ?? [];

      existing.push({
        id: assignment.role.id,
        organizationId:
          assignment.role.organization_id,
        code:
          assignment.role.code,
        name:
          assignment.role.name,
        description:
          assignment.role.description,
        isSystem:
          assignment.role.is_system,
        isActive:
          assignment.role.is_active,
        archivedAt:
          assignment.role.archived_at,
      });

      rolesByMembership.set(
        assignment.membership_id,
        existing,
      );
    },
  );

  return rolesByMembership;
}

function resolveMembershipPermissions({
  memberships,
  membershipRoles,
  rolePermissions,
  permissionOverrides,
  isPlatformAdministrator,
}) {
  const permissionsByRole =
    new Map();

  rolePermissions.forEach(
    (assignment) => {
      if (
        !assignment.role_id ||
        !assignment.permission?.code
      ) {
        return;
      }

      const existing =
        permissionsByRole.get(
          assignment.role_id,
        ) ?? [];

      existing.push(
        assignment.permission.code,
      );

      permissionsByRole.set(
        assignment.role_id,
        existing,
      );
    },
  );

  const roleIdsByMembership =
    new Map();

  membershipRoles.forEach(
    (assignment) => {
      if (
        !assignment.membership_id ||
        !assignment.role?.id
      ) {
        return;
      }

      const existing =
        roleIdsByMembership.get(
          assignment.membership_id,
        ) ?? [];

      existing.push(
        assignment.role.id,
      );

      roleIdsByMembership.set(
        assignment.membership_id,
        existing,
      );
    },
  );

  const overridesByMembership =
    new Map();

  permissionOverrides.forEach(
    (override) => {
      if (
        !override.membership_id ||
        !override.permission?.code
      ) {
        return;
      }

      const existing =
        overridesByMembership.get(
          override.membership_id,
        ) ?? [];

      existing.push({
        code:
          override.permission.code,
        effect:
          override.effect,
      });

      overridesByMembership.set(
        override.membership_id,
        existing,
      );
    },
  );

  const permissionsByMembership =
    new Map();

  memberships.forEach(
    (membership) => {
      const roleIds =
        roleIdsByMembership.get(
          membership.id,
        ) ?? [];

      const rolePermissionCodes =
        roleIds.flatMap(
          (roleId) =>
            permissionsByRole.get(
              roleId,
            ) ?? [],
        );

      const overrides =
        overridesByMembership.get(
          membership.id,
        ) ?? [];

      const deniedPermissions =
        new Set(
          overrides
            .filter(
              (override) =>
                override.effect === "deny",
            )
            .map(
              (override) =>
                override.code,
            ),
        );

      const allowedPermissions =
        overrides
          .filter(
            (override) =>
              override.effect === "allow",
          )
          .map(
            (override) =>
              override.code,
          );

      const resolvedPermissions =
        isPlatformAdministrator
          ? ["*"]
          : unique([
              ...rolePermissionCodes,
              ...allowedPermissions,
            ]).filter(
              (permissionCode) =>
                !deniedPermissions.has(
                  permissionCode,
                ),
            );

      permissionsByMembership.set(
        membership.id,
        resolvedPermissions,
      );
    },
  );

  return permissionsByMembership;
}

function resolveAccessStatus({
  profile,
  memberships,
  isPlatformAdministrator,
}) {
  if (!profile) {
    return "profile_missing";
  }

  if (
    profile.account_status ===
    "suspended"
  ) {
    return "account_suspended";
  }

  if (
    profile.account_status ===
    "disabled"
  ) {
    return "account_disabled";
  }

  if (
    profile.account_status ===
    "pending"
  ) {
    return "account_pending";
  }

  if (isPlatformAdministrator) {
    return "ready";
  }

  const activeMembership =
    memberships.find(
      (membership) =>
        membership.status ===
          "active" &&
        membership.organization
          ?.status === "active" &&
        !membership.archivedAt &&
        !membership.organization
          ?.archivedAt,
    );

  if (activeMembership) {
    return "ready";
  }

  const invitedMembership =
    memberships.find(
      (membership) =>
        membership.status ===
        "invited",
    );

  if (invitedMembership) {
    return "invited";
  }

  const suspendedMembership =
    memberships.find(
      (membership) =>
        membership.status ===
        "suspended",
    );

  if (suspendedMembership) {
    return "membership_suspended";
  }

  const pendingOrganization =
    memberships.find(
      (membership) =>
        membership.organization
          ?.status === "pending",
    );

  if (pendingOrganization) {
    return "organization_pending";
  }

  const suspendedOrganization =
    memberships.find(
      (membership) =>
        membership.organization
          ?.status === "suspended",
    );

  if (suspendedOrganization) {
    return "organization_suspended";
  }

  return "no_workspace";
}

function resolveSelectedMembership({
  memberships,
  preferredOrganizationId,
}) {
  const eligibleMemberships =
    memberships.filter(
      (membership) =>
        membership.status ===
          "active" &&
        membership.organization
          ?.status === "active" &&
        !membership.archivedAt &&
        !membership.organization
          ?.archivedAt,
    );

  if (eligibleMemberships.length === 0) {
    return null;
  }

  if (preferredOrganizationId) {
    const preferredMembership =
      eligibleMemberships.find(
        (membership) =>
          membership.organizationId ===
          preferredOrganizationId,
      );

    if (preferredMembership) {
      return preferredMembership;
    }
  }

  return eligibleMemberships[0];
}

export function buildAuthBootstrap({
  session,
  identity,
  preferredOrganizationId = null,
}) {
  const user =
    session?.user ?? null;

  if (!user) {
    return {
      session: null,
      user: null,
      profile: null,
      memberships: [],
      selectedMembership: null,
      organization: null,
      roles: [],
      permissions: [],
      isPlatformAdministrator: false,
      accessStatus:
        "unauthenticated",
      workspaceReady: false,
    };
  }

  const profile =
    identity?.profile ?? null;

  const memberships =
    (
      identity?.memberships ?? []
    ).map(
      normalizeMembership,
    );

  const isPlatformAdministrator =
    Boolean(
      identity
        ?.platformAdministrator
        ?.is_active &&
      !identity
        ?.platformAdministrator
        ?.revoked_at,
    );

  const rolesByMembership =
    resolveMembershipRoles({
      memberships,
      membershipRoles:
        identity?.membershipRoles ??
        [],
    });

  const permissionsByMembership =
    resolveMembershipPermissions({
      memberships,
      membershipRoles:
        identity?.membershipRoles ??
        [],
      rolePermissions:
        identity?.rolePermissions ??
        [],
      permissionOverrides:
        identity
          ?.permissionOverrides ??
        [],
      isPlatformAdministrator,
    });

  const selectedMembership =
    resolveSelectedMembership({
      memberships,
      preferredOrganizationId,
    });

  const accessStatus =
    resolveAccessStatus({
      profile,
      memberships,
      isPlatformAdministrator,
    });

  return {
    session,
    user,
    profile,
    memberships,
    selectedMembership,
    organization:
      selectedMembership
        ?.organization ?? null,
    roles:
      selectedMembership
        ? rolesByMembership.get(
            selectedMembership.id,
          ) ?? []
        : [],
    permissions:
      isPlatformAdministrator
        ? ["*"]
        : selectedMembership
          ? permissionsByMembership.get(
              selectedMembership.id,
            ) ?? []
          : [],
    isPlatformAdministrator,
    accessStatus,
    workspaceReady:
      accessStatus === "ready",
  };
}
