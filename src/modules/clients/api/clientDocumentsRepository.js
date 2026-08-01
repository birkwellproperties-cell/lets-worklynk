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

const DOCUMENT_SELECT = `
  id,
  client_relationship_id,
  client_organization_id,
  document_number,
  document_type,
  title,
  description,
  status,
  is_required,
  effective_date,
  expiration_date,
  current_version_number,
  current_version_id,
  review_notes,
  approved_at,
  approved_by,
  rejected_at,
  rejected_by,
  created_at,
  created_by,
  updated_at,
  updated_by,
  archived_at,
  archived_by
`;

const VERSION_SELECT = `
  id,
  client_document_id,
  version_number,
  storage_bucket,
  storage_path,
  original_file_name,
  stored_file_name,
  mime_type,
  file_size_bytes,
  checksum,
  change_summary,
  uploaded_at,
  uploaded_by,
  created_at,
  created_by
`;

const NOTE_SELECT = `
  id,
  client_document_id,
  note,
  is_internal,
  created_at,
  created_by,
  updated_at,
  updated_by,
  archived_at,
  archived_by
`;

const ACTIVITY_SELECT = `
  id,
  client_document_id,
  activity_type,
  summary,
  metadata,
  actor_user_id,
  occurred_at
`;

export class ClientDocumentsRepository {
  async getDocuments(
    relationshipId,
    {
      includeArchived = false,
    } = {},
  ) {
    const client =
      requireSupabase();

    let query =
      client
        .from("client_documents")
        .select(DOCUMENT_SELECT)
        .eq(
          "client_relationship_id",
          requireIdentifier(
            relationshipId,
            "Client relationship ID",
          ),
        )
        .order(
          "updated_at",
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

  async getDocument(
    documentId,
  ) {
    const client =
      requireSupabase();

    return executeSingle(
      client
        .from("client_documents")
        .select(DOCUMENT_SELECT)
        .eq(
          "id",
          requireIdentifier(
            documentId,
            "Client document ID",
          ),
        ),
    );
  }

  async createDocument(
    payload,
  ) {
    const client =
      requireSupabase();

    return executeRequiredSingle(
      client
        .from("client_documents")
        .insert(payload)
        .select(DOCUMENT_SELECT),
    );
  }

  async updateDocument(
    documentId,
    payload,
  ) {
    const client =
      requireSupabase();

    return executeRequiredSingle(
      client
        .from("client_documents")
        .update(payload)
        .eq(
          "id",
          requireIdentifier(
            documentId,
            "Client document ID",
          ),
        )
        .select(DOCUMENT_SELECT),
    );
  }

  async getVersions(
    documentId,
  ) {
    const client =
      requireSupabase();

    const {
      data,
      error,
    } = await client
      .from(
        "client_document_versions",
      )
      .select(VERSION_SELECT)
      .eq(
        "client_document_id",
        requireIdentifier(
          documentId,
          "Client document ID",
        ),
      )
      .order(
        "version_number",
        {
          ascending: false,
        },
      );

    if (error) {
      throw error;
    }

    return data ?? [];
  }

  async getVersion(
    versionId,
  ) {
    const client =
      requireSupabase();

    return executeSingle(
      client
        .from(
          "client_document_versions",
        )
        .select(VERSION_SELECT)
        .eq(
          "id",
          requireIdentifier(
            versionId,
            "Client document version ID",
          ),
        ),
    );
  }

  async createVersion(
    payload,
  ) {
    const client =
      requireSupabase();

    return executeRequiredSingle(
      client
        .from(
          "client_document_versions",
        )
        .insert(payload)
        .select(VERSION_SELECT),
    );
  }

  async getNotes(
    documentId,
    {
      includeArchived = false,
    } = {},
  ) {
    const client =
      requireSupabase();

    let query =
      client
        .from(
          "client_document_notes",
        )
        .select(NOTE_SELECT)
        .eq(
          "client_document_id",
          requireIdentifier(
            documentId,
            "Client document ID",
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

  async createNote(
    payload,
  ) {
    const client =
      requireSupabase();

    return executeRequiredSingle(
      client
        .from(
          "client_document_notes",
        )
        .insert(payload)
        .select(NOTE_SELECT),
    );
  }

  async updateNote(
    noteId,
    payload,
  ) {
    const client =
      requireSupabase();

    return executeRequiredSingle(
      client
        .from(
          "client_document_notes",
        )
        .update(payload)
        .eq(
          "id",
          requireIdentifier(
            noteId,
            "Client document note ID",
          ),
        )
        .select(NOTE_SELECT),
    );
  }

  async getActivity(
    documentId,
  ) {
    const client =
      requireSupabase();

    const {
      data,
      error,
    } = await client
      .from(
        "client_document_activity",
      )
      .select(ACTIVITY_SELECT)
      .eq(
        "client_document_id",
        requireIdentifier(
          documentId,
          "Client document ID",
        ),
      )
      .order(
        "occurred_at",
        {
          ascending: false,
        },
      );

    if (error) {
      throw error;
    }

    return data ?? [];
  }

  async createActivity(
    payload,
  ) {
    const client =
      requireSupabase();

    return executeRequiredSingle(
      client
        .from(
          "client_document_activity",
        )
        .insert(payload)
        .select(ACTIVITY_SELECT),
    );
  }

  async loadDocumentWorkspace(
    documentId,
  ) {
    const document =
      await this.getDocument(
        documentId,
      );

    if (!document) {
      return null;
    }

    const [
      versions,
      notes,
      activity,
    ] = await Promise.all([
      this.getVersions(
        documentId,
      ),

      this.getNotes(
        documentId,
      ),

      this.getActivity(
        documentId,
      ),
    ]);

    return {
      document,
      versions,
      notes,
      activity,
    };
  }
}

export function createClientDocumentsRepository() {
  return new ClientDocumentsRepository();
}

export const clientDocumentsRepository =
  createClientDocumentsRepository();
