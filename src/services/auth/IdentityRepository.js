import {
  isSupabaseConfigured,
  supabase,
} from "../supabase";

function requireSupabase() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error(
      "Supabase is not configured. Verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
    );
  }

  return supabase;
}

function unique(values) {
  return [
    ...new Set(
      values.filter(Boolean),
    ),
  ];
}

export class IdentityRepository {
  async getProfile(userId) {
    if (!userId) {
      return null;
    }

    const client =
      requireSupabase();

    const {
      data,
      error,
    } = await client
      .from("profiles")
      .select(`
        id,
        email,
        first_name,
        last_name,
        display_name,
        phone,
        avatar_url,
        account_status,
        created_at,
        updated_at
      `)
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data ?? null;
  }

  async getOrganizationMemberships(
    userId,
  ) {
    if (!userId) {
      return [];
    }

    const client =
      requireSupabase();

    const {
      data,
      error,
    } = await client
      .from(
        "organization_memberships",
      )
      .select(`
        id,
        organization_id,
        user_id,
        status,
        title,
        invited_at,
        joined_at,
        suspended_at,
        revoked_at,
        archived_at,
        created_at,
        updated_at,
        organization:organizations (
          id,
          organization_number,
          organization_type,
          legal_name,
          display_name,
          slug,
          status,
          email,
          phone,
          website_url,
          verified_at,
          archived_at,
          created_at,
          updated_at
        )
      `)
      .eq("user_id", userId)
      .is("archived_at", null)
      .order(
        "created_at",
        {
          ascending: true,
        },
      );

    if (error) {
      throw error;
    }

    return data ?? [];
  }

  async getMembershipRoles(
    membershipIds,
  ) {
    const normalizedMembershipIds =
      unique(
        membershipIds ?? [],
      );

    if (
      normalizedMembershipIds.length === 0
    ) {
      return [];
    }

    const client =
      requireSupabase();

    const {
      data,
      error,
    } = await client
      .from("membership_roles")
      .select(`
        membership_id,
        assigned_at,
        role:roles (
          id,
          organization_id,
          code,
          name,
          description,
          is_system,
          is_active,
          archived_at
        )
      `)
      .in(
        "membership_id",
        normalizedMembershipIds,
      );

    if (error) {
      throw error;
    }

    return data ?? [];
  }

  async getRolePermissions(roleIds) {
    const normalizedRoleIds =
      unique(
        roleIds ?? [],
      );

    if (
      normalizedRoleIds.length === 0
    ) {
      return [];
    }

    const client =
      requireSupabase();

    const {
      data,
      error,
    } = await client
      .from("role_permissions")
      .select(`
        role_id,
        permission:permissions (
          id,
          code,
          module,
          action,
          description,
          is_system
        )
      `)
      .in(
        "role_id",
        normalizedRoleIds,
      );

    if (error) {
      throw error;
    }

    return data ?? [];
  }

  async getPermissionOverrides(
    membershipIds,
  ) {
    const normalizedMembershipIds =
      unique(
        membershipIds ?? [],
      );

    if (
      normalizedMembershipIds.length === 0
    ) {
      return [];
    }

    const client =
      requireSupabase();

    const {
      data,
      error,
    } = await client
      .from(
        "user_permission_overrides",
      )
      .select(`
        id,
        membership_id,
        effect,
        reason,
        permission:permissions (
          id,
          code,
          module,
          action,
          description,
          is_system
        )
      `)
      .in(
        "membership_id",
        normalizedMembershipIds,
      );

    if (error) {
      throw error;
    }

    return data ?? [];
  }

  async getPlatformAdministrator(
    userId,
  ) {
    if (!userId) {
      return null;
    }

    const client =
      requireSupabase();

    const {
      data,
      error,
    } = await client
      .from(
        "platform_administrators",
      )
      .select(`
        user_id,
        is_active,
        granted_at,
        revoked_at
      `)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data ?? null;
  }

  async loadIdentity(userId) {
    if (!userId) {
      return {
        profile: null,
        memberships: [],
        membershipRoles: [],
        rolePermissions: [],
        permissionOverrides: [],
        platformAdministrator: null,
      };
    }

    const [
      profile,
      memberships,
      platformAdministrator,
    ] = await Promise.all([
      this.getProfile(userId),
      this.getOrganizationMemberships(
        userId,
      ),
      this.getPlatformAdministrator(
        userId,
      ),
    ]);

    const membershipIds =
      memberships.map(
        (membership) =>
          membership.id,
      );

    const membershipRoles =
      await this.getMembershipRoles(
        membershipIds,
      );

    const roleIds =
      unique(
        membershipRoles.map(
          (assignment) =>
            assignment.role?.id,
        ),
      );

    const [
      rolePermissions,
      permissionOverrides,
    ] = await Promise.all([
      this.getRolePermissions(
        roleIds,
      ),
      this.getPermissionOverrides(
        membershipIds,
      ),
    ]);

    return {
      profile,
      memberships,
      membershipRoles,
      rolePermissions,
      permissionOverrides,
      platformAdministrator,
    };
  }
}

export function createIdentityRepository() {
  return new IdentityRepository();
}

export const identityRepository =
  createIdentityRepository();
