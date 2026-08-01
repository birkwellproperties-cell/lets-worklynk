import {
  AlertCircle,
  Archive,
  CheckCircle2,
  Edit3,
  LoaderCircle,
  Mail,
  Phone,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Star,
  UserRound,
  Users,
  X,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useOutletContext,
} from "react-router";

import {
  useAuth,
} from "../../../platform/auth";

import {
  useClient,
} from "../context";

import {
  formatStatusLabel,
} from "../utils";

const CONTACT_TYPES = [
  {
    value: "primary",
    label: "Primary",
  },
  {
    value: "operations",
    label: "Operations",
  },
  {
    value: "procurement",
    label: "Procurement",
  },
  {
    value: "accounts_payable",
    label: "Accounts payable",
  },
  {
    value: "human_resources",
    label: "Human resources",
  },
  {
    value: "compliance",
    label: "Compliance",
  },
  {
    value: "scheduling",
    label: "Scheduling",
  },
  {
    value: "executive",
    label: "Executive",
  },
  {
    value: "other",
    label: "Other",
  },
];

const EMPTY_FORM = {
  contactType: "other",
  firstName: "",
  lastName: "",
  jobTitle: "",
  departmentName: "",
  email: "",
  phone: "",
  mobilePhone: "",
  isPrimary: false,
  isActive: true,
  notes: "",
};

function buildContactForm(
  contact,
) {
  if (!contact) {
    return EMPTY_FORM;
  }

  return {
    contactType:
      contact.contactType ??
      "other",

    firstName:
      contact.firstName ??
      "",

    lastName:
      contact.lastName ??
      "",

    jobTitle:
      contact.jobTitle ??
      "",

    departmentName:
      contact.departmentName ??
      "",

    email:
      contact.email ??
      "",

    phone:
      contact.phone ??
      "",

    mobilePhone:
      contact.mobilePhone ??
      "",

    isPrimary:
      Boolean(
        contact.isPrimary,
      ),

    isActive:
      contact.isActive ??
      true,

    notes:
      contact.notes ??
      "",
  };
}

function getContactName(
  contact,
) {
  return [
    contact?.firstName,
    contact?.lastName,
  ]
    .filter(Boolean)
    .join(" ") ||
    "Unnamed contact";
}

function getInitials(
  contact,
) {
  return [
    contact?.firstName,
    contact?.lastName,
  ]
    .filter(Boolean)
    .map(
      (part) =>
        part.slice(0, 1),
    )
    .join("")
    .slice(0, 2)
    .toUpperCase() ||
    "C";
}

