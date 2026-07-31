import {
  isSupabaseConfigured,
  supabase,
} from "../supabase";

function requireSupabase() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error(
      "Supabase is not configured. Verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
    );
  }

  return supabase;
}

function normalizeEmail(email) {
  return email
    ?.trim()
    .toLowerCase();
}

function normalizeRedirectUrl(redirectTo) {
  if (redirectTo) {
    return redirectTo;
  }

  if (typeof window === "undefined") {
    return undefined;
  }

  return `${window.location.origin}/reset-password`;
}

export class AuthenticationService {
  async getCurrentSession() {
    const client =
      requireSupabase();

    const {
      data,
      error,
    } = await client.auth.getSession();

    if (error) {
      throw error;
    }

    return data.session ?? null;
  }

  async getCurrentUser() {
    const client =
      requireSupabase();

    const {
      data,
      error,
    } = await client.auth.getUser();

    if (error) {
      throw error;
    }

    return data.user ?? null;
  }

  async signIn({
    email,
    password,
  }) {
    const client =
      requireSupabase();

    const normalizedEmail =
      normalizeEmail(email);

    if (!normalizedEmail) {
      throw new Error(
        "Email address is required.",
      );
    }

    if (!password) {
      throw new Error(
        "Password is required.",
      );
    }

    const {
      data,
      error,
    } = await client.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error) {
      throw error;
    }

    return {
      session: data.session ?? null,
      user: data.user ?? null,
    };
  }

  async signUp({
    email,
    password,
    firstName,
    lastName,
    displayName,
    accountType,
    emailRedirectTo,
  }) {
    const client =
      requireSupabase();

    const normalizedEmail =
      normalizeEmail(email);

    if (!normalizedEmail) {
      throw new Error(
        "Email address is required.",
      );
    }

    if (!password) {
      throw new Error(
        "Password is required.",
      );
    }

    const {
      data,
      error,
    } = await client.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        emailRedirectTo,
        data: {
          first_name:
            firstName?.trim() || null,
          last_name:
            lastName?.trim() || null,
          display_name:
            displayName?.trim() || null,
          account_type:
            accountType || null,
        },
      },
    });

    if (error) {
      throw error;
    }

    return {
      session: data.session ?? null,
      user: data.user ?? null,
    };
  }

  async signOut({
    scope = "local",
  } = {}) {
    const client =
      requireSupabase();

    const {
      error,
    } = await client.auth.signOut({
      scope,
    });

    if (error) {
      throw error;
    }
  }

  async refreshSession() {
    const client =
      requireSupabase();

    const {
      data,
      error,
    } = await client.auth.refreshSession();

    if (error) {
      throw error;
    }

    return data.session ?? null;
  }

  async requestPasswordReset({
    email,
    redirectTo,
  }) {
    const client =
      requireSupabase();

    const normalizedEmail =
      normalizeEmail(email);

    if (!normalizedEmail) {
      throw new Error(
        "Email address is required.",
      );
    }

    const {
      data,
      error,
    } = await client.auth.resetPasswordForEmail(
      normalizedEmail,
      {
        redirectTo:
          normalizeRedirectUrl(
            redirectTo,
          ),
      },
    );

    if (error) {
      throw error;
    }

    return data;
  }

  async updatePassword({
    password,
  }) {
    const client =
      requireSupabase();

    if (!password) {
      throw new Error(
        "A new password is required.",
      );
    }

    const {
      data,
      error,
    } = await client.auth.updateUser({
      password,
    });

    if (error) {
      throw error;
    }

    return data.user ?? null;
  }

  async updateUserMetadata(metadata) {
    const client =
      requireSupabase();

    const {
      data,
      error,
    } = await client.auth.updateUser({
      data: metadata,
    });

    if (error) {
      throw error;
    }

    return data.user ?? null;
  }

  onAuthStateChange(callback) {
    const client =
      requireSupabase();

    if (typeof callback !== "function") {
      throw new TypeError(
        "Authentication state callback must be a function.",
      );
    }

    const {
      data,
    } = client.auth.onAuthStateChange(
      (
        event,
        session,
      ) => {
        callback({
          event,
          session,
          user:
            session?.user ?? null,
        });
      },
    );

    return () => {
      data.subscription.unsubscribe();
    };
  }
}

export function createAuthenticationService() {
  return new AuthenticationService();
}

export const authenticationService =
  createAuthenticationService();
