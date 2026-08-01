import {
  AlertCircle,
  ArrowLeft,
  Building2,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";

import {
  useEffect,
} from "react";

import {
  Link,
  Outlet,
  useParams,
} from "react-router";

import {
  useClient,
} from "../context";

import {
  getClientInitials,
  getClientName,
  getClientStatusClasses,
} from "../utils";

import {
  ClientWorkspaceNavigation,
} from "../components";

export default function ClientWorkspaceLayout() {
  const {
    relationshipId,
  } = useParams();

  const {
    selectedClientWorkspace,
    workspaceLoading,
    error,
    loadClientWorkspace,
    clearError,
  } = useClient();

  useEffect(() => {
    const timeoutId =
      window.setTimeout(
        () => {
          if (relationshipId) {
            void loadClientWorkspace(
              relationshipId,
            );
          }
        },
        0,
      );

    return () => {
      window.clearTimeout(
        timeoutId,
      );
    };
  }, [
    loadClientWorkspace,
    relationshipId,
  ]);

  if (workspaceLoading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center rounded-3xl border border-slate-200 bg-white">
        <LoaderCircle
          size={30}
          className="animate-spin text-blue-600"
        />
      </div>
    );
  }

  if (
    !workspaceLoading &&
    !selectedClientWorkspace
  ) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <Building2
          size={42}
          className="mx-auto text-slate-300"
        />

        <h1 className="mt-5 text-2xl font-bold text-slate-950">
          Client workspace unavailable
        </h1>

        <p className="mt-3 text-slate-600">
          The client relationship could not be loaded.
        </p>

        <Link
          to="/app/clients"
          className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 font-bold text-white hover:bg-blue-700"
        >
          <ArrowLeft size={17} />
          Back to clients
        </Link>
      </section>
    );
  }

  const relationship =
    selectedClientWorkspace
      .relationship;

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link
              to="/app/clients"
              className="inline-flex items-center gap-2 text-sm font-bold text-blue-700 hover:text-blue-800"
            >
              <ArrowLeft size={16} />
              Client directory
            </Link>

            <div className="mt-5 flex items-start gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-lg font-bold text-white">
                {getClientInitials(
                  selectedClientWorkspace,
                )}
              </span>

              <div className="min-w-0">
                <h1 className="truncate text-3xl font-bold tracking-tight text-slate-950">
                  {getClientName(
                    selectedClientWorkspace,
                  )}
                </h1>

                <p className="mt-1 truncate text-slate-600">
                  {
                    selectedClientWorkspace
                      .organization
                      ?.legalName
                  }
                </p>

                <span
                  className={[
                    "mt-3 inline-flex rounded-full px-3 py-1 text-xs font-bold capitalize",
                    getClientStatusClasses(
                      relationship?.status,
                    ),
                  ].join(" ")}
                >
                  {relationship?.status}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            disabled={workspaceLoading}
            onClick={() => {
              clearError();

              void loadClientWorkspace(
                relationshipId,
              );
            }}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={17} />
            Refresh workspace
          </button>
        </div>

        <ClientWorkspaceNavigation />
      </section>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-900">
          <AlertCircle
            size={20}
            className="mt-0.5 shrink-0"
          />

          <div>
            <p className="font-bold">
              Client workspace error
            </p>

            <p className="mt-1 text-sm">
              {error.message}
            </p>
          </div>
        </div>
      )}

      <Outlet
        context={{
          workspace:
            selectedClientWorkspace,
          relationshipId,
        }}
      />
    </div>
  );
}
