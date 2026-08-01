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

export function mapClientDocument(
  record,
) {
  if (!record) {
    return null;
  }

  return {
    id: record.id,

    clientRelationshipId:
      record.client_relationship_id,

    clientOrganizationId:
      record.client_organization_id,

    documentNumber:
      record.document_number,

    documentType:
      record.document_type,

    title:
      record.title,

    description:
      record.description,

    status:
      record.status,

    isRequired:
      record.is_required,

    effectiveDate:
      record.effective_date,

    expirationDate:
      record.expiration_date,

    currentVersionNumber:
      record.current_version_number,

    currentVersionId:
      record.current_version_id,

    reviewNotes:
      record.review_notes,

    approvedAt:
      record.approved_at,

    approvedBy:
      record.approved_by,

    rejectedAt:
      record.rejected_at,

    rejectedBy:
      record.rejected_by,

    ...mapAuditFields(record),
  };
}

export function mapClientDocumentVersion(
  record,
) {
  if (!record) {
    return null;
  }

  return {
    id: record.id,

    clientDocumentId:
      record.client_document_id,

    versionNumber:
      record.version_number,

    storageBucket:
      record.storage_bucket,

    storagePath:
      record.storage_path,

    originalFileName:
      record.original_file_name,

    storedFileName:
      record.stored_file_name,

    mimeType:
      record.mime_type,

    fileSizeBytes:
      record.file_size_bytes,

    checksum:
      record.checksum,

    changeSummary:
      record.change_summary,

    uploadedAt:
      record.uploaded_at,

    uploadedBy:
      record.uploaded_by,

    createdAt:
      record.created_at,

    createdBy:
      record.created_by,
  };
}

export function mapClientDocumentNote(
  record,
) {
  if (!record) {
    return null;
  }

  return {
    id: record.id,

    clientDocumentId:
      record.client_document_id,

    note:
      record.note,

    isInternal:
      record.is_internal,

    ...mapAuditFields(record),
  };
}

export function mapClientDocumentActivity(
  record,
) {
  if (!record) {
    return null;
  }

  return {
    id: record.id,

    clientDocumentId:
      record.client_document_id,

    activityType:
      record.activity_type,

    summary:
      record.summary,

    metadata:
      record.metadata ?? {},

    actorUserId:
      record.actor_user_id,

    occurredAt:
      record.occurred_at,
  };
}
