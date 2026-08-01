import {
  AlertCircle,
  Building2,
  CalendarClock,
  CheckCircle2,
  CirclePause,
  CirclePlay,
  ClipboardCheck,
  LoaderCircle,
  Mail,
  Phone,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  UserRound,
  Users,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
} from "react-router";

import {
  useAuth,
} from "../../../platform/auth";

import {
  useClient,
} from "../context";

const RELATIONSHIP_STATUS_OPTIONS = [
  {
    value: "all",
    label: "All statuses",
  },
  {
    value: "prospect",
    label: "Prospect",
  },
  {
    value: "onboarding",
    label: "Onboarding",
  },
  {
    value: "active",
    label: "Active",
  },
  {
    value: "paused",
    label: "Paused",
  },
  {
    value: "suspended",
    label: "Suspended",
  },
  {
    value: "terminated",
    label: "Terminated",
  },
];

const EMPTY_CLIENT_FORM = {
  legalName: "",
  displayName: "",
  slug: "",
  email: "",
  phone: "",
  websiteUrl: "",

  industryName: "",
  shortDescription: "",
  primaryContactName: "",
  primaryContactEmail: "",
  primaryContactPhone: "",

  procurementEmail: "",
  accountsPayableEmail: "",
  defaultPaymentTermsDays: "30",

  purchaseOrderRequired: false,
  workerApprovalRequired: true,
  timesheetApprovalRequired: true,
  allowsDirectContractorContact: true,

  relationshipStatus: "prospect",
  externalReference: "",
  relationshipNotes: "",

  onboardingStatus: "not_started",
  currentOnboardingStep: "",
  completionPercentage: "0",
  targetLaunchDate: "",
};

