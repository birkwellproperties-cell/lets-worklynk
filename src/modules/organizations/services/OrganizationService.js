import {
  organizationRepository,
} from "../api";

import {
  mapBillingProfile,
  mapBranding,
  mapClientProfile,
  mapContractorProfile,
  mapDepartment,
  mapLocation,
  mapOrganization,
  mapOrganizationProfile,
  mapSetting,
} from "../utils";

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

function numberOrNull(value) {
  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const normalized =
    Number(value);

  if (
    Number.isNaN(normalized)
  ) {
    throw new Error(
      "A numeric value is invalid.",
    );
  }

  return normalized;
}

function normalizeBoolean(
  value,
  fallback = false,
) {
  if (
    value === null ||
    value === undefined
  ) {
    return fallback;
  }

  return Boolean(value);
}

function normalizeOrganizationPayload(
  payload,
) {
  return {
    legal_name:
      trimOrNull(
        payload.legalName,
      ),
    display_name:
      trimOrNull(
        payload.displayName,
      ),
    email:
      trimOrNull(
        payload.email,
      ),
    phone:
      trimOrNull(
        payload.phone,
      ),
    website_url:
      trimOrNull(
        payload.websiteUrl,
      ),
    tax_id_last_four:
      trimOrNull(
        payload.taxIdLastFour,
      ),
  };
}

export class OrganizationService {
  constructor({
    repository =
      organizationRepository,
  } = {}) {
    this.repository =
      repository;
  }

  async getOrganization(
    organizationId,
  ) {
    return mapOrganization(
      await this.repository
        .getOrganization(
          organizationId,
        ),
    );
  }

  async updateOrganization(
    organizationId,
    payload,
  ) {
    const legalName =
      trimOrNull(
        payload.legalName,
      );

    const displayName =
      trimOrNull(
        payload.displayName,
      );

    if (!legalName) {
      throw new Error(
        "Legal name is required.",
      );
    }

    if (!displayName) {
      throw new Error(
        "Display name is required.",
      );
    }

    return mapOrganization(
      await this.repository
        .updateOrganization(
          organizationId,
          normalizeOrganizationPayload({
            ...payload,
            legalName,
            displayName,
          }),
        ),
    );
  }

  async getProfile(
    organizationId,
  ) {
    return mapOrganizationProfile(
      await this.repository
        .getOrganizationProfile(
          organizationId,
        ),
    );
  }

  async saveProfile(
    organizationId,
    payload,
  ) {
    const record =
      await this.repository
        .upsertOrganizationProfile(
          organizationId,
          {
            profile_visibility:
              payload.profileVisibility ??
              "private",
            short_description:
              trimOrNull(
                payload.shortDescription,
              ),
            full_description:
              trimOrNull(
                payload.fullDescription,
              ),
            industry_code:
              trimOrNull(
                payload.industryCode,
              ),
            industry_name:
              trimOrNull(
                payload.industryName,
              ),
            employee_size_range:
              trimOrNull(
                payload.employeeSizeRange,
              ),
            year_established:
              numberOrNull(
                payload.yearEstablished,
              ),
            marketplace_headline:
              trimOrNull(
                payload.marketplaceHeadline,
              ),
            primary_contact_name:
              trimOrNull(
                payload.primaryContactName,
              ),
            primary_contact_email:
              trimOrNull(
                payload.primaryContactEmail,
              ),
            primary_contact_phone:
              trimOrNull(
                payload.primaryContactPhone,
              ),
            support_email:
              trimOrNull(
                payload.supportEmail,
              ),
            support_phone:
              trimOrNull(
                payload.supportPhone,
              ),
            timezone:
              trimOrNull(
                payload.timezone,
              ) ??
              "America/Chicago",
            locale:
              trimOrNull(
                payload.locale,
              ) ??
              "en-US",
            currency_code:
              trimOrNull(
                payload.currencyCode,
              )?.toUpperCase() ??
              "USD",
          },
        );

    return mapOrganizationProfile(
      record,
    );
  }

  async getClientProfile(
    organizationId,
  ) {
    return mapClientProfile(
      await this.repository
        .getClientProfile(
          organizationId,
        ),
    );
  }

  async saveClientProfile(
    organizationId,
    payload,
  ) {
    return mapClientProfile(
      await this.repository
        .upsertClientProfile(
          organizationId,
          {
            procurement_email:
              trimOrNull(
                payload.procurementEmail,
              ),
            accounts_payable_email:
              trimOrNull(
                payload.accountsPayableEmail,
              ),
            default_payment_terms_days:
              numberOrNull(
                payload.defaultPaymentTermsDays,
              ) ?? 30,
            purchase_order_required:
              normalizeBoolean(
                payload.purchaseOrderRequired,
              ),
            worker_approval_required:
              normalizeBoolean(
                payload.workerApprovalRequired,
                true,
              ),
            timesheet_approval_required:
              normalizeBoolean(
                payload.timesheetApprovalRequired,
                true,
              ),
            allows_direct_contractor_contact:
              normalizeBoolean(
                payload.allowsDirectContractorContact,
                true,
              ),
          },
        ),
    );
  }

