import {
  Building2,
  LogOut,
  ShieldCheck,
} from "lucide-react";

import {
  useAuth,
} from "../../platform/auth";

import {
  BrandLogo,
} from "../../shared/branding";

export default function AppShell() {
  const {
    profile,
    organization,
    roles,
    permissions,
    isPlatformAdministrator,
    signOut,
  } = useAuth();

  async function handleSignOut() {
    await signOut();
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-5 px-6">
          <BrandLogo />

          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            <LogOut size={17} />
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-12">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-600">
          Identity platform
        </p>

        <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950">
          Welcome to Let&apos;s WorkLynk
        </h1>

        <p className="mt-4 max-w-2xl leading-7 text-slate-600">
          Your authenticated identity, organization membership,
          roles, and permissions were resolved successfully.
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <ShieldCheck
              size={24}
              className="text-blue-600"
            />

            <h2 className="mt-4 font-bold text-slate-950">
              Signed-in user
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              {profile?.display_name ||
                profile?.email ||
                "Authenticated user"}
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <Building2
              size={24}
              className="text-blue-600"
            />

            <h2 className="mt-4 font-bold text-slate-950">
              Active organization
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              {organization?.displayName ||
                organization?.legalName ||
                (
                  isPlatformAdministrator
                    ? "Platform administration"
                    : "No organization"
                )}
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <ShieldCheck
              size={24}
              className="text-blue-600"
            />

            <h2 className="mt-4 font-bold text-slate-950">
              Authorization
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              {isPlatformAdministrator
                ? "Platform administrator"
                : `${roles.length} role(s), ${permissions.length} permission(s)`}
            </p>
          </article>
        </div>
      </main>
    </div>
  );
}