function normalizeSearch(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function getClientName(client) {
  return (
    client?.organization?.displayName ||
    client?.organization?.legalName ||
    "Client organization"
  );
}

function getInitials(client) {
  return getClientName(client)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(
      (part) =>
        part.slice(0, 1),
    )
    .join("")
    .toUpperCase();
}

function formatDate(value) {
  if (!value) {
    return "Not recorded";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat(
    "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    },
  ).format(date);
}

function getStatusClasses(status) {
  switch (status) {
    case "active":
      return "bg-emerald-50 text-emerald-700";

    case "onboarding":
      return "bg-blue-50 text-blue-700";

    case "prospect":
      return "bg-violet-50 text-violet-700";

    case "paused":
      return "bg-amber-50 text-amber-700";

    case "suspended":
      return "bg-orange-50 text-orange-700";

    case "terminated":
      return "bg-red-50 text-red-700";

    case "archived":
      return "bg-slate-100 text-slate-600";

    default:
      return "bg-slate-100 text-slate-600";
  }
}

function createSlug(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(
      /[^a-z0-9]+/g,
      "-",
    )
    .replace(
      /^-+|-+$/g,
      "",
    );
}

export default function ClientDirectoryPage() {
  const {
    hasPermission,
    isPlatformAdministrator,
  } = useAuth();

  const {
    clients,
    selectedClient,
    selectedClientWorkspace,
    filters,
    loading,
    workspaceLoading,
    saving,
    error,
    refreshClients,
    selectClient,
    createClient,
    changeRelationshipStatus,
    setFilters,
    clearError,
  } = useClient();


  const [
    createDialogOpen,
    setCreateDialogOpen,
  ] = useState(false);

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");


  useEffect(() => {
    const timeoutId =
      window.setTimeout(
        () => {
          void refreshClients();
        },
        0,
      );

    return () => {
      window.clearTimeout(
        timeoutId,
      );
    };
  }, [
    refreshClients,
  ]);

  const canCreateClients =
    isPlatformAdministrator ||
    hasPermission(
      "clients.create",
    ) ||
    hasPermission(
      "clients.manage",
    );

  const canUpdateClients =
    isPlatformAdministrator ||
    hasPermission(
      "clients.update",
    ) ||
    hasPermission(
      "clients.manage",
    );

  const filteredClients =
    useMemo(
      () => {
        const search =
          normalizeSearch(
            filters.search,
          );

        return clients.filter(
          (client) => {
            const relationship =
              client.relationship;

            const organization =
              client.organization;

            const profile =
              client.organizationProfile;

            const searchableValues = [
              organization?.displayName,
              organization?.legalName,
              organization?.email,
              organization?.phone,
              organization?.slug,
              relationship
                ?.externalReference,
              profile?.industryName,
              profile
                ?.primaryContactName,
            ];

            const matchesSearch =
              !search ||
              searchableValues.some(
                (value) =>
                  String(value ?? "")
                    .toLowerCase()
                    .includes(search),
              );

            const matchesStatus =
              filters.status === "all" ||
              relationship?.status ===
                filters.status;

            return (
              matchesSearch &&
              matchesStatus
            );
          },
        );
      },
      [
        clients,
        filters.search,
        filters.status,
      ],
    );

  const metrics =
    useMemo(
      () => ({
        total:
          clients.length,

        active:
          clients.filter(
            (client) =>
              client.relationship
                ?.status ===
              "active",
          ).length,

        onboarding:
          clients.filter(
            (client) =>
              client.relationship
                ?.status ===
              "onboarding",
          ).length,

        prospects:
          clients.filter(
            (client) =>
              client.relationship
                ?.status ===
              "prospect",
          ).length,
      }),
      [
        clients,
      ],
    );

  async function runAction(
    operation,
    success,
  ) {
    clearError();
    setSuccessMessage("");

    try {
      const result =
        await operation();

      setSuccessMessage(
        success,
      );

      return result;
    } catch {
      return null;
    }
  }

  async function handleStatusChange(
    status,
  ) {
    const relationshipId =
      selectedClient
        ?.relationship
        ?.id;

    if (!relationshipId) {
      return;
    }

    const confirmed =
      window.confirm(
        `Change ${getClientName(selectedClient)} to ${status}?`,
      );

    if (!confirmed) {
      return;
    }

    await runAction(
      async () => {
        await changeRelationshipStatus(
          relationshipId,
          status,
        );

        await selectClient(
          relationshipId,
        );
      },
      `${getClientName(selectedClient)} is now ${status}.`,
    );
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-600">
            Client management
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            Client organizations
          </h1>

          <p className="mt-3 max-w-3xl leading-7 text-slate-600">
            Manage client relationships, onboarding progress,
            operating contacts, approval preferences, and account
            lifecycle.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              void refreshClients();
            }}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            {loading ? (
              <LoaderCircle
                size={18}
                className="animate-spin"
              />
            ) : (
              <RefreshCw size={18} />
            )}

            Refresh
          </button>

          {canCreateClients && (
            <button
              type="button"
              onClick={() => {
                clearError();
                setSuccessMessage("");
                setCreateDialogOpen(true);
              }}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 font-bold text-white shadow-sm transition hover:bg-blue-700"
            >
              <Plus size={18} />
              New client
            </button>
          )}
        </div>
      </section>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-900">
          <AlertCircle
            size={20}
            className="mt-0.5 shrink-0"
          />

          <div>
            <p className="font-bold">
              Client operation failed
            </p>

            <p className="mt-1 text-sm leading-6">
              {error.message}
            </p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
          <CheckCircle2
            size={20}
            className="mt-0.5 shrink-0"
          />

          <p className="font-semibold">
            {successMessage}
          </p>
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Building2}
          label="Total clients"
          value={metrics.total}
        />

        <MetricCard
          icon={CheckCircle2}
          label="Active clients"
          value={metrics.active}
        />

        <MetricCard
          icon={ClipboardCheck}
          label="Onboarding"
          value={metrics.onboarding}
        />

        <MetricCard
          icon={Users}
          label="Prospects"
          value={metrics.prospects}
        />
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_250px]">
          <label className="flex min-h-12 items-center gap-3 rounded-xl border border-slate-300 px-4 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100">
            <Search
              size={18}
              className="shrink-0 text-slate-400"
            />

            <input
              type="search"
              value={filters.search}
              onChange={(event) => {
                setFilters({
                  search:
                    event.target.value,
                });
              }}
              placeholder="Search clients by name, email, industry, or reference..."
              className="w-full border-0 bg-transparent py-3 outline-none"
            />
          </label>

          <select
            value={filters.status}
            onChange={(event) => {
              setFilters({
                status:
                  event.target.value,
              });
            }}
            className={inputClassName}
          >
            {RELATIONSHIP_STATUS_OPTIONS.map(
              (option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ),
            )}
          </select>
        </div>
      </section>

      <section className="grid min-h-[600px] gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <header className="border-b border-slate-200 bg-slate-50 px-6 py-4">
            <p className="text-sm font-bold text-slate-700">
              {filteredClients.length} client
              {filteredClients.length === 1
                ? ""
                : "s"}
            </p>
          </header>

          {loading ? (
            <LoadingState />
          ) : filteredClients.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="divide-y divide-slate-200">
              {filteredClients.map(
                (client) => (
                  <ClientListItem
                    key={
                      client.relationship
                        .id
                    }
                    client={client}
                    selected={
                      selectedClient
                        ?.relationship
                        ?.id ===
                      client.relationship
                        .id
                    }
                    onSelect={() => {
                      void selectClient(
                        client.relationship
                          .id,
                      );
                    }}
                  />
                ),
              )}
            </div>
          )}
        </div>

        <ClientDetailsPanel
          client={selectedClient}
          workspace={
            selectedClientWorkspace
          }
          loading={
            workspaceLoading
          }
          saving={saving}
          canUpdate={
            canUpdateClients
          }
          onActivate={() => {
            void handleStatusChange(
              "active",
            );
          }}
          onBeginOnboarding={() => {
            void handleStatusChange(
              "onboarding",
            );
          }}
          onPause={() => {
            void handleStatusChange(
              "paused",
            );
          }}
          onSuspend={() => {
            void handleStatusChange(
              "suspended",
            );
          }}
          onTerminate={() => {
            void handleStatusChange(
              "terminated",
            );
          }}
        />
      </section>

      {createDialogOpen && (
        <CreateClientDialog
          saving={saving}
          onClose={() => {
            setCreateDialogOpen(false);
          }}
          onCreate={(payload) => {
            void runAction(
              async () => {
                const result =
                  await createClient(
                    payload,
                  );

                const relationshipId =
                  result
                    ?.relationship
                    ?.id;

                if (relationshipId) {
                  await refreshClients({
                    silent: true,
                  });

                  await selectClient(
                    relationshipId,
                  );
                }

                setCreateDialogOpen(
                  false,
                );
              },
              "Client organization created successfully.",
            );
          }}
        />
      )}
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <Icon
        size={23}
        className="text-blue-600"
      />

      <p className="mt-5 text-sm font-semibold text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-3xl font-bold text-slate-950">
        {value}
      </p>
    </article>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-80 items-center justify-center">
      <LoaderCircle
        size={30}
        className="animate-spin text-blue-600"
      />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="p-12 text-center">
      <Building2
        size={38}
        className="mx-auto text-slate-300"
      />

      <h2 className="mt-5 text-xl font-bold text-slate-950">
        No clients found
      </h2>

      <p className="mt-2 leading-7 text-slate-600">
        Create the first client organization or adjust the active
        search and filters.
      </p>
    </div>
  );
}

