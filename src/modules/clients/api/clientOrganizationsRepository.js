import {
  isSupabaseConfigured,
  supabase,
} from "../../../services/supabase";

function requireSupabase() {
  if (
    !isSupabaseConfigured ||
    !supabase
  ) {
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

async function executeSingle(query) {
  const {
    data,
    error,
  } = await query.maybeSingle();

  if (error) {
    throw error;
  }

  return data ?? null;
}

async function executeRequiredSingle(
  query,
) {
  const {
    data,
    error,
  } = await query.single();

  if (error) {
    throw error;
  }

  return data;
}

const CLIENT_ORGANIZATION_SELECT = `
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
  tax_id_last_four,
  verified_at,
  verified_by,
  created_at,
  created_by,
  updated_at,
  updated_by,
  archived_at,
  archived_by
`;

const CLIENT_PROFILE_SELECT = `
  organization_id,
  procurement_email,
  accounts_payable_email,
  default_payment_terms_days,
  purchase_order_required,
  worker_approval_required,
  timesheet_approval_required,
  allows_direct_contractor_contact,
  created_at,
  created_by,
  updated_at,
  updated_by
`;

const ORGANIZATION_PROFILE_SELECT = `
  organization_id,
  profile_visibility,
  short_description,
  full_description,
  industry_code,
  industry_name,
  employee_size_range,
  year_established,
  marketplace_headline,
  primary_contact_name,
  primary_contact_email,
  primary_contact_phone,
  support_email,
  support_phone,
  timezone,
  locale,
  currency_code,
  created_at,
  created_by,
  updated_at,
  updated_by
`;

const RELATIONSHIP_SELECT = `
  id,
  platform_organization_id,
  client_organization_id,
  relationship_number,
  status,
  account_manager_user_id,
  external_reference,
  notes,
  started_at,
  paused_at,
  suspended_at,
  terminated_at,
  created_at,
  created_by,
  updated_at,
  updated_by,
  archived_at,
  archived_by
`;

export class ClientOrganizationsRepository {
  async getClientRelationships(
    platformOrganizationId,
    {
      includeArchived = false,
    } = {},
  ) {
    const client =
      requireSupabase();

    let query =
      client
        .from("client_relationships")
        .select(RELATIONSHIP_SELECT)
        .eq(
          "platform_organization_id",
          requireIdentifier(
            platformOrganizationId,
            "Platform organization ID",
          ),
        )
        .order(
          "created_at",
          {
            ascending: false,
          },
        );

    if (!includeArchived) {
      query =
        query.is(
          "archived_at",
          null,
        );
    }

    const {
      data,
      error,
    } = await query;

    if (error) {
      throw error;
    }

    return data ?? [];
  }

  async getClientRelationship(
    relationshipId,
  ) {
    const client =
      requireSupabase();

    return executeSingle(
      client
        .from("client_relationships")
        .select(RELATIONSHIP_SELECT)
        .eq(
          "id",
          requireIdentifier(
            relationshipId,
            "Client relationship ID",
          ),
        ),
    );
  }

  async getClientRelationshipByOrganization(
    platformOrganizationId,
    clientOrganizationId,
  ) {
    const client =
      requireSupabase();

    return executeSingle(
      client
        .from("client_relationships")
        .select(RELATIONSHIP_SELECT)
        .eq(
          "platform_organization_id",
          requireIdentifier(
            platformOrganizationId,
            "Platform organization ID",
          ),
        )
        .eq(
          "client_organization_id",
          requireIdentifier(
            clientOrganizationId,
            "Client organization ID",
          ),
        ),
    );
  }

  async createClientOrganization(
    payload,
  ) {
    const client =
      requireSupabase();

    return executeRequiredSingle(
      client
        .from("organizations")
        .insert({
          ...payload,
          organization_type:
            "client",
        })
        .select(
          CLIENT_ORGANIZATION_SELECT,
        ),
    );
  }

  async getClientOrganization(
    clientOrganizationId,
  ) {
    const client =
      requireSupabase();

    return executeSingle(
      client
        .from("organizations")
        .select(
          CLIENT_ORGANIZATION_SELECT,
        )
        .eq(
          "id",
          requireIdentifier(
            clientOrganizationId,
            "Client organization ID",
          ),
        )
        .eq(
          "organization_type",
          "client",
        ),
    );
  }

  async updateClientOrganization(
    clientOrganizationId,
    payload,
  ) {
    const client =
      requireSupabase();

    return executeRequiredSingle(
      client
        .from("organizations")
        .update(payload)
        .eq(
          "id",
          requireIdentifier(
            clientOrganizationId,
            "Client organization ID",
          ),
        )
        .eq(
          "organization_type",
          "client",
        )
        .select(
          CLIENT_ORGANIZATION_SELECT,
        ),
    );
  }

  async createClientRelationship(
    payload,
  ) {
    const client =
      requireSupabase();

    return executeRequiredSingle(
      client
        .from("client_relationships")
        .insert(payload)
        .select(RELATIONSHIP_SELECT),
    );
  }

  async updateClientRelationship(
    relationshipId,
    payload,
  ) {
    const client =
      requireSupabase();

    return executeRequiredSingle(
      client
        .from("client_relationships")
        .update(payload)
        .eq(
          "id",
          requireIdentifier(
            relationshipId,
            "Client relationship ID",
          ),
        )
        .select(RELATIONSHIP_SELECT),
    );
  }

  async getClientProfile(
    clientOrganizationId,
  ) {
    const client =
      requireSupabase();

    return executeSingle(
      client
        .from(
          "client_organization_profiles",
        )
        .select(CLIENT_PROFILE_SELECT)
        .eq(
          "organization_id",
          requireIdentifier(
            clientOrganizationId,
            "Client organization ID",
          ),
        ),
    );
  }

  async upsertClientProfile(
    clientOrganizationId,
    payload,
  ) {
    const client =
      requireSupabase();

    return executeRequiredSingle(
      client
        .from(
          "client_organization_profiles",
        )
        .upsert(
          {
            organization_id:
              requireIdentifier(
                clientOrganizationId,
                "Client organization ID",
              ),
            ...payload,
          },
          {
            onConflict:
              "organization_id",
          },
        )
        .select(CLIENT_PROFILE_SELECT),
    );
  }

  async getOrganizationProfile(
    clientOrganizationId,
  ) {
    const client =
      requireSupabase();

    return executeSingle(
      client
        .from("organization_profiles")
        .select(
          ORGANIZATION_PROFILE_SELECT,
        )
        .eq(
          "organization_id",
          requireIdentifier(
            clientOrganizationId,
            "Client organization ID",
          ),
        ),
    );
  }

  async upsertOrganizationProfile(
    clientOrganizationId,
    payload,
  ) {
    const client =
      requireSupabase();

    return executeRequiredSingle(
      client
        .from("organization_profiles")
        .upsert(
          {
            organization_id:
              requireIdentifier(
                clientOrganizationId,
                "Client organization ID",
              ),
            ...payload,
          },
          {
            onConflict:
              "organization_id",
          },
        )
        .select(
          ORGANIZATION_PROFILE_SELECT,
        ),
    );
  }

  async loadClientWorkspace(
    platformOrganizationId,
    relationshipId,
  ) {
    const relationship =
      await this.getClientRelationship(
        relationshipId,
      );

    if (
      !relationship ||
      relationship
        .platform_organization_id !==
        platformOrganizationId
    ) {
      return null;
    }

    const [
      organization,
      organizationProfile,
      clientProfile,
    ] = await Promise.all([
      this.getClientOrganization(
        relationship
          .client_organization_id,
      ),

      this.getOrganizationProfile(
        relationship
          .client_organization_id,
      ),

      this.getClientProfile(
        relationship
          .client_organization_id,
      ),
    ]);

    return {
      relationship,
      organization,
      organizationProfile,
      clientProfile,
    };
  }
}

export function createClientOrganizationsRepository() {
  return new ClientOrganizationsRepository();
}

export const clientOrganizationsRepository =
  createClientOrganizationsRepository();
