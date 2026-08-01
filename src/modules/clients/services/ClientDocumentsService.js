import {
  clientDocumentsRepository,
} from "../api";

import {
  clientDocumentStorage,
} from "./ClientDocumentStorage";

import {
  mapClientDocument,
  mapClientDocumentActivity,
  mapClientDocumentNote,
  mapClientDocumentVersion,
} from "../utils";

const DOCUMENT_TYPES =
  new Set([
    "master_service_agreement",
    "business_associate_agreement",
    "non_disclosure_agreement",
    "certificate_of_insurance",
    "w9",
    "ach_authorization",
    "rate_agreement",
    "facility_requirements",
    "orientation_packet",
    "compliance_document",
    "vendor_packet",
    "other",
  ]);

const DOCUMENT_STATUSES =
  new Set([
    "draft",
    "uploaded",
    "under_review",
    "approved",
    "rejected",
    "expired",
    "archived",
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

  return normalized ||
    null;
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

function removeUndefinedValues(
  payload,
) {
  return Object.fromEntries(
    Object.entries(payload)
      .filter(
        ([, value]) =>
          value !== undefined,
      ),
  );
}

function mapWorkspace(
  workspace,
) {
  if (!workspace) {
    return null;
  }

  return {
    document:
      mapClientDocument(
        workspace.document,
      ),

    versions:
      workspace.versions
        .map(
          mapClientDocumentVersion,
        )
        .filter(Boolean),

    notes:
      workspace.notes
        .map(
          mapClientDocumentNote,
        )
        .filter(Boolean),

    activity:
      workspace.activity
        .map(
          mapClientDocumentActivity,
        )
        .filter(Boolean),
  };
}

export class ClientDocumentsService {
  constructor({
    repository =
      clientDocumentsRepository,

    storage =
      clientDocumentStorage,
  } = {}) {
    this.repository =
      repository;

    this.storage =
      storage;
  }

  async getDocuments(
    relationshipId,
    options,
  ) {
    requireIdentifier(
      relationshipId,
      "Client relationship ID",
    );

    const records =
      await this.repository
        .getDocuments(
          relationshipId,
          options,
        );

    return records
      .map(
        mapClientDocument,
      )
      .filter(Boolean);
  }

  async getDocumentWorkspace(
    documentId,
  ) {
    requireIdentifier(
      documentId,
      "Client document ID",
    );

    return mapWorkspace(
      await this.repository
        .loadDocumentWorkspace(
          documentId,
        ),
    );
  }

  async createDocument({
    relationshipId,
    clientOrganizationId,
    payload,
    file = null,
    actorUserId = null,
  }) {
    requireIdentifier(
      relationshipId,
      "Client relationship ID",
    );

    requireIdentifier(
      clientOrganizationId,
      "Client organization ID",
    );

    const documentType =
      payload.documentType ??
      "other";

    if (
      !DOCUMENT_TYPES.has(
        documentType,
      )
    ) {
      throw new Error(
        "Client document type is invalid.",
      );
    }

    const document =
      await this.repository
        .createDocument({
          client_relationship_id:
            relationshipId,

          client_organization_id:
            clientOrganizationId,

          document_type:
            documentType,

          title:
            requireText(
              payload.title,
              "Document title",
            ),

          description:
            trimOrNull(
              payload.description,
            ),

          status:
            file
              ? "draft"
              : payload.status ??
                "draft",

          is_required:
            normalizeBoolean(
              payload.isRequired,
            ),

          effective_date:
            trimOrNull(
              payload.effectiveDate,
            ),

          expiration_date:
            trimOrNull(
              payload.expirationDate,
            ),

          review_notes:
            trimOrNull(
              payload.reviewNotes,
            ),

          created_by:
            actorUserId,
        });

    if (!file) {
      return {
        document:
          mapClientDocument(
            document,
          ),

        version: null,
      };
    }

    try {
      const version =
        await this.uploadVersion({
          relationshipId,
          documentId:
            document.id,

          file,

          changeSummary:
            payload.changeSummary ??
            "Initial upload.",

          actorUserId,
        });

      return {
        document:
          mapClientDocument(
            await this.repository
              .getDocument(
                document.id,
              ),
          ),

        version,
      };
    } catch (error) {
      await this.repository
        .updateDocument(
          document.id,
          {
            status:
              "archived",

            archived_at:
              new Date()
                .toISOString(),

            archived_by:
              actorUserId,
          },
        );

      throw error;
    }
  }

  async uploadVersion({
    relationshipId,
    documentId,
    file,
    changeSummary = null,
    actorUserId = null,
  }) {
    requireIdentifier(
      relationshipId,
      "Client relationship ID",
    );

    requireIdentifier(
      documentId,
      "Client document ID",
    );

    const document =
      await this.repository
        .getDocument(
          documentId,
        );

    if (!document) {
      throw new Error(
        "Client document was not found.",
      );
    }

    if (
      document.client_relationship_id !==
      relationshipId
    ) {
      throw new Error(
        "Client document does not belong to this relationship.",
      );
    }

    const nextVersionNumber =
      Number(
        document.current_version_number ??
        0,
      ) + 1;

    const uploaded =
      await this.storage
        .uploadVersion({
          relationshipId,
          documentId,
          versionNumber:
            nextVersionNumber,
          file,
        });

    try {
      const version =
        await this.repository
          .createVersion({
            client_document_id:
              documentId,

            version_number:
              nextVersionNumber,

            storage_bucket:
              uploaded.bucket,

            storage_path:
              uploaded.path,

            original_file_name:
              uploaded.originalFileName,

            stored_file_name:
              uploaded.storedFileName,

            mime_type:
              uploaded.mimeType,

            file_size_bytes:
              uploaded.fileSizeBytes,

            checksum:
              null,

            change_summary:
              trimOrNull(
                changeSummary,
              ),

            uploaded_by:
              actorUserId,

            created_by:
              actorUserId,
          });

      return mapClientDocumentVersion(
        version,
      );
    } catch (error) {
      await this.storage
        .removeObject(
          uploaded.path,
        );

      throw error;
    }
  }

  async updateDocument(
    documentId,
    payload,
  ) {
    requireIdentifier(
      documentId,
      "Client document ID",
    );

    if (
      payload.documentType !==
        undefined &&
      !DOCUMENT_TYPES.has(
        payload.documentType,
      )
    ) {
      throw new Error(
        "Client document type is invalid.",
      );
    }

    if (
      payload.status !==
        undefined &&
      !DOCUMENT_STATUSES.has(
        payload.status,
      )
    ) {
      throw new Error(
        "Client document status is invalid.",
      );
    }

    return mapClientDocument(
      await this.repository
        .updateDocument(
          documentId,
          removeUndefinedValues({
            document_type:
              payload.documentType,

            title:
              payload.title ===
              undefined
                ? undefined
                : requireText(
                    payload.title,
                    "Document title",
                  ),

            description:
              payload.description ===
              undefined
                ? undefined
                : trimOrNull(
                    payload.description,
                  ),

            status:
              payload.status,

            is_required:
              payload.isRequired,

            effective_date:
              payload.effectiveDate ===
              undefined
                ? undefined
                : trimOrNull(
                    payload.effectiveDate,
                  ),

            expiration_date:
              payload.expirationDate ===
              undefined
                ? undefined
                : trimOrNull(
                    payload.expirationDate,
                  ),

            review_notes:
              payload.reviewNotes ===
              undefined
                ? undefined
                : trimOrNull(
                    payload.reviewNotes,
                  ),

            approved_by:
              payload.approvedBy,

            rejected_by:
              payload.rejectedBy,
          }),
        ),
    );
  }

  async submitForReview(
    documentId,
  ) {
    return this.updateDocument(
      documentId,
      {
        status:
          "under_review",
      },
    );
  }

  async approveDocument(
    documentId,
    actorUserId,
    reviewNotes = null,
  ) {
    return this.updateDocument(
      documentId,
      {
        status:
          "approved",

        approvedBy:
          actorUserId,

        reviewNotes,
      },
    );
  }

  async rejectDocument(
    documentId,
    actorUserId,
    reviewNotes,
  ) {
    return this.updateDocument(
      documentId,
      {
        status:
          "rejected",

        rejectedBy:
          actorUserId,

        reviewNotes:
          requireText(
            reviewNotes,
            "Rejection notes",
          ),
      },
    );
  }

  async archiveDocument(
    documentId,
    actorUserId,
  ) {
    return mapClientDocument(
      await this.repository
        .updateDocument(
          documentId,
          {
            status:
              "archived",

            archived_at:
              new Date()
                .toISOString(),

            archived_by:
              actorUserId,
          },
        ),
    );
  }

  async restoreDocument(
    documentId,
  ) {
    const document =
      await this.repository
        .getDocument(
          documentId,
        );

    if (!document) {
      throw new Error(
        "Client document was not found.",
      );
    }

    return mapClientDocument(
      await this.repository
        .updateDocument(
          documentId,
          {
            status:
              document.current_version_number > 0
                ? "uploaded"
                : "draft",

            archived_at:
              null,

            archived_by:
              null,
          },
        ),
    );
  }

  async addNote(
    documentId,
    payload,
    actorUserId = null,
  ) {
    requireIdentifier(
      documentId,
      "Client document ID",
    );

    return mapClientDocumentNote(
      await this.repository
        .createNote({
          client_document_id:
            documentId,

          note:
            requireText(
              payload.note,
              "Document note",
            ),

          is_internal:
            normalizeBoolean(
              payload.isInternal,
              true,
            ),

          created_by:
            actorUserId,
        }),
    );
  }

  async archiveNote(
    noteId,
    actorUserId,
  ) {
    requireIdentifier(
      noteId,
      "Client document note ID",
    );

    return mapClientDocumentNote(
      await this.repository
        .updateNote(
          noteId,
          {
            archived_at:
              new Date()
                .toISOString(),

            archived_by:
              actorUserId,
          },
        ),
    );
  }

  async createSignedUrl(
    versionId,
    expiresInSeconds = 300,
  ) {
    const version =
      await this.repository
        .getVersion(
          requireIdentifier(
            versionId,
            "Client document version ID",
          ),
        );

    if (!version) {
      throw new Error(
        "Client document version was not found.",
      );
    }

    return this.storage
      .createSignedUrl(
        version.storage_path,
        expiresInSeconds,
      );
  }

  async downloadVersion(
    versionId,
  ) {
    const version =
      await this.repository
        .getVersion(
          requireIdentifier(
            versionId,
            "Client document version ID",
          ),
        );

    if (!version) {
      throw new Error(
        "Client document version was not found.",
      );
    }

    return {
      fileName:
        version.original_file_name,

      mimeType:
        version.mime_type,

      blob:
        await this.storage
          .download(
            version.storage_path,
          ),
    };
  }
}

export function createClientDocumentsService(
  options,
) {
  return new ClientDocumentsService(
    options,
  );
}

export const clientDocumentsService =
  createClientDocumentsService();