function ClientListItem({
  client,
  selected,
  onSelect,
}) {
  const organization =
    client.organization;

  const relationship =
    client.relationship;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        "flex w-full items-start gap-4 px-5 py-5 text-left transition",
        selected
          ? "bg-blue-50"
          : "hover:bg-slate-50",
      ].join(" ")}
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">
        {getInitials(client)}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="truncate font-bold text-slate-950">
            {getClientName(client)}
          </span>

          <span
            className={[
              "rounded-full px-2.5 py-1 text-xs font-bold capitalize",
              getStatusClasses(
                relationship.status,
              ),
            ].join(" ")}
          >
            {relationship.status}
          </span>
        </span>

        <span className="mt-1 block truncate text-sm text-slate-600">
          {organization?.email ||
            "No primary email"}
        </span>

        <span className="mt-2 block text-xs font-semibold text-slate-500">
          Client #
          {organization
            ?.organizationNumber ?? "-"}
          {" - "}
          Relationship #
          {relationship
              ?.relationshipNumber ??
              "-"}
        </span>
      </span>
    </button>
  );
}

function ClientDetailsPanel({
  client,
  workspace,
  loading,
  saving,
  canUpdate,
  onActivate,
  onBeginOnboarding,
  onPause,
  onSuspend,
  onTerminate,
}) {
  if (!client) {
    return (
      <section className="flex min-h-80 items-center justify-center rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <div>
          <Building2
            size={40}
            className="mx-auto text-slate-300"
          />

          <h2 className="mt-5 text-xl font-bold text-slate-950">
            Select a client
          </h2>

          <p className="mt-2 leading-7 text-slate-600">
            Choose a client organization to review account,
            onboarding, contacts, and operating preferences.
          </p>
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="flex min-h-80 items-center justify-center rounded-3xl border border-slate-200 bg-white shadow-sm">
        <LoaderCircle
          size={30}
          className="animate-spin text-blue-600"
        />
      </section>
    );
  }

  const organization =
    workspace?.organization ??
    client.organization;

  const relationship =
    workspace?.relationship ??
    client.relationship;

  const organizationProfile =
    workspace
      ?.organizationProfile ??
    client.organizationProfile;

  const clientProfile =
    workspace?.clientProfile ??
    client.clientProfile;

  const onboarding =
    workspace?.onboarding ??
    null;

  const contacts =
    workspace?.contacts ??
    [];

  const primaryContact =
    contacts.find(
      (contact) =>
        contact.isPrimary,
    ) ??
    contacts[0] ??
    null;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-5 border-b border-slate-200 pb-7 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-lg font-bold text-white">
            {getInitials(client)}
          </span>

          <div className="min-w-0">
            <h2 className="truncate text-2xl font-bold text-slate-950">
              {organization
                ?.displayName}
            </h2>

            <p className="mt-1 truncate text-slate-600">
              {organization
                ?.legalName}
            </p>

            <span
              className={[
                "mt-3 inline-flex rounded-full px-3 py-1 text-xs font-bold capitalize",
                getStatusClasses(
                  relationship?.status,
                ),
              ].join(" ")}
            >
              {relationship?.status}
            </span>
          </div>
        </div>

        <div className="text-left sm:text-right">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
            Relationship
          </p>

          <p className="mt-1 font-bold text-slate-950">
            #
            {relationship
              ?.relationshipNumber ??
              "-"}
          </p>
        </div>
      </div>

      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        <DetailItem
          icon={Mail}
          label="Email"
          value={
            organization?.email ||
            "Not provided"
          }
        />

        <DetailItem
          icon={Phone}
          label="Phone"
          value={
            organization?.phone ||
            "Not provided"
          }
        />

        <DetailItem
          icon={Building2}
          label="Industry"
          value={
            organizationProfile
              ?.industryName ||
            "Not specified"
          }
        />

        <DetailItem
          icon={CalendarClock}
          label="Relationship created"
          value={formatDate(
            relationship
              ?.createdAt,
          )}
        />
      </div>

      <div className="mt-8 border-t border-slate-200 pt-7">
        <h3 className="font-bold text-slate-950">
          Onboarding
        </h3>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-bold capitalize text-slate-950">
                {onboarding
                  ?.status
                  ?.replaceAll(
                    "_",
                    " ",
                  ) ||
                  "Not started"}
              </p>

              <p className="mt-1 text-sm text-slate-600">
                {onboarding
                  ?.currentStep ||
                  "No current onboarding step."}
              </p>
            </div>

            <span className="text-lg font-bold text-blue-700">
              {onboarding
                ?.completionPercentage ??
                0}
              %
            </span>
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-blue-600 transition-all"
              style={{
                width: `${
                  onboarding
                    ?.completionPercentage ??
                  0
                }%`,
              }}
            />
          </div>

          <p className="mt-4 text-sm text-slate-500">
            Target launch:{" "}
            <span className="font-semibold text-slate-700">
              {formatDate(
                onboarding
                  ?.targetLaunchDate,
              )}
            </span>
          </p>
        </div>
      </div>

      <div className="mt-8 border-t border-slate-200 pt-7">
        <h3 className="font-bold text-slate-950">
          Primary contact
        </h3>

        {primaryContact ? (
          <div className="mt-4 rounded-2xl border border-slate-200 p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <UserRound size={20} />
              </span>

              <div>
                <p className="font-bold text-slate-950">
                  {primaryContact
                    .firstName}
                  {" "}
                  {primaryContact
                    .lastName}
                </p>

                <p className="mt-1 text-sm text-slate-600">
                  {primaryContact
                    .jobTitle ||
                    primaryContact
                      .contactType}
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  {primaryContact
                    .email ||
                    primaryContact
                      .phone ||
                    "No contact details"}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">
            No client contacts have been added.
          </p>
        )}
      </div>

      <div className="mt-8 border-t border-slate-200 pt-7">
        <h3 className="font-bold text-slate-950">
          Operating preferences
        </h3>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <BooleanItem
            label="Purchase order required"
            value={
              clientProfile
                ?.purchaseOrderRequired
            }
          />

          <BooleanItem
            label="Worker approval required"
            value={
              clientProfile
                ?.workerApprovalRequired
            }
          />

          <BooleanItem
            label="Timesheet approval required"
            value={
              clientProfile
                ?.timesheetApprovalRequired
            }
          />

          <BooleanItem
            label="Direct contractor contact"
            value={
              clientProfile
                ?.allowsDirectContractorContact
            }
          />
        </div>
      </div>

      <div className="mt-8 border-t border-slate-200 pt-7">
        <Link
          to={`/app/clients/${relationship.id}`}
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-700"
        >
          Open client workspace
        </Link>
      </div>

      {canUpdate && (
        <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-200 pt-7">
          {relationship.status ===
            "prospect" && (
            <ActionButton
              icon={ClipboardCheck}
              label="Begin onboarding"
              disabled={saving}
              onClick={
                onBeginOnboarding
              }
            />
          )}

          {relationship.status !==
            "active" && (
            <ActionButton
              icon={CirclePlay}
              label="Activate"
              disabled={saving}
              onClick={onActivate}
            />
          )}

          {relationship.status ===
            "active" && (
            <ActionButton
              icon={CirclePause}
              label="Pause"
              disabled={saving}
              onClick={onPause}
              variant="warning"
            />
          )}

          {![
            "suspended",
            "terminated",
          ].includes(
            relationship.status,
          ) && (
            <ActionButton
              icon={ShieldAlert}
              label="Suspend"
              disabled={saving}
              onClick={onSuspend}
              variant="warning"
            />
          )}

          {relationship.status !==
            "terminated" && (
            <ActionButton
              icon={X}
              label="Terminate"
              disabled={saving}
              onClick={onTerminate}
              variant="danger"
            />
          )}
        </div>
      )}
    </section>
  );
}

