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

function mapPermission(record) {
  if (!record) {
    return null;
  }

  return {
    id:
      record.id,

    code:
      record.code,

    module:
      record.module,

    action:
      record.action,

    description:
      record.description,

    createdAt:
      record.created_at ??
      null,

    updatedAt:
      record.updated_at ??
      null,
  };
}

export async function getOrganizationPermissions() {
  const client =
    requireSupabase();

  const {
    data,
    error,
  } = await client
    .from("permissions")
    .select(`
      id,
      code,
      module,
      action,
      description,
      created_at,
      updated_at
    `)
    .order(
      "module",
      {
        ascending: true,
      },
    )
    .order(
      "action",
      {
        ascending: true,
      },
    )
    .order(
      "code",
      {
        ascending: true,
      },
    );

  if (error) {
    throw error;
  }

  return (
    Array.isArray(data)
      ? data
      : []
  )
    .map(mapPermission)
    .filter(Boolean);
}