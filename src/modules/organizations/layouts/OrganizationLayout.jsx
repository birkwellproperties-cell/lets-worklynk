import {
  Building2,
} from "lucide-react";

import {
  Outlet,
} from "react-router";

import {
  useOrganization,
} from "../context";

import {
  OrganizationErrorState,
  OrganizationLoadingState,
  OrganizationNavigation,
  OrganizationStatusBadge,
} from "../components";

export default function OrganizationLayout() {
  const {
    initialized,
    loading,
    error,
    organization,
    refresh,
  } = useOrganization();

  if (!initialized || loading) {
    return <OrganizationLoadingState />;
  }

  if (error) {
    return (
      <OrganizationErrorState
        error={error}
        onRetry={() => {
          void refresh();
        }}
      />
    );
  }

  if (!organization) {
    return (
      <OrganizationErrorState
        error={
          new Error(
            "No organization workspace is available.",
          )
        }
      />
    );
  }

  return (
    <section>
      <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Building2 size={27} />
            </span>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="truncate text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                  {organization.displayName}
                </h1>

                <OrganizationStatusBadge
                  status={organization.status}
                />
              </div>

              <p className="mt-2 text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                {organization.organizationType} organization
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
              Organization number
            </p>

            <p className="mt-1 text-lg font-bold text-slate-950">
              #{organization.organizationNumber}
            </p>
          </div>
        </div>

        <div className="mt-7 border-t border-slate-200 pt-6">
          <OrganizationNavigation />
        </div>
      </header>

      <div className="mt-6">
        <Outlet />
      </div>
    </section>
  );
}
