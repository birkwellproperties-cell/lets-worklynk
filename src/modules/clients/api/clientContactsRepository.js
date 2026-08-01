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

const CONTACT_SELECT = `
  id,
  client_organization_id,
  contact_number,
  contact_type,
  first_name,
  last_name,
  job_title,
  department_name,
  email,
  phone,
  mobile_phone,
  is_primary,
  is_active,
  notes,
  created_at,
  created_by,
  updated_at,
  updated_by,
  archived_at,
  archived_by
`;

export class ClientContactsRepository {
  async getContacts(
    clientOrganizationId,
    {
      includeArchived = false,
    } = {},
  ) {
    const client =
      requireSupabase();

    let query =
      client
        .from("client_contacts")
        .select(CONTACT_SELECT)
        .eq(
          "client_organization_id",
          requireIdentifier(
            clientOrganizationId,
            "Client organization ID",
          ),
        )
        .order(
          "is_primary",
          {
            ascending: false,
          },
        )
        .order(
          "last_name",
          {
            ascending: true,
          },
        )
        .order(
          "first_name",
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

  async createContact(
    payload,
  ) {
    const client =
      requireSupabase();

    return executeRequiredSingle(
      client
        .from("client_contacts")
        .insert(payload)
        .select(CONTACT_SELECT),
    );
  }

  async updateContact(
    contactId,
    payload,
  ) {
    const client =
      requireSupabase();

    return executeRequiredSingle(
      client
        .from("client_contacts")
        .update(payload)
        .eq(
          "id",
          requireIdentifier(
            contactId,
            "Client contact ID",
          ),
        )
        .select(CONTACT_SELECT),
    );
  }

  async archiveContact(
    contactId,
    actorId,
  ) {
    return this.updateContact(
      contactId,
      {
        is_active: false,
        is_primary: false,
        archived_at:
          new Date().toISOString(),
        archived_by:
          actorId ?? null,
      },
    );
  }

  async restoreContact(
    contactId,
  ) {
    return this.updateContact(
      contactId,
      {
        is_active: true,
        archived_at: null,
        archived_by: null,
      },
    );
  }
}

export function createClientContactsRepository() {
  return new ClientContactsRepository();
}

export const clientContactsRepository =
  createClientContactsRepository();