  async getContractorProfile(
    organizationId,
  ) {
    return mapContractorProfile(
      await this.repository
        .getContractorProfile(
          organizationId,
        ),
    );
  }

  async saveContractorProfile(
    organizationId,
    payload,
  ) {
    return mapContractorProfile(
      await this.repository
        .upsertContractorProfile(
          organizationId,
          {
            business_type:
              payload.businessType ??
              "individual",
            rate_visibility:
              payload.rateVisibility ??
              "private",
            accepts_marketplace_invites:
              normalizeBoolean(
                payload.acceptsMarketplaceInvites,
                true,
              ),
            accepts_direct_client_invites:
              normalizeBoolean(
                payload.acceptsDirectClientInvites,
                true,
              ),
            team_dispatch_enabled:
              normalizeBoolean(
                payload.teamDispatchEnabled,
              ),
            workers_compensation_exempt:
              normalizeBoolean(
                payload.workersCompensationExempt,
              ),
            default_service_radius_miles:
              numberOrNull(
                payload.defaultServiceRadiusMiles,
              ),
            minimum_engagement_hours:
              numberOrNull(
                payload.minimumEngagementHours,
              ),
          },
        ),
    );
  }

  async getLocations(
    organizationId,
    options,
  ) {
    const records =
      await this.repository
        .getLocations(
          organizationId,
          options,
        );

    return records.map(
      mapLocation,
    );
  }

  async createLocation(
    organizationId,
    payload,
  ) {
    const name =
      trimOrNull(
        payload.name,
      );

    if (!name) {
      throw new Error(
        "Location name is required.",
      );
    }

    return mapLocation(
      await this.repository
        .createLocation({
          organization_id:
            organizationId,
          name,
          location_type:
            payload.locationType ??
            "office",
          status:
            payload.status ??
            "active",
          is_primary:
            normalizeBoolean(
              payload.isPrimary,
            ),
          email:
            trimOrNull(
              payload.email,
            ),
          phone:
            trimOrNull(
              payload.phone,
            ),
          address_line_1:
            trimOrNull(
              payload.addressLine1,
            ),
          address_line_2:
            trimOrNull(
              payload.addressLine2,
            ),
          city:
            trimOrNull(
              payload.city,
            ),
          state_region:
            trimOrNull(
              payload.stateRegion,
            ),
          postal_code:
            trimOrNull(
              payload.postalCode,
            ),
          country_code:
            trimOrNull(
              payload.countryCode,
            )?.toUpperCase() ??
            "US",
          latitude:
            numberOrNull(
              payload.latitude,
            ),
          longitude:
            numberOrNull(
              payload.longitude,
            ),
          timezone:
            trimOrNull(
              payload.timezone,
            ) ??
            "America/Chicago",
        }),
    );
  }

  async updateLocation(
    locationId,
    payload,
  ) {
    return mapLocation(
      await this.repository
        .updateLocation(
          locationId,
          {
            name:
              trimOrNull(
                payload.name,
              ),
            location_type:
              payload.locationType,
            status:
              payload.status,
            is_primary:
              payload.isPrimary,
            email:
              trimOrNull(
                payload.email,
              ),
            phone:
              trimOrNull(
                payload.phone,
              ),
            address_line_1:
              trimOrNull(
                payload.addressLine1,
              ),
            address_line_2:
              trimOrNull(
                payload.addressLine2,
              ),
            city:
              trimOrNull(
                payload.city,
              ),
            state_region:
              trimOrNull(
                payload.stateRegion,
              ),
            postal_code:
              trimOrNull(
                payload.postalCode,
              ),
            country_code:
              trimOrNull(
                payload.countryCode,
              )?.toUpperCase(),
            latitude:
              numberOrNull(
                payload.latitude,
              ),
            longitude:
              numberOrNull(
                payload.longitude,
              ),
            timezone:
              trimOrNull(
                payload.timezone,
              ),
          },
        ),
    );
  }

  async archiveLocation(
    locationId,
    userId,
  ) {
    return mapLocation(
      await this.repository
        .updateLocation(
          locationId,
          {
            status:
              "archived",
            archived_at:
              new Date()
                .toISOString(),
            archived_by:
              userId,
            is_primary:
              false,
          },
        ),
    );
  }

  async getDepartments(
    organizationId,
    options,
  ) {
    const records =
      await this.repository
        .getDepartments(
          organizationId,
          options,
        );

    return records.map(
      mapDepartment,
    );
  }

  async createDepartment(
    organizationId,
    payload,
  ) {
    const name =
      trimOrNull(
        payload.name,
      );

    if (!name) {
      throw new Error(
        "Department name is required.",
      );
    }

    return mapDepartment(
      await this.repository
        .createDepartment({
          organization_id:
            organizationId,
          location_id:
            payload.locationId ??
            null,
          parent_department_id:
            payload.parentDepartmentId ??
            null,
          code:
            trimOrNull(
              payload.code,
            ),
          name,
          description:
            trimOrNull(
              payload.description,
            ),
          status:
            payload.status ??
            "active",
        }),
    );
  }