function DetailItem({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-slate-500">
        <Icon size={16} />

        <p className="text-xs font-bold uppercase tracking-[0.1em]">
          {label}
        </p>
      </div>

      <p className="mt-2 break-words font-semibold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function BooleanItem({
  label,
  value,
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 p-4">
      <span className="text-sm font-semibold text-slate-700">
        {label}
      </span>

      <span
        className={[
          "rounded-full px-2.5 py-1 text-xs font-bold",
          value
            ? "bg-emerald-50 text-emerald-700"
            : "bg-slate-200 text-slate-600",
        ].join(" ")}
      >
        {value
          ? "Yes"
          : "No"}
      </span>
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  disabled,
  onClick,
  variant = "primary",
}) {
  const classes = {
    primary:
      "bg-blue-600 text-white hover:bg-blue-700",

    warning:
      "border border-amber-300 bg-white text-amber-800 hover:bg-amber-50",

    danger:
      "border border-red-300 bg-white text-red-700 hover:bg-red-50",
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={[
        "inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50",
        classes[variant],
      ].join(" ")}
    >
      <Icon size={16} />
      {label}
    </button>
  );
}

function CreateClientDialog({
  saving,
  onClose,
  onCreate,
}) {
  const [
    form,
    setForm,
  ] = useState(
    EMPTY_CLIENT_FORM,
  );

  const [
    validationError,
    setValidationError,
  ] = useState("");

  function updateField(
    field,
    value,
  ) {
    setForm(
      (current) => ({
        ...current,
        [field]: value,
      }),
    );
  }

  function handleDisplayNameChange(
    value,
  ) {
    setForm(
      (current) => ({
        ...current,
        displayName:
          value,

        slug:
          current.slug
            ? current.slug
            : createSlug(value),
      }),
    );
  }

  function handleSubmit() {
    setValidationError("");

    if (!form.legalName.trim()) {
      setValidationError(
        "Legal name is required.",
      );

      return;
    }

    if (!form.displayName.trim()) {
      setValidationError(
        "Display name is required.",
      );

      return;
    }

    if (!form.slug.trim()) {
      setValidationError(
        "Organization slug is required.",
      );

      return;
    }

    onCreate({
      ...form,

      defaultPaymentTermsDays:
        Number(
          form
            .defaultPaymentTermsDays,
        ),

      completionPercentage:
        Number(
          form
            .completionPercentage,
        ),

      targetLaunchDate:
        form.targetLaunchDate ||
        null,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-8">
      <button
        type="button"
        aria-label="Close new client dialog"
        onClick={onClose}
        className="absolute inset-0"
      />

      <section className="relative z-10 max-h-full w-full max-w-4xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <header className="sticky top-0 z-10 flex items-start justify-between gap-5 border-b border-slate-200 bg-white px-6 py-5 sm:px-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-950">
              Create client organization
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              Create the organization, client profile, relationship,
              and onboarding record.
            </p>
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            <X size={19} />
          </button>
        </header>

        <div className="space-y-8 p-6 sm:p-8">
          {validationError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
              {validationError}
            </div>
          )}

          <FormSection
            title="Organization identity"
            description="Basic legal and marketplace-facing information."
          >
            <div className="grid gap-5 md:grid-cols-2">
              <TextField
                label="Legal name"
                value={form.legalName}
                required
                onChange={(value) => {
                  updateField(
                    "legalName",
                    value,
                  );
                }}
              />

              <TextField
                label="Display name"
                value={form.displayName}
                required
                onChange={
                  handleDisplayNameChange
                }
              />

              <TextField
                label="Organization slug"
                value={form.slug}
                required
                onChange={(value) => {
                  updateField(
                    "slug",
                    createSlug(value),
                  );
                }}
              />

              <TextField
                label="Industry"
                value={form.industryName}
                onChange={(value) => {
                  updateField(
                    "industryName",
                    value,
                  );
                }}
              />

              <TextField
                label="Primary email"
                type="email"
                value={form.email}
                onChange={(value) => {
                  updateField(
                    "email",
                    value,
                  );
                }}
              />

              <TextField
                label="Primary phone"
                value={form.phone}
                onChange={(value) => {
                  updateField(
                    "phone",
                    value,
                  );
                }}
              />

              <TextField
                label="Website"
                value={form.websiteUrl}
                onChange={(value) => {
                  updateField(
                    "websiteUrl",
                    value,
                  );
                }}
              />

              <TextField
                label="External reference"
                value={
                  form.externalReference
                }
                onChange={(value) => {
                  updateField(
                    "externalReference",
                    value,
                  );
                }}
              />
            </div>

            <label className="mt-5 block">
              <span className="text-sm font-semibold text-slate-700">
                Short description
              </span>

              <textarea
                rows={3}
                value={
                  form.shortDescription
                }
                onChange={(event) => {
                  updateField(
                    "shortDescription",
                    event.target.value,
                  );
                }}
                className={[
                  inputClassName,
                  "mt-2 py-3",
                ].join(" ")}
              />
            </label>
          </FormSection>

          <FormSection
            title="Primary client contact"
            description="Contact information included in the organization profile."
          >
            <div className="grid gap-5 md:grid-cols-3">
              <TextField
                label="Contact name"
                value={
                  form.primaryContactName
                }
                onChange={(value) => {
                  updateField(
                    "primaryContactName",
                    value,
                  );
                }}
              />

              <TextField
                label="Contact email"
                type="email"
                value={
                  form.primaryContactEmail
                }
                onChange={(value) => {
                  updateField(
                    "primaryContactEmail",
                    value,
                  );
                }}
              />

              <TextField
                label="Contact phone"
                value={
                  form.primaryContactPhone
                }
                onChange={(value) => {
                  updateField(
                    "primaryContactPhone",
                    value,
                  );
                }}
              />
            </div>
          </FormSection>

          <FormSection
            title="Billing and approvals"
            description="Default client purchasing and approval preferences."
          >
            <div className="grid gap-5 md:grid-cols-3">
              <TextField
                label="Procurement email"
                type="email"
                value={
                  form.procurementEmail
                }
                onChange={(value) => {
                  updateField(
                    "procurementEmail",
                    value,
                  );
                }}
              />

              <TextField
                label="Accounts payable email"
                type="email"
                value={
                  form.accountsPayableEmail
                }
                onChange={(value) => {
                  updateField(
                    "accountsPayableEmail",
                    value,
                  );
                }}
              />

              <TextField
                label="Payment terms days"
                type="number"
                value={
                  form.defaultPaymentTermsDays
                }
                onChange={(value) => {
                  updateField(
                    "defaultPaymentTermsDays",
                    value,
                  );
                }}
              />
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <ToggleField
                label="Purchase order required"
                checked={
                  form.purchaseOrderRequired
                }
                onChange={(checked) => {
                  updateField(
                    "purchaseOrderRequired",
                    checked,
                  );
                }}
              />

              <ToggleField
                label="Worker approval required"
                checked={
                  form.workerApprovalRequired
                }
                onChange={(checked) => {
                  updateField(
                    "workerApprovalRequired",
                    checked,
                  );
                }}
              />

              <ToggleField
                label="Timesheet approval required"
                checked={
                  form.timesheetApprovalRequired
                }
                onChange={(checked) => {
                  updateField(
                    "timesheetApprovalRequired",
                    checked,
                  );
                }}
              />

              <ToggleField
                label="Allow direct contractor contact"
                checked={
                  form.allowsDirectContractorContact
                }
                onChange={(checked) => {
                  updateField(
                    "allowsDirectContractorContact",
                    checked,
                  );
                }}
              />
            </div>
          </FormSection>

          <FormSection
            title="Relationship and onboarding"
            description="Initial lifecycle stage and onboarding target."
          >
            <div className="grid gap-5 md:grid-cols-3">
              <SelectField
                label="Relationship status"
                value={
                  form.relationshipStatus
                }
                options={
                  RELATIONSHIP_STATUS_OPTIONS
                    .filter(
                      (option) =>
                        option.value !==
                        "all",
                    )
                }
                onChange={(value) => {
                  updateField(
                    "relationshipStatus",
                    value,
                  );
                }}
              />

              <SelectField
                label="Onboarding status"
                value={
                  form.onboardingStatus
                }
                options={[
                  {
                    value:
                      "not_started",
                    label:
                      "Not started",
                  },
                  {
                    value:
                      "in_progress",
                    label:
                      "In progress",
                  },
                  {
                    value:
                      "awaiting_client",
                    label:
                      "Awaiting client",
                  },
                  {
                    value:
                      "awaiting_platform",
                    label:
                      "Awaiting platform",
                  },
                ]}
                onChange={(value) => {
                  updateField(
                    "onboardingStatus",
                    value,
                  );
                }}
              />

              <TextField
                label="Target launch date"
                type="date"
                value={
                  form.targetLaunchDate
                }
                onChange={(value) => {
                  updateField(
                    "targetLaunchDate",
                    value,
                  );
                }}
              />

              <TextField
                label="Current onboarding step"
                value={
                  form.currentOnboardingStep
                }
                onChange={(value) => {
                  updateField(
                    "currentOnboardingStep",
                    value,
                  );
                }}
              />

              <TextField
                label="Completion percentage"
                type="number"
                value={
                  form.completionPercentage
                }
                onChange={(value) => {
                  updateField(
                    "completionPercentage",
                    value,
                  );
                }}
              />
            </div>

            <label className="mt-5 block">
              <span className="text-sm font-semibold text-slate-700">
                Relationship notes
              </span>

              <textarea
                rows={3}
                value={
                  form.relationshipNotes
                }
                onChange={(event) => {
                  updateField(
                    "relationshipNotes",
                    event.target.value,
                  );
                }}
                className={[
                  inputClassName,
                  "mt-2 py-3",
                ].join(" ")}
              />
            </label>
          </FormSection>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="min-h-12 rounded-xl border border-slate-300 px-6 font-bold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={handleSubmit}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {saving && (
                <LoaderCircle
                  size={18}
                  className="animate-spin"
                />
              )}

              Create client
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function FormSection({
  title,
  description,
  children,
}) {
  return (
    <section>
      <h3 className="text-lg font-bold text-slate-950">
        {title}
      </h3>

      <p className="mt-1 text-sm leading-6 text-slate-600">
        {description}
      </p>

      <div className="mt-5">
        {children}
      </div>
    </section>
  );
}

function TextField({
  label,
  value,
  type = "text",
  required = false,
  onChange,
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">
        {label}
        {required
          ? " *"
          : ""}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) => {
          onChange(
            event.target.value,
          );
        }}
        className={[
          inputClassName,
          "mt-2",
        ].join(" ")}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) => {
          onChange(
            event.target.value,
          );
        }}
        className={[
          inputClassName,
          "mt-2",
        ].join(" ")}
      >
        {options.map(
          (option) => (
            <option
              key={option.value}
              value={option.value}
            >
              {option.label}
            </option>
          ),
        )}
      </select>
    </label>
  );
}

function ToggleField({
  label,
  checked,
  onChange,
}) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <span className="font-semibold text-slate-800">
        {label}
      </span>

      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => {
          onChange(
            event.target.checked,
          );
        }}
        className="h-5 w-5 rounded border-slate-300"
      />
    </label>
  );
}

const inputClassName = [
  "min-h-12 w-full rounded-xl border border-slate-300",
  "bg-white px-4 outline-none transition",
  "focus:border-blue-500 focus:ring-4 focus:ring-blue-100",
].join(" ");