export default function ClientContactsPage() {
  const {
    workspace,
    relationshipId,
  } = useOutletContext();

  const {
    hasPermission,
    isPlatformAdministrator,
  } = useAuth();

  const {
    saving,
    error,
    getClientContacts,
    createContact,
    updateContact,
    setPrimaryContact,
    archiveContact,
    restoreContact,
    loadClientWorkspace,
    clearError,
  } = useClient();

  const [
    contacts,
    setContacts,
  ] = useState(
    workspace.contacts ??
    [],
  );

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("active");

  const [
    dialogOpen,
    setDialogOpen,
  ] = useState(false);

  const [
    editingContact,
    setEditingContact,
  ] = useState(null);

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const canManage =
    isPlatformAdministrator ||
    hasPermission(
      "clients.update",
    ) ||
    hasPermission(
      "clients.manage",
    );

  const clientOrganizationId =
    workspace.organization.id;

  const loadContacts =
    useCallback(
      async ({
        silent = false,
      } = {}) => {
        if (!silent) {
          setLoading(true);
        }

        try {
          const records =
            await getClientContacts(
              clientOrganizationId,
              {
                includeArchived:
                  true,
              },
            );

          setContacts(
            records,
          );

          return records;
        } finally {
          setLoading(false);
        }
      },
      [
        clientOrganizationId,
        getClientContacts,
      ],
    );

  useEffect(() => {
    const timeoutId =
      window.setTimeout(
        () => {
          void loadContacts();
        },
        0,
      );

    return () => {
      window.clearTimeout(
        timeoutId,
      );
    };
  }, [
    loadContacts,
  ]);

  const filteredContacts =
    useMemo(
      () => {
        const normalizedSearch =
          search
            .trim()
            .toLowerCase();

        return contacts.filter(
          (contact) => {
            const archived =
              Boolean(
                contact.archivedAt,
              );

            const matchesStatus =
              statusFilter ===
                "all" ||
              (
                statusFilter ===
                  "active" &&
                !archived &&
                contact.isActive
              ) ||
              (
                statusFilter ===
                  "inactive" &&
                !archived &&
                !contact.isActive
              ) ||
              (
                statusFilter ===
                  "archived" &&
                archived
              );

            const searchable = [
              contact.firstName,
              contact.lastName,
              contact.jobTitle,
              contact.departmentName,
              contact.email,
              contact.phone,
              contact.mobilePhone,
              contact.contactType,
            ];

            const matchesSearch =
              !normalizedSearch ||
              searchable.some(
                (value) =>
                  String(value ?? "")
                    .toLowerCase()
                    .includes(
                      normalizedSearch,
                    ),
              );

            return (
              matchesStatus &&
              matchesSearch
            );
          },
        );
      },
      [
        contacts,
        search,
        statusFilter,
      ],
    );

  const metrics =
    useMemo(
      () => ({
        total:
          contacts.filter(
            (contact) =>
              !contact.archivedAt,
          ).length,

        active:
          contacts.filter(
            (contact) =>
              !contact.archivedAt &&
              contact.isActive,
          ).length,

        archived:
          contacts.filter(
            (contact) =>
              contact.archivedAt,
          ).length,

        primary:
          contacts.filter(
            (contact) =>
              !contact.archivedAt &&
              contact.isPrimary,
          ).length,
      }),
      [
        contacts,
      ],
    );

  async function runOperation(
    operation,
    message,
  ) {
    clearError();
    setSuccessMessage("");

    try {
      await operation();
      await loadContacts({
        silent: true,
      });

      await loadClientWorkspace(
        relationshipId,
        {
          silent: true,
        },
      );

      setSuccessMessage(
        message,
      );

      return true;
    } catch {
      return false;
    }
  }

  function openCreateDialog() {
    clearError();
    setSuccessMessage("");
    setEditingContact(null);
    setDialogOpen(true);
  }

  function openEditDialog(
    contact,
  ) {
    clearError();
    setSuccessMessage("");
    setEditingContact(
      contact,
    );
    setDialogOpen(true);
  }

  async function handleArchive(
    contact,
  ) {
    const confirmed =
      window.confirm(
        `Archive ${getContactName(contact)}?`,
      );

    if (!confirmed) {
      return;
    }

    await runOperation(
      () =>
        archiveContact(
          contact.id,
        ),
      "Client contact archived.",
    );
  }

  async function handleRestore(
    contact,
  ) {
    await runOperation(
      () =>
        restoreContact(
          contact.id,
        ),
      "Client contact restored.",
    );
  }

  async function handleSetPrimary(
    contact,
  ) {
    if (contact.isPrimary) {
      return;
    }

    await runOperation(
      () =>
        setPrimaryContact(
          clientOrganizationId,
          contact.id,
        ),
      `${getContactName(contact)} is now the primary contact.`,
    );
  }

  async function handleToggleActive(
    contact,
  ) {
    await runOperation(
      () =>
        updateContact(
          contact.id,
          {
            isActive:
              !contact.isActive,
          },
        ),
      contact.isActive
        ? "Client contact deactivated."
        : "Client contact activated.",
    );
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-blue-600">
            Client workspace
          </p>

          <h1 className="mt-2 text-2xl font-bold text-slate-950">
            Client contacts
          </h1>

          <p className="mt-2 max-w-3xl leading-7 text-slate-600">
            Manage client stakeholders for operations, scheduling,
            procurement, billing, compliance, and executive
            communication.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              void loadContacts();
            }}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
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

          {canManage && (
            <button
              type="button"
              onClick={
                openCreateDialog
              }
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 font-bold text-white hover:bg-blue-700"
            >
              <Plus size={18} />
              Add contact
            </button>
          )}
        </div>
      </section>

      {error && (
        <MessagePanel
          icon={AlertCircle}
          tone="error"
          title="Contact operation failed"
          message={error.message}
        />
      )}

      {successMessage && (
        <MessagePanel
          icon={CheckCircle2}
          tone="success"
          title="Contact operation completed"
          message={
            successMessage
          }
        />
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Users}
          label="Total contacts"
          value={metrics.total}
        />

        <MetricCard
          icon={CheckCircle2}
          label="Active contacts"
          value={metrics.active}
        />

        <MetricCard
          icon={Star}
          label="Primary contacts"
          value={metrics.primary}
        />

        <MetricCard
          icon={Archive}
          label="Archived"
          value={metrics.archived}
        />
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_230px]">
          <label className="flex min-h-12 items-center gap-3 rounded-xl border border-slate-300 px-4 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100">
            <Search
              size={18}
              className="text-slate-400"
            />

            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(
                  event.target.value,
                );
              }}
              placeholder="Search contacts..."
              className="w-full border-0 bg-transparent py-3 outline-none"
            />
          </label>

          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(
                event.target.value,
              );
            }}
            className={inputClassName}
          >
            <option value="all">
              All contacts
            </option>

            <option value="active">
              Active
            </option>

            <option value="inactive">
              Inactive
            </option>

            <option value="archived">
              Archived
            </option>
          </select>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex min-h-80 items-center justify-center">
            <LoaderCircle
              size={30}
              className="animate-spin text-blue-600"
            />
          </div>
        ) : filteredContacts.length === 0 ? (
          <EmptyState
            canManage={
              canManage
            }
            onCreate={
              openCreateDialog
            }
          />
        ) : (
          <div className="divide-y divide-slate-200">
            {filteredContacts.map(
              (contact) => (
                <ContactRow
                  key={contact.id}
                  contact={contact}
                  canManage={
                    canManage
                  }
                  saving={saving}
                  onEdit={() => {
                    openEditDialog(
                      contact,
                    );
                  }}
                  onSetPrimary={() => {
                    void handleSetPrimary(
                      contact,
                    );
                  }}
                  onToggleActive={() => {
                    void handleToggleActive(
                      contact,
                    );
                  }}
                  onArchive={() => {
                    void handleArchive(
                      contact,
                    );
                  }}
                  onRestore={() => {
                    void handleRestore(
                      contact,
                    );
                  }}
                />
              ),
            )}
          </div>
        )}
      </section>

      {dialogOpen && (
        <ContactDialog
          contact={
            editingContact
          }
          saving={saving}
          onClose={() => {
            setDialogOpen(false);
          }}
          onSubmit={(payload) => {
            void runOperation(
              async () => {
                if (
                  editingContact
                ) {
                  await updateContact(
                    editingContact.id,
                    payload,
                  );
                } else {
                  const created =
                    await createContact(
                      clientOrganizationId,
                      payload,
                    );

                  if (
                    payload.isPrimary &&
                    created?.id
                  ) {
                    await setPrimaryContact(
                      clientOrganizationId,
                      created.id,
                    );
                  }
                }

                setDialogOpen(false);
              },
              editingContact
                ? "Client contact updated."
                : "Client contact created.",
            );
          }}
        />
      )}
    </div>
  );
}

