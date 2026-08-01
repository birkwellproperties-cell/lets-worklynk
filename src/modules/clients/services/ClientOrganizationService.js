import {
  clientContactsRepository,
  clientOnboardingRepository,
  clientOrganizationsRepository,
} from "../api";

import {
  mapClientContact,
  mapClientOnboarding,
  mapClientOrganization,
  mapClientRelationship,
} from "../utils";

import {
  mapClientProfile,
  mapOrganizationProfile,
} from "../../organizations/utils";

const RELATIONSHIP_STATUSES =
  new Set([
    "prospect",
    "onboarding",
    "active",
    "paused",
    "suspended",
    "terminated",
    "archived",
  ]);

const ONBOARDING_STATUSES =
  new Set([
    "not_started",
    "in_progress",
    "awaiting_client",
    "awaiting_platform",
    "completed",
    "cancelled",
  ]);

const CONTACT_TYPES =
  new Set([
    "primary",
    "operations",
    "procurement",
    "accounts_payable",
    "human_resources",
    "compliance",
    "scheduling",
    "executive",
    "other",
  ]);

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

function requireText(
  value,
  label,
) {
  const normalized =
    trimOrNull(value);

  if (!normalized) {
    throw new Error(
      `${label} is required.`,
    );
  }

  return normalized;
}

function normalizeEmail(value) {
  const normalized =
    trimOrNull(value);

  if (!normalized) {
    return null;
  }

  const email =
    normalized.toLowerCase();

  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      email,
    )
  ) {
    throw new Error(
      `Invalid email address: ${normalized}`,
    );
  }

  return email;
}

function normalizePhone(value) {
  return trimOrNull(value);
}

function normalizeSlug(value) {
  const normalized =
    requireText(
      value,
      "Organization slug",
    )
      .toLowerCase()
      .replace(
        /[^a-z0-9]+/g,
        "-",
      )
      .replace(
        /^-+|-+$/g,
        "",
      );

  if (!normalized) {
    throw new Error(
      "Organization slug is invalid.",
    );
  }

  return normalized;
}

function normalizeInteger(
  value,
  {
    label,
    minimum = null,
    maximum = null,
    defaultValue = null,
  },
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return defaultValue;
  }

  const normalized =
    Number(value);

  if (
    !Number.isInteger(
      normalized,
    )
  ) {
    throw new Error(
      `${label} must be a whole number.`,
    );
  }

  if (
    minimum !== null &&
    normalized < minimum
  ) {
    throw new Error(
      `${label} must be at least ${minimum}.`,
    );
  }

  if (
    maximum !== null &&
    normalized > maximum
  ) {
    throw new Error(
      `${label} cannot exceed ${maximum}.`,
    );
  }

  return normalized;
}

function normalizeBoolean(
  value,
  defaultValue = false,
) {
  if (
    value === null ||
    value === undefined
  ) {
    return defaultValue;
  }

  return Boolean(value);
}

function normalizeDate(value) {
  return trimOrNull(value);
}

