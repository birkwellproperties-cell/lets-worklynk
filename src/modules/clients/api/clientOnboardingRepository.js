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

const ONBOARDING_SELECT = `
  id,
  client_relationship_id,
  status,
  current_step,
  completion_percentage,
  requested_start_date,
  target_launch_date,
  completed_at,
  assigned_user_id,
  internal_notes,
  client_notes,
  created_at,
  created_by,
  updated_at,
  updated_by
`;

export class ClientOnboardingRepository {
  async getOnboardingRecord(
    relationshipId,
  ) {
    const client =
      requireSupabase();

    return executeSingle(
      client
        .from(
          "client_onboarding_records",
        )
        .select(ONBOARDING_SELECT)
        .eq(
          "client_relationship_id",
          requireIdentifier(
            relationshipId,
            "Client relationship ID",
          ),
        ),
    );
  }

  async upsertOnboardingRecord(
    relationshipId,
    payload,
  ) {
    const client =
      requireSupabase();

    return executeRequiredSingle(
      client
        .from(
          "client_onboarding_records",
        )
        .upsert(
          {
            client_relationship_id:
              requireIdentifier(
                relationshipId,
                "Client relationship ID",
              ),
            ...payload,
          },
          {
            onConflict:
              "client_relationship_id",
          },
        )
        .select(ONBOARDING_SELECT),
    );
  }

  async deleteOnboardingRecord(
    relationshipId,
  ) {
    const client =
      requireSupabase();

    const {
      error,
    } = await client
      .from(
        "client_onboarding_records",
      )
      .delete()
      .eq(
        "client_relationship_id",
        requireIdentifier(
          relationshipId,
          "Client relationship ID",
        ),
      );

    if (error) {
      throw error;
    }
  }
}

export function createClientOnboardingRepository() {
  return new ClientOnboardingRepository();
}

export const clientOnboardingRepository =
  createClientOnboardingRepository();