function ContactRow({
  contact,
  canManage,
  saving,
  onEdit,
  onSetPrimary,
  onToggleActive,
  onArchive,
  onRestore,
}) {
  const archived =
    Boolean(
      contact.archivedAt,
    );

  return (
    <article className="p-5 sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 font-bold text-blue-700">
            {getInitials(
              contact,
            )}
          </span>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-bold text-slate-950">
                {getContactName(
                  contact,
                )}
              </h2>

              {contact.isPrimary && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                  <Star size={12} />
                  Primary
                </span>
              )}

              <span
                className={[
                  "rounded-full px-2.5 py-1 text-xs font-bold",
                  archived
                    ? "bg-slate-100 text-slate-600"
                    : contact.isActive
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700",
                ].join(" ")}
              >
                {archived
                  ? "Archived"
                  : contact.isActive
                    ? "Active"
                    : "Inactive"}
              </span>
            </div>

            <p className="mt-1 text-sm text-slate-600">
              {contact.jobTitle ||
                formatStatusLabel(
                  contact.contactType,
                )}

              {contact.departmentName
                ? ` - ${contact.departmentName}`
                : ""}
            </p>

            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
              {contact.email && (
                <span className="inline-flex items-center gap-2">
                  <Mail size={15} />
                  {contact.email}
                </span>
              )}

              {(contact.phone ||
                contact.mobilePhone) && (
                <span className="inline-flex items-center gap-2">
                  <Phone size={15} />
                  {contact.phone ||
                    contact.mobilePhone}
                </span>
              )}
            </div>
          </div>
        </div>

        {canManage && (
          <div className="flex flex-wrap gap-2">
            {!archived && (
              <>
                <ActionButton
                  icon={Edit3}
                  label="Edit"
                  disabled={saving}
                  onClick={onEdit}
                />

                {!contact.isPrimary && (
                  <ActionButton
                    icon={Star}
                    label="Set primary"
                    disabled={saving}
                    onClick={
                      onSetPrimary
                    }
                  />
                )}

                <ActionButton
                  icon={
                    contact.isActive
                      ? X
                      : CheckCircle2
                  }
                  label={
                    contact.isActive
                      ? "Deactivate"
                      : "Activate"
                  }
                  disabled={saving}
                  onClick={
                    onToggleActive
                  }
                />

                <ActionButton
                  icon={Archive}
                  label="Archive"
                  disabled={saving}
                  onClick={onArchive}
                  danger
                />
              </>
            )}

            {archived && (
              <ActionButton
                icon={RotateCcw}
                label="Restore"
                disabled={saving}
                onClick={onRestore}
              />
            )}
          </div>
        )}
      </div>
    </article>
  );
}

