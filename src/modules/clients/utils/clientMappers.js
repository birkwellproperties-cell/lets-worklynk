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

export function mapClientOrganization(
  record,
) {
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

export function mapClientRelationship(
  record,
) {
  if (!record) {
    return null;
  }

  return {
    id: record.id,
    platformOrganizationId:
      record.platform_organization_id,
    clientOrganizationId:
      record.client_organization_id,
    relationshipNumber:
      record.relationship_number,
    status:
      record.status,
    accountManagerUserId:
      record.account_manager_user_id,
    externalReference:
      record.external_reference,
    notes:
      record.notes,
    startedAt:
      record.started_at,
    pausedAt:
      record.paused_at,
    suspendedAt:
      record.suspended_at,
    terminatedAt:
      record.terminated_at,
    ...mapAuditFields(record),
  };
}

export function mapClientContact(
  record,
) {
  if (!record) {
    return null;
  }

  return {
    id: record.id,
    clientOrganizationId:
      record.client_organization_id,
    contactNumber:
      record.contact_number,
    contactType:
      record.contact_type,
    firstName:
      record.first_name,
    lastName:
      record.last_name,
    jobTitle:
      record.job_title,
    departmentName:
      record.department_name,
    email:
      record.email,
    phone:
      record.phone,
    mobilePhone:
      record.mobile_phone,
    isPrimary:
      record.is_primary,
    isActive:
      record.is_active,
    notes:
      record.notes,
    ...mapAuditFields(record),
  };
}

export function mapClientOnboarding(
  record,
) {
  if (!record) {
    return null;
  }

  return {
    id: record.id,
    clientRelationshipId:
      record.client_relationship_id,
    status:
      record.status,
    currentStep:
      record.current_step,
    completionPercentage:
      record.completion_percentage,
    requestedStartDate:
      record.requested_start_date,
    targetLaunchDate:
      record.target_launch_date,
    completedAt:
      record.completed_at,
    assignedUserId:
      record.assigned_user_id,
    internalNotes:
      record.internal_notes,
    clientNotes:
      record.client_notes,
    ...mapAuditFields(record),
  };
}