function normalizeSearch(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function clientMatchesSearch(
  client,
  search,
) {
  if (!search) {
    return true;
  }

  const searchableValues = [
    client.organization
      ?.displayName,
    client.organization
      ?.legalName,
    client.organization
      ?.email,
    client.organization
      ?.phone,
    client.organization
      ?.slug,
    client.relationship
      ?.externalReference,
    client.organizationProfile
      ?.industryName,
    client.organizationProfile
      ?.primaryContactName,
  ];

  return searchableValues.some(
    (value) =>
      String(value ?? "")
        .toLowerCase()
        .includes(search),
  );
}

function buildRelationshipStatusPayload(
  status,
) {
  const now =
    new Date().toISOString();

  return {
    status,

    started_at:
      status === "active"
        ? now
        : undefined,

    paused_at:
      status === "paused"
        ? now
        : null,

    suspended_at:
      status === "suspended"
        ? now
        : null,

    terminated_at:
      status === "terminated"
        ? now
        : null,

    archived_at:
      status === "archived"
        ? now
        : null,
  };
}

function removeUndefinedValues(
  payload,
) {
  return Object.fromEntries(
    Object.entries(payload).filter(
      ([, value]) =>
        value !== undefined,
    ),
  );
}

export class ClientOrganizationService {
  constructor({
    organizationsRepository =
      clientOrganizationsRepository,

    contactsRepository =
      clientContactsRepository,

    onboardingRepository =
      clientOnboardingRepository,
  } = {}) {
    this.organizationsRepository =
      organizationsRepository;

    this.contactsRepository =
      contactsRepository;

    this.onboardingRepository =
      onboardingRepository;
  }

  async getClientDirectory(
    platformOrganizationId,
    {
      search = "",
      status = "all",
      includeArchived = false,
    } = {},
  ) {
    requireIdentifier(
      platformOrganizationId,
      "Platform organization ID",
    );

    const relationships =
      await this
        .organizationsRepository
        .getClientRelationships(
          platformOrganizationId,
          {
            includeArchived,
          },
        );

    const clients =
      await Promise.all(
        relationships.map(
          async (relationshipRecord) => {
            const workspace =
              await this
                .organizationsRepository
                .loadClientWorkspace(
                  platformOrganizationId,
                  relationshipRecord.id,
                );

            if (!workspace) {
              return null;
            }

            return {
              relationship:
                mapClientRelationship(
                  workspace.relationship,
                ),

              organization:
                mapClientOrganization(
                  workspace.organization,
                ),

              organizationProfile:
                mapOrganizationProfile(
                  workspace
                    .organizationProfile,
                ),

              clientProfile:
                mapClientProfile(
                  workspace.clientProfile,
                ),
            };
          },
        ),
      );

    const normalizedSearch =
      normalizeSearch(search);

    return clients
      .filter(Boolean)
      .filter(
        (client) => {
          const matchesStatus =
            status === "all" ||
            client.relationship
              ?.status === status;

          return (
            matchesStatus &&
            clientMatchesSearch(
              client,
              normalizedSearch,
            )
          );
        },
      );
  }

  async getClientWorkspace(
    platformOrganizationId,
    relationshipId,
  ) {
    requireIdentifier(
      platformOrganizationId,
      "Platform organization ID",
    );

    requireIdentifier(
      relationshipId,
      "Client relationship ID",
    );

    const workspace =
      await this
        .organizationsRepository
        .loadClientWorkspace(
          platformOrganizationId,
          relationshipId,
        );

    if (!workspace) {
      return null;
    }

    const [
      contacts,
      onboarding,
    ] = await Promise.all([
      this.contactsRepository
        .getContacts(
          workspace.relationship
            .client_organization_id,
        ),

      this.onboardingRepository
        .getOnboardingRecord(
          relationshipId,
        ),
    ]);

    return {
      relationship:
        mapClientRelationship(
          workspace.relationship,
        ),

      organization:
        mapClientOrganization(
          workspace.organization,
        ),

      organizationProfile:
        mapOrganizationProfile(
          workspace
            .organizationProfile,
        ),

      clientProfile:
        mapClientProfile(
          workspace.clientProfile,
        ),

      contacts:
        contacts
          .map(mapClientContact)
          .filter(Boolean),

      onboarding:
        mapClientOnboarding(
          onboarding,
        ),
    };
  }

  async createClient(
    platformOrganizationId,
    payload,
  ) {
    requireIdentifier(
      platformOrganizationId,
      "Platform organization ID",
    );

    const legalName =
      requireText(
        payload.legalName,
        "Legal name",
      );

    const displayName =
      trimOrNull(
        payload.displayName,
      ) ?? legalName;

    const organization =
      await this
        .organizationsRepository
        .createClientOrganization({
          legal_name:
            legalName,

          display_name:
            displayName,

          slug:
            normalizeSlug(
              payload.slug ??
              displayName,
            ),

          status:
            payload.organizationStatus ??
            "pending",

          email:
            normalizeEmail(
              payload.email,
            ),

          phone:
            normalizePhone(
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
        });

    const organizationId =
      organization.id;

    const [
      organizationProfile,
      clientProfile,
    ] = await Promise.all([
      this.organizationsRepository
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
              normalizeInteger(
                payload.yearEstablished,
                {
                  label:
                    "Year established",
                  minimum: 1800,
                  maximum: 2200,
                },
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
              normalizeEmail(
                payload.primaryContactEmail,
              ),

            primary_contact_phone:
              normalizePhone(
                payload.primaryContactPhone,
              ),

            support_email:
              normalizeEmail(
                payload.supportEmail,
              ),

            support_phone:
              normalizePhone(
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
              (
                trimOrNull(
                  payload.currencyCode,
                ) ??
                "USD"
              ).toUpperCase(),
          },
        ),

      this.organizationsRepository
        .upsertClientProfile(
          organizationId,
          {
            procurement_email:
              normalizeEmail(
                payload.procurementEmail,
              ),

            accounts_payable_email:
              normalizeEmail(
                payload.accountsPayableEmail,
              ),

            default_payment_terms_days:
              normalizeInteger(
                payload.defaultPaymentTermsDays,
                {
                  label:
                    "Payment terms",
                  minimum: 0,
                  maximum: 365,
                  defaultValue: 30,
                },
              ),

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
                payload
                  .allowsDirectContractorContact,
                true,
              ),
          },
        ),
    ]);

    const relationship =
      await this
        .organizationsRepository
        .createClientRelationship({
          platform_organization_id:
            platformOrganizationId,

          client_organization_id:
            organizationId,

          status:
            payload.relationshipStatus ??
            "prospect",

          account_manager_user_id:
            payload.accountManagerUserId ??
            null,

          external_reference:
            trimOrNull(
              payload.externalReference,
            ),

          notes:
            trimOrNull(
              payload.relationshipNotes,
            ),
        });

    const onboarding =
      await this
        .onboardingRepository
        .upsertOnboardingRecord(
          relationship.id,
          {
            status:
              payload.onboardingStatus ??
              "not_started",

            current_step:
              trimOrNull(
                payload.currentOnboardingStep,
              ),

            completion_percentage:
              normalizeInteger(
                payload.completionPercentage,
                {
                  label:
                    "Completion percentage",
                  minimum: 0,
                  maximum: 100,
                  defaultValue: 0,
                },
              ),

            requested_start_date:
              normalizeDate(
                payload.requestedStartDate,
              ),

            target_launch_date:
              normalizeDate(
                payload.targetLaunchDate,
              ),

            assigned_user_id:
              payload.assignedUserId ??
              null,

            internal_notes:
              trimOrNull(
                payload.internalNotes,
              ),

            client_notes:
              trimOrNull(
                payload.clientNotes,
              ),
          },
        );

    return {
      organization:
        mapClientOrganization(
          organization,
        ),

      organizationProfile:
        mapOrganizationProfile(
          organizationProfile,
        ),

      clientProfile:
        mapClientProfile(
          clientProfile,
        ),

      relationship:
        mapClientRelationship(
          relationship,
        ),

      onboarding:
        mapClientOnboarding(
          onboarding,
        ),
    };
  }

  async updateClientOrganization(
    clientOrganizationId,
    payload,
  ) {
    requireIdentifier(
      clientOrganizationId,
      "Client organization ID",
    );

    return mapClientOrganization(
      await this
        .organizationsRepository
        .updateClientOrganization(
          clientOrganizationId,
          removeUndefinedValues({
            legal_name:
              payload.legalName ===
              undefined
                ? undefined
                : requireText(
                    payload.legalName,
                    "Legal name",
                  ),

            display_name:
              payload.displayName ===
              undefined
                ? undefined
                : requireText(
                    payload.displayName,
                    "Display name",
                  ),

            slug:
              payload.slug ===
              undefined
                ? undefined
                : normalizeSlug(
                    payload.slug,
                  ),

            status:
              payload.status,

            email:
              payload.email ===
              undefined
                ? undefined
                : normalizeEmail(
                    payload.email,
                  ),

            phone:
              payload.phone ===
              undefined
                ? undefined
                : normalizePhone(
                    payload.phone,
                  ),

            website_url:
              payload.websiteUrl ===
              undefined
                ? undefined
                : trimOrNull(
                    payload.websiteUrl,
                  ),
          }),
        ),
    );
  }

  async updateOrganizationProfile(
    clientOrganizationId,
    payload,
  ) {
    requireIdentifier(
      clientOrganizationId,
      "Client organization ID",
    );

    return mapOrganizationProfile(
      await this
        .organizationsRepository
        .upsertOrganizationProfile(
          clientOrganizationId,
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
              normalizeInteger(
                payload.yearEstablished,
                {
                  label:
                    "Year established",
                  minimum: 1800,
                  maximum: 2200,
                },
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
              normalizeEmail(
                payload.primaryContactEmail,
              ),

            primary_contact_phone:
              normalizePhone(
                payload.primaryContactPhone,
              ),

            support_email:
              normalizeEmail(
                payload.supportEmail,
              ),

            support_phone:
              normalizePhone(
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
              (
                trimOrNull(
                  payload.currencyCode,
                ) ??
                "USD"
              ).toUpperCase(),
          },
        ),
    );
  }

  async updateClientProfile(
    clientOrganizationId,
    payload,
  ) {
    requireIdentifier(
      clientOrganizationId,
      "Client organization ID",
    );

    return mapClientProfile(
      await this
        .organizationsRepository
        .upsertClientProfile(
          clientOrganizationId,
          {
            procurement_email:
              normalizeEmail(
                payload.procurementEmail,
              ),

            accounts_payable_email:
              normalizeEmail(
                payload.accountsPayableEmail,
              ),

            default_payment_terms_days:
              normalizeInteger(
                payload.defaultPaymentTermsDays,
                {
                  label:
                    "Payment terms",
                  minimum: 0,
                  maximum: 365,
                  defaultValue: 30,
                },
              ),

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
                payload
                  .allowsDirectContractorContact,
                true,
              ),
          },
        ),
    );
  }

  async updateClientProfileWorkspace(
    clientOrganizationId,
    payload,
  ) {
    requireIdentifier(
      clientOrganizationId,
      "Client organization ID",
    );

    const [
      organization,
      organizationProfile,
      clientProfile,
    ] = await Promise.all([
      this.updateClientOrganization(
        clientOrganizationId,
        payload.organization ??
        {},
      ),

      this.updateOrganizationProfile(
        clientOrganizationId,
        payload.organizationProfile ??
        {},
      ),

      this.updateClientProfile(
        clientOrganizationId,
        payload.clientProfile ??
        {},
      ),
    ]);

    return {
      organization,
      organizationProfile,
      clientProfile,
    };
  }
  async updateRelationship(
    relationshipId,
    payload,
  ) {
    requireIdentifier(
      relationshipId,
      "Client relationship ID",
    );

    return mapClientRelationship(
      await this
        .organizationsRepository
        .updateClientRelationship(
          relationshipId,
          removeUndefinedValues({
            account_manager_user_id:
              payload
                .accountManagerUserId,

            external_reference:
              payload.externalReference ===
              undefined
                ? undefined
                : trimOrNull(
                    payload.externalReference,
                  ),

            notes:
              payload.notes ===
              undefined
                ? undefined
                : trimOrNull(
                    payload.notes,
                  ),
          }),
        ),
    );
  }

  async changeRelationshipStatus(
    relationshipId,
    status,
  ) {
    requireIdentifier(
      relationshipId,
      "Client relationship ID",
    );

    if (
      !RELATIONSHIP_STATUSES.has(
        status,
      )
    ) {
      throw new Error(
        "Client relationship status is invalid.",
      );
    }

    return mapClientRelationship(
      await this
        .organizationsRepository
        .updateClientRelationship(
          relationshipId,
          removeUndefinedValues(
            buildRelationshipStatusPayload(
              status,
            ),
          ),
        ),
    );
  }

  async getContacts(
    clientOrganizationId,
    options,
  ) {
    requireIdentifier(
      clientOrganizationId,
      "Client organization ID",
    );

    const contacts =
      await this.contactsRepository
        .getContacts(
          clientOrganizationId,
          options,
        );

    return contacts
      .map(mapClientContact)
      .filter(Boolean);
  }

  async createContact(
    clientOrganizationId,
    payload,
  ) {
    requireIdentifier(
      clientOrganizationId,
      "Client organization ID",
    );

    const contactType =
      payload.contactType ??
      "other";

    if (
      !CONTACT_TYPES.has(
        contactType,
      )
    ) {
      throw new Error(
        "Client contact type is invalid.",
      );
    }

    return mapClientContact(
      await this.contactsRepository
        .createContact({
          client_organization_id:
            clientOrganizationId,

          contact_type:
            contactType,

          first_name:
            requireText(
              payload.firstName,
              "First name",
            ),

          last_name:
            requireText(
              payload.lastName,
              "Last name",
            ),

          job_title:
            trimOrNull(
              payload.jobTitle,
            ),

          department_name:
            trimOrNull(
              payload.departmentName,
            ),

          email:
            normalizeEmail(
              payload.email,
            ),

          phone:
            normalizePhone(
              payload.phone,
            ),

          mobile_phone:
            normalizePhone(
              payload.mobilePhone,
            ),

          is_primary:
            normalizeBoolean(
              payload.isPrimary,
            ),

          is_active:
            normalizeBoolean(
              payload.isActive,
              true,
            ),

          notes:
            trimOrNull(
              payload.notes,
            ),
        }),
    );
  }

  async updateContact(
    contactId,
    payload,
  ) {
    requireIdentifier(
      contactId,
      "Client contact ID",
    );

    if (
      payload.contactType !==
        undefined &&
      !CONTACT_TYPES.has(
        payload.contactType,
      )
    ) {
      throw new Error(
        "Client contact type is invalid.",
      );
    }

    return mapClientContact(
      await this.contactsRepository
        .updateContact(
          contactId,
          removeUndefinedValues({
            contact_type:
              payload.contactType,

            first_name:
              payload.firstName ===
              undefined
                ? undefined
                : requireText(
                    payload.firstName,
                    "First name",
                  ),

            last_name:
              payload.lastName ===
              undefined
                ? undefined
                : requireText(
                    payload.lastName,
                    "Last name",
                  ),

            job_title:
              payload.jobTitle ===
              undefined
                ? undefined
                : trimOrNull(
                    payload.jobTitle,
                  ),

            department_name:
              payload.departmentName ===
              undefined
                ? undefined
                : trimOrNull(
                    payload.departmentName,
                  ),

            email:
              payload.email ===
              undefined
                ? undefined
                : normalizeEmail(
                    payload.email,
                  ),

            phone:
              payload.phone ===
              undefined
                ? undefined
                : normalizePhone(
                    payload.phone,
                  ),

            mobile_phone:
              payload.mobilePhone ===
              undefined
                ? undefined
                : normalizePhone(
                    payload.mobilePhone,
                  ),

            is_primary:
              payload.isPrimary,

            is_active:
              payload.isActive,

            notes:
              payload.notes ===
              undefined
                ? undefined
                : trimOrNull(
                    payload.notes,
                  ),
          }),
        ),
    );
  }

  async archiveContact(
    contactId,
    actorId,
  ) {
    requireIdentifier(
      contactId,
      "Client contact ID",
    );

    return mapClientContact(
      await this.contactsRepository
        .archiveContact(
          contactId,
          actorId,
        ),
    );
  }

  async restoreContact(
    contactId,
  ) {
    requireIdentifier(
      contactId,
      "Client contact ID",
    );

    return mapClientContact(
      await this.contactsRepository
        .restoreContact(
          contactId,
        ),
    );
  }

  async saveOnboarding(
    relationshipId,
    payload,
  ) {
    requireIdentifier(
      relationshipId,
      "Client relationship ID",
    );

    const status =
      payload.status ??
      "not_started";

    if (
      !ONBOARDING_STATUSES.has(
        status,
      )
    ) {
      throw new Error(
        "Client onboarding status is invalid.",
      );
    }

    let completionPercentage =
      normalizeInteger(
        payload.completionPercentage,
        {
          label:
            "Completion percentage",
          minimum: 0,
          maximum: 100,
          defaultValue: 0,
        },
      );

    let completedAt =
      null;

    if (status === "completed") {
      completionPercentage = 100;

      completedAt =
        payload.completedAt ??
        new Date().toISOString();
    }

    return mapClientOnboarding(
      await this
        .onboardingRepository
        .upsertOnboardingRecord(
          relationshipId,
          {
            status,

            current_step:
              trimOrNull(
                payload.currentStep,
              ),

            completion_percentage:
              completionPercentage,

            requested_start_date:
              normalizeDate(
                payload.requestedStartDate,
              ),

            target_launch_date:
              normalizeDate(
                payload.targetLaunchDate,
              ),

            completed_at:
              completedAt,

            assigned_user_id:
              payload.assignedUserId ??
              null,

            internal_notes:
              trimOrNull(
                payload.internalNotes,
              ),

            client_notes:
              trimOrNull(
                payload.clientNotes,
              ),
          },
        ),
    );
  }
}

export function createClientOrganizationService(
  options,
) {
  return new ClientOrganizationService(
    options,
  );
}

export const clientOrganizationService =
  createClientOrganizationService();
