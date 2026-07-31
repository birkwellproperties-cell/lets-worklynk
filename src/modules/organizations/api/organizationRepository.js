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

function requireOrganizationId(
  organizationId,
) {
  if (!organizationId) {
    throw new Error(
      "Organization ID is required.",
    );
  }

  return organizationId;
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

const ORGANIZATION_SELECT = `
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

const PROFILE_SELECT = `
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

const CONTRACTOR_PROFILE_SELECT = `
  organization_id,
  business_type,
  rate_visibility,
  accepts_marketplace_invites,
  accepts_direct_client_invites,
  team_dispatch_enabled,
  workers_compensation_exempt,
  default_service_radius_miles,
  minimum_engagement_hours,
  created_at,
  created_by,
  updated_at,
  updated_by
`;

const LOCATION_SELECT = `
  id,
  organization_id,
  location_number,
  name,
  location_type,
  status,
  is_primary,
  email,
  phone,
  address_line_1,
  address_line_2,
  city,
  state_region,
  postal_code,
  country_code,
  latitude,
  longitude,
  timezone,
  created_at,
  created_by,
  updated_at,
  updated_by,
  archived_at,
  archived_by
`;

const DEPARTMENT_SELECT = `
  id,
  organization_id,
  location_id,
  parent_department_id,
  code,
  name,
  description,
  status,
  created_at,
  created_by,
  updated_at,
  updated_by,
  archived_at,
  archived_by
`;

const SETTING_SELECT = `
  id,
  organization_id,
  setting_key,
  setting_value,
  is_sensitive,
  created_at,
  created_by,
  updated_at,
  updated_by
`;

const BRANDING_SELECT = `
  organization_id,
  logo_path,
  logo_mark_path,
  cover_image_path,
  primary_color,
  secondary_color,
  accent_color,
  display_name_override,
  tagline,
  created_at,
  created_by,
  updated_at,
  updated_by
`;

const BILLING_SELECT = `
  organization_id,
  billing_legal_name,
  billing_email,
  billing_phone,
  address_line_1,
  address_line_2,
  city,
  state_region,
  postal_code,
  country_code,
  currency_code,
  payment_terms_days,
  invoice_prefix,
  purchase_order_required,
  tax_id_last_four,
  created_at,
  created_by,
  updated_at,
  updated_by
`;

export class OrganizationRepository {
  async getOrganization(
    organizationId,
  ) {
    const client =
      requireSupabase();

    return executeSingle(
      client
        .from("organizations")
        .select(ORGANIZATION_SELECT)
        .eq(
          "id",
          requireOrganizationId(
            organizationId,
          ),
        ),
    );
  }

  async updateOrganization(
    organizationId,
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
          requireOrganizationId(
            organizationId,
          ),
        )
        .select(ORGANIZATION_SELECT),
    );
  }

  async getOrganizationProfile(
    organizationId,
  ) {
    const client =
      requireSupabase();

    return executeSingle(
      client
        .from("organization_profiles")
        .select(PROFILE_SELECT)
        .eq(
          "organization_id",
          requireOrganizationId(
            organizationId,
          ),
        ),
    );
  }

  async upsertOrganizationProfile(
    organizationId,
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
              requireOrganizationId(
                organizationId,
              ),
            ...payload,
          },
          {
            onConflict:
              "organization_id",
          },
        )
        .select(PROFILE_SELECT),
    );
  }

  async getClientProfile(
    organizationId,
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
          requireOrganizationId(
            organizationId,
          ),
        ),
    );
  }

  async upsertClientProfile(
    organizationId,
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
              requireOrganizationId(
                organizationId,
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

  async getContractorProfile(
    organizationId,
  ) {
    const client =
      requireSupabase();

    return executeSingle(
      client
        .from(
          "contractor_organization_profiles",
        )
        .select(
          CONTRACTOR_PROFILE_SELECT,
        )
        .eq(
          "organization_id",
          requireOrganizationId(
            organizationId,
          ),
        ),
    );
  }

  async upsertContractorProfile(
    organizationId,
    payload,
  ) {
    const client =
      requireSupabase();

    return executeRequiredSingle(
      client
        .from(
          "contractor_organization_profiles",
        )
        .upsert(
          {
            organization_id:
              requireOrganizationId(
                organizationId,
              ),
            ...payload,
          },
          {
            onConflict:
              "organization_id",
          },
        )
        .select(
          CONTRACTOR_PROFILE_SELECT,
        ),
    );
  }

  async getLocations(
    organizationId,
    {
      includeArchived = false,
    } = {},
  ) {
    const client =
      requireSupabase();

    let query =
      client
        .from("organization_locations")
        .select(LOCATION_SELECT)
        .eq(
          "organization_id",
          requireOrganizationId(
            organizationId,
          ),
        )
        .order(
          "is_primary",
          {
            ascending: false,
          },
        )
        .order(
          "name",
          {
            ascending: true,
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

  async createLocation(
    payload,
  ) {
    const client =
      requireSupabase();

    return executeRequiredSingle(
      client
        .from("organization_locations")
        .insert(payload)
        .select(LOCATION_SELECT),
    );
  }

  async updateLocation(
    locationId,
    payload,
  ) {
    if (!locationId) {
      throw new Error(
        "Location ID is required.",
      );
    }

    const client =
      requireSupabase();

    return executeRequiredSingle(
      client
        .from("organization_locations")
        .update(payload)
        .eq("id", locationId)
        .select(LOCATION_SELECT),
    );
  }

  async getDepartments(
    organizationId,
    {
      includeArchived = false,
    } = {},
  ) {
    const client =
      requireSupabase();

    let query =
      client
        .from(
          "organization_departments",
        )
        .select(DEPARTMENT_SELECT)
        .eq(
          "organization_id",
          requireOrganizationId(
            organizationId,
          ),
        )
        .order(
          "name",
          {
            ascending: true,
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

  async createDepartment(
    payload,
  ) {
    const client =
      requireSupabase();

    return executeRequiredSingle(
      client
        .from(
          "organization_departments",
        )
        .insert(payload)
        .select(DEPARTMENT_SELECT),
    );
  }

  async updateDepartment(
    departmentId,
    payload,
  ) {
    if (!departmentId) {
      throw new Error(
        "Department ID is required.",
      );
    }

    const client =
      requireSupabase();

    return executeRequiredSingle(
      client
        .from(
          "organization_departments",
        )
        .update(payload)
        .eq("id", departmentId)
        .select(DEPARTMENT_SELECT),
    );
  }

  async getSettings(
    organizationId,
  ) {
    const client =
      requireSupabase();

    const {
      data,
      error,
    } = await client
      .from("organization_settings")
      .select(SETTING_SELECT)
      .eq(
        "organization_id",
        requireOrganizationId(
          organizationId,
        ),
      )
      .order(
        "setting_key",
        {
          ascending: true,
        },
      );

    if (error) {
      throw error;
    }

    return data ?? [];
  }

  async upsertSetting(
    organizationId,
    settingKey,
    payload,
  ) {
    if (!settingKey) {
      throw new Error(
        "Setting key is required.",
      );
    }

    const client =
      requireSupabase();

    return executeRequiredSingle(
      client
        .from("organization_settings")
        .upsert(
          {
            organization_id:
              requireOrganizationId(
                organizationId,
              ),
            setting_key:
              settingKey,
            ...payload,
          },
          {
            onConflict:
              "organization_id,setting_key",
          },
        )
        .select(SETTING_SELECT),
    );
  }

  async deleteSetting(
    organizationId,
    settingKey,
  ) {
    const client =
      requireSupabase();

    const {
      error,
    } = await client
      .from("organization_settings")
      .delete()
      .eq(
        "organization_id",
        requireOrganizationId(
          organizationId,
        ),
      )
      .eq(
        "setting_key",
        settingKey,
      );

    if (error) {
      throw error;
    }
  }

  async getBranding(
    organizationId,
  ) {
    const client =
      requireSupabase();

    return executeSingle(
      client
        .from("organization_branding")
        .select(BRANDING_SELECT)
        .eq(
          "organization_id",
          requireOrganizationId(
            organizationId,
          ),
        ),
    );
  }

  async upsertBranding(
    organizationId,
    payload,
  ) {
    const client =
      requireSupabase();

    return executeRequiredSingle(
      client
        .from("organization_branding")
        .upsert(
          {
            organization_id:
              requireOrganizationId(
                organizationId,
              ),
            ...payload,
          },
          {
            onConflict:
              "organization_id",
          },
        )
        .select(BRANDING_SELECT),
    );
  }

  async getBillingProfile(
    organizationId,
  ) {
    const client =
      requireSupabase();

    return executeSingle(
      client
        .from(
          "organization_billing_profiles",
        )
        .select(BILLING_SELECT)
        .eq(
          "organization_id",
          requireOrganizationId(
            organizationId,
          ),
        ),
    );
  }

  async upsertBillingProfile(
    organizationId,
    payload,
  ) {
    const client =
      requireSupabase();

    return executeRequiredSingle(
      client
        .from(
          "organization_billing_profiles",
        )
        .upsert(
          {
            organization_id:
              requireOrganizationId(
                organizationId,
              ),
            ...payload,
          },
          {
            onConflict:
              "organization_id",
          },
        )
        .select(BILLING_SELECT),
    );
  }

  async loadOrganizationWorkspace(
    organizationId,
  ) {
    const organization =
      await this.getOrganization(
        organizationId,
      );

    if (!organization) {
      return null;
    }

    const [
      profile,
      locations,
      departments,
      settings,
      branding,
    ] = await Promise.all([
      this.getOrganizationProfile(
        organizationId,
      ),
      this.getLocations(
        organizationId,
      ),
      this.getDepartments(
        organizationId,
      ),
      this.getSettings(
        organizationId,
      ),
      this.getBranding(
        organizationId,
      ),
    ]);

    let clientProfile =
      null;

    let contractorProfile =
      null;

    if (
      organization.organization_type ===
      "client"
    ) {
      clientProfile =
        await this.getClientProfile(
          organizationId,
        );
    }

    if (
      organization.organization_type ===
      "contractor"
    ) {
      contractorProfile =
        await this.getContractorProfile(
          organizationId,
        );
    }

    return {
      organization,
      profile,
      clientProfile,
      contractorProfile,
      locations,
      departments,
      settings,
      branding,
    };
  }
}

export function createOrganizationRepository() {
  return new OrganizationRepository();
}

export const organizationRepository =
  createOrganizationRepository();