  async updateDepartment(
    departmentId,
    payload,
  ) {
    return mapDepartment(
      await this.repository
        .updateDepartment(
          departmentId,
          {
            location_id:
              payload.locationId ??
              null,
            parent_department_id:
              payload.parentDepartmentId ??
              null,
            code:
              trimOrNull(
                payload.code,
              ),
            name:
              trimOrNull(
                payload.name,
              ),
            description:
              trimOrNull(
                payload.description,
              ),
            status:
              payload.status,
          },
        ),
    );
  }

  async archiveDepartment(
    departmentId,
    userId,
  ) {
    return mapDepartment(
      await this.repository
        .updateDepartment(
          departmentId,
          {
            status:
              "archived",
            archived_at:
              new Date()
                .toISOString(),
            archived_by:
              userId,
          },
        ),
    );
  }

  async getSettings(
    organizationId,
  ) {
    const records =
      await this.repository
        .getSettings(
          organizationId,
        );

    return records.map(
      mapSetting,
    );
  }

  async saveSetting(
    organizationId,
    settingKey,
    settingValue,
    {
      isSensitive = false,
    } = {},
  ) {
    return mapSetting(
      await this.repository
        .upsertSetting(
          organizationId,
          settingKey,
          {
            setting_value:
              settingValue ?? {},
            is_sensitive:
              isSensitive,
          },
        ),
    );
  }

  async deleteSetting(
    organizationId,
    settingKey,
  ) {
    await this.repository
      .deleteSetting(
        organizationId,
        settingKey,
      );
  }

  async getBranding(
    organizationId,
  ) {
    return mapBranding(
      await this.repository
        .getBranding(
          organizationId,
        ),
    );
  }

  async saveBranding(
    organizationId,
    payload,
  ) {
    return mapBranding(
      await this.repository
        .upsertBranding(
          organizationId,
          {
            logo_path:
              trimOrNull(
                payload.logoPath,
              ),
            logo_mark_path:
              trimOrNull(
                payload.logoMarkPath,
              ),
            cover_image_path:
              trimOrNull(
                payload.coverImagePath,
              ),
            primary_color:
              trimOrNull(
                payload.primaryColor,
              ),
            secondary_color:
              trimOrNull(
                payload.secondaryColor,
              ),
            accent_color:
              trimOrNull(
                payload.accentColor,
              ),
            display_name_override:
              trimOrNull(
                payload.displayNameOverride,
              ),
            tagline:
              trimOrNull(
                payload.tagline,
              ),
          },
        ),
    );
  }

  async getBillingProfile(
    organizationId,
  ) {
    return mapBillingProfile(
      await this.repository
        .getBillingProfile(
          organizationId,
        ),
    );
  }

  async saveBillingProfile(
    organizationId,
    payload,
  ) {
    return mapBillingProfile(
      await this.repository
        .upsertBillingProfile(
          organizationId,
          {
            billing_legal_name:
              trimOrNull(
                payload.billingLegalName,
              ),
            billing_email:
              trimOrNull(
                payload.billingEmail,
              ),
            billing_phone:
              trimOrNull(
                payload.billingPhone,
              ),
            address_line_1:
              trimOrNull(
                payload.addressLine1,
              ),
            address_line_2:
              trimOrNull(
                payload.addressLine2,
              ),
            city:
              trimOrNull(
                payload.city,
              ),
            state_region:
              trimOrNull(
                payload.stateRegion,
              ),
            postal_code:
              trimOrNull(
                payload.postalCode,
              ),
            country_code:
              trimOrNull(
                payload.countryCode,
              )?.toUpperCase() ??
              "US",
            currency_code:
              trimOrNull(
                payload.currencyCode,
              )?.toUpperCase() ??
              "USD",
            payment_terms_days:
              numberOrNull(
                payload.paymentTermsDays,
              ) ?? 30,
            invoice_prefix:
              trimOrNull(
                payload.invoicePrefix,
              ),
            purchase_order_required:
              normalizeBoolean(
                payload.purchaseOrderRequired,
              ),
            tax_id_last_four:
              trimOrNull(
                payload.taxIdLastFour,
              ),
          },
        ),
    );
  }

  async loadWorkspace(
    organizationId,
  ) {
    const workspace =
      await this.repository
        .loadOrganizationWorkspace(
          organizationId,
        );

    if (!workspace) {
      return null;
    }

    return {
      organization:
        mapOrganization(
          workspace.organization,
        ),
      profile:
        mapOrganizationProfile(
          workspace.profile,
        ),
      clientProfile:
        mapClientProfile(
          workspace.clientProfile,
        ),
      contractorProfile:
        mapContractorProfile(
          workspace.contractorProfile,
        ),
      locations:
        workspace.locations.map(
          mapLocation,
        ),
      departments:
        workspace.departments.map(
          mapDepartment,
        ),
      settings:
        workspace.settings.map(
          mapSetting,
        ),
      branding:
        mapBranding(
          workspace.branding,
        ),
    };
  }
}

export function createOrganizationService(
  options,
) {
  return new OrganizationService(
    options,
  );
}

export const organizationService =
  createOrganizationService();