function ContactDialog({
  contact,
  saving,
  onClose,
  onSubmit,
}) {
  const [
    form,
    setForm,
  ] = useState(
    () =>
      buildContactForm(
        contact,
      ),
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

    setValidationError("");
  }

  function handleSubmit() {
    if (!form.firstName.trim()) {
      setValidationError(
        "First name is required.",
      );

      return;
    }

    if (!form.lastName.trim()) {
      setValidationError(
        "Last name is required.",
      );

      return;
    }

    onSubmit(form);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-8">
      <button
        type="button"
        aria-label="Close contact dialog"
        onClick={onClose}
        className="absolute inset-0"
      />

      <section className="relative z-10 max-h-full w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <header className="sticky top-0 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-6 py-5 sm:px-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-950">
              {contact
                ? "Edit client contact"
                : "Add client contact"}
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              Maintain contact ownership and communication details.
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

        <div className="space-y-6 p-6 sm:p-8">
          {validationError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
              {validationError}
            </div>
          )}

          <div className="grid gap-5 md:grid-cols-2">
            <TextField
              label="First name"
              value={form.firstName}
              required
              onChange={(value) => {
                updateField(
                  "firstName",
                  value,
                );
              }}
            />

            <TextField
              label="Last name"
              value={form.lastName}
              required
              onChange={(value) => {
                updateField(
                  "lastName",
                  value,
                );
              }}
            />

            <SelectField
              label="Contact type"
              value={form.contactType}
              options={CONTACT_TYPES}
              onChange={(value) => {
                updateField(
                  "contactType",
                  value,
                );
              }}
            />

            <TextField
              label="Job title"
              value={form.jobTitle}
              onChange={(value) => {
                updateField(
                  "jobTitle",
                  value,
                );
              }}
            />

            <TextField
              label="Department"
              value={form.departmentName}
              onChange={(value) => {
                updateField(
                  "departmentName",
                  value,
                );
              }}
            />

            <TextField
              label="Email"
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
              label="Phone"
              value={form.phone}
              onChange={(value) => {
                updateField(
                  "phone",
                  value,
                );
              }}
            />

            <TextField
              label="Mobile phone"
              value={form.mobilePhone}
              onChange={(value) => {
                updateField(
                  "mobilePhone",
                  value,
                );
              }}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <ToggleField
              label="Primary contact"
              checked={form.isPrimary}
              onChange={(checked) => {
                updateField(
                  "isPrimary",
                  checked,
                );
              }}
            />

            <ToggleField
              label="Active contact"
              checked={form.isActive}
              onChange={(checked) => {
                updateField(
                  "isActive",
                  checked,
                );
              }}
            />
          </div>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Notes
            </span>

            <textarea
              rows={4}
              value={form.notes}
              onChange={(event) => {
                updateField(
                  "notes",
                  event.target.value,
                );
              }}
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </label>

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
              onClick={
                handleSubmit
              }
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 font-bold text-white hover:bg-blue-700 disabled:bg-slate-300"
            >
              {saving && (
                <LoaderCircle
                  size={18}
                  className="animate-spin"
                />
              )}

              {contact
                ? "Save contact"
                : "Create contact"}
            </button>
          </div>
        </div>
      </section>
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
        size={22}
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

function EmptyState({
  canManage,
  onCreate,
}) {
  return (
    <div className="p-12 text-center">
      <UserRound
        size={40}
        className="mx-auto text-slate-300"
      />

      <h2 className="mt-5 text-xl font-bold text-slate-950">
        No contacts found
      </h2>

      <p className="mt-2 text-slate-600">
        Add a client stakeholder or adjust the search and filter.
      </p>

      {canManage && (
        <button
          type="button"
          onClick={onCreate}
          className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 font-bold text-white hover:bg-blue-700"
        >
          <Plus size={17} />
          Add first contact
        </button>
      )}
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  disabled,
  onClick,
  danger = false,
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={[
        "inline-flex min-h-10 items-center gap-2 rounded-xl border px-3 text-sm font-bold transition disabled:opacity-50",
        danger
          ? "border-red-200 text-red-700 hover:bg-red-50"
          : "border-slate-300 text-slate-700 hover:bg-slate-50",
      ].join(" ")}
    >
      <Icon size={15} />
      {label}
    </button>
  );
}

function MessagePanel({
  icon: Icon,
  tone,
  title,
  message,
}) {
  const classes =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : "border-red-200 bg-red-50 text-red-900";

  return (
    <div
      className={[
        "flex items-start gap-3 rounded-2xl border p-5",
        classes,
      ].join(" ")}
    >
      <Icon
        size={20}
        className="mt-0.5 shrink-0"
      />

      <div>
        <p className="font-bold">
          {title}
        </p>

        <p className="mt-1 text-sm">
          {message}
        </p>
      </div>
    </div>
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
