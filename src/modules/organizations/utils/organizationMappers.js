function mapAuditFields(record) {
  return {
    createdAt:
      record?.created_at ?? null,
    createdBy:
      record?.created_by ?? null,
    updatedAt:
      record?.updated_at ?? null,
    updatedBy:
      record?.updated_by ?? null,
    archivedAt:
      record?.archived_at ?? null,
    archivedBy:
      record?.archived_by ?? null,
  };
}

export function mapOrganization(record) {
  if (!record) {
    return null;
  }

  return {
    id: record.id,
    organizationNumber:
      record.organization_number,
    organizationType:
      record.organization_type,
    legalName:
      record.legal_name,
    displayName:
      record.display_name,
    slug:
      record.slug,
    status:
      record.status,
    email:
      record.email,
    phone:
      record.phone,
    websiteUrl:
      record.website_url,
    taxIdLastFour:
      record.tax_id_last_four,
    verifiedAt:
      record.verified_at,
    verifiedBy:
      record.verified_by,
    ...mapAuditFields(record),
  };
}

export function mapOrganizationProfile(
  record,
) {
  if (!record) {
    return null;
  }

  return {
    organizationId:
      record.organization_id,
    profileVisibility:
      record.profile_visibility,
    shortDescription:
      record.short_description,
    fullDescription:
      record.full_description,
    industryCode:
      record.industry_code,
    industryName:
      record.industry_name,
    employeeSizeRange:
      record.employee_size_range,
    yearEstablished:
      record.year_established,
    marketplaceHeadline:
      record.marketplace_headline,
    primaryContactName:
      record.primary_contact_name,
    primaryContactEmail:
      record.primary_contact_email,
    primaryContactPhone:
      record.primary_contact_phone,
    supportEmail:
      record.support_email,
    supportPhone:
      record.support_phone,
    timezone:
      record.timezone,
    locale:
      record.locale,
    currencyCode:
      record.currency_code,
    ...mapAuditFields(record),
  };
}

export function mapClientProfile(
  record,
) {
  if (!record) {
    return null;
  }

  return {
    organizationId:
      record.organization_id,
    procurementEmail:
      record.procurement_email,
    accountsPayableEmail:
      record.accounts_payable_email,
    defaultPaymentTermsDays:
      record.default_payment_terms_days,
    purchaseOrderRequired:
      record.purchase_order_required,
    workerApprovalRequired:
      record.worker_approval_required,
    timesheetApprovalRequired:
      record.timesheet_approval_required,
    allowsDirectContractorContact:
      record.allows_direct_contractor_contact,
    ...mapAuditFields(record),
  };
}

export function mapContractorProfile(
  record,
) {
  if (!record) {
    return null;
  }

  return {
    organizationId:
      record.organization_id,
    businessType:
      record.business_type,
    rateVisibility:
      record.rate_visibility,
    acceptsMarketplaceInvites:
      record.accepts_marketplace_invites,
    acceptsDirectClientInvites:
      record.accepts_direct_client_invites,
    teamDispatchEnabled:
      record.team_dispatch_enabled,
    workersCompensationExempt:
      record.workers_compensation_exempt,
    defaultServiceRadiusMiles:
      record.default_service_radius_miles,
    minimumEngagementHours:
      record.minimum_engagement_hours,
    ...mapAuditFields(record),
  };
}

export function mapLocation(record) {
  if (!record) {
    return null;
  }

  return {
    id: record.id,
    organizationId:
      record.organization_id,
    locationNumber:
      record.location_number,
    name:
      record.name,
    locationType:
      record.location_type,
    status:
      record.status,
    isPrimary:
      record.is_primary,
    email:
      record.email,
    phone:
      record.phone,
    addressLine1:
      record.address_line_1,
    addressLine2:
      record.address_line_2,
    city:
      record.city,
    stateRegion:
      record.state_region,
    postalCode:
      record.postal_code,
    countryCode:
      record.country_code,
    latitude:
      record.latitude,
    longitude:
      record.longitude,
    timezone:
      record.timezone,
    ...mapAuditFields(record),
  };
}

export function mapDepartment(record) {
  if (!record) {
    return null;
  }

  return {
    id: record.id,
    organizationId:
      record.organization_id,
    locationId:
      record.location_id,
    parentDepartmentId:
      record.parent_department_id,
    code:
      record.code,
    name:
      record.name,
    description:
      record.description,
    status:
      record.status,
    ...mapAuditFields(record),
  };
}

export function mapSetting(record) {
  if (!record) {
    return null;
  }

  return {
    id: record.id,
    organizationId:
      record.organization_id,
    settingKey:
      record.setting_key,
    settingValue:
      record.setting_value,
    isSensitive:
      record.is_sensitive,
    ...mapAuditFields(record),
  };
}

export function mapBranding(record) {
  if (!record) {
    return null;
  }

  return {
    organizationId:
      record.organization_id,
    logoPath:
      record.logo_path,
    logoMarkPath:
      record.logo_mark_path,
    coverImagePath:
      record.cover_image_path,
    primaryColor:
      record.primary_color,
    secondaryColor:
      record.secondary_color,
    accentColor:
      record.accent_color,
    displayNameOverride:
      record.display_name_override,
    tagline:
      record.tagline,
    ...mapAuditFields(record),
  };
}

export function mapBillingProfile(
  record,
) {
  if (!record) {
    return null;
  }

  return {
    organizationId:
      record.organization_id,
    billingLegalName:
      record.billing_legal_name,
    billingEmail:
      record.billing_email,
    billingPhone:
      record.billing_phone,
    addressLine1:
      record.address_line_1,
    addressLine2:
      record.address_line_2,
    city:
      record.city,
    stateRegion:
      record.state_region,
    postalCode:
      record.postal_code,
    countryCode:
      record.country_code,
    currencyCode:
      record.currency_code,
    paymentTermsDays:
      record.payment_terms_days,
    invoicePrefix:
      record.invoice_prefix,
    purchaseOrderRequired:
      record.purchase_order_required,
    taxIdLastFour:
      record.tax_id_last_four,
    ...mapAuditFields(record),
  };
}
