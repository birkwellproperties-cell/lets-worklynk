import {
  AlertCircle,
  CheckCircle2,
  LoaderCircle,
  Save,
} from "lucide-react";

import {
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

function valueOrEmpty(value) {
  return value ?? "";
}

function buildForm(workspace) {
  const organization =
    workspace?.organization ??
    {};

  const profile =
    workspace?.organizationProfile ??
    {};

  const clientProfile =
    workspace?.clientProfile ??
    {};

  return {
    legalName:
      valueOrEmpty(
        organization.legalName,
      ),

    displayName:
      valueOrEmpty(
        organization.displayName,
      ),

    slug:
      valueOrEmpty(
        organization.slug,
      ),

    status:
      valueOrEmpty(
        organization.status,
      ) ||
      "pending",

    email:
      valueOrEmpty(
        organization.email,
      ),

    phone:
      valueOrEmpty(
        organization.phone,
      ),

    websiteUrl:
      valueOrEmpty(
        organization.websiteUrl,
      ),

    profileVisibility:
      valueOrEmpty(
        profile.profileVisibility,
      ) ||
      "private",

    shortDescription:
      valueOrEmpty(
        profile.shortDescription,
      ),

    fullDescription:
      valueOrEmpty(
        profile.fullDescription,
      ),

    industryCode:
      valueOrEmpty(
        profile.industryCode,
      ),

    industryName:
      valueOrEmpty(
        profile.industryName,
      ),

    employeeSizeRange:
      valueOrEmpty(
        profile.employeeSizeRange,
      ),

    yearEstablished:
      valueOrEmpty(
        profile.yearEstablished,
      ),

    marketplaceHeadline:
      valueOrEmpty(
        profile.marketplaceHeadline,
      ),

    primaryContactName:
      valueOrEmpty(
        profile.primaryContactName,
      ),

    primaryContactEmail:
      valueOrEmpty(
        profile.primaryContactEmail,
      ),

    primaryContactPhone:
      valueOrEmpty(
        profile.primaryContactPhone,
      ),

    supportEmail:
      valueOrEmpty(
        profile.supportEmail,
      ),

    supportPhone:
      valueOrEmpty(
        profile.supportPhone,
      ),

    timezone:
      valueOrEmpty(
        profile.timezone,
      ) ||
      "America/Chicago",

    locale:
      valueOrEmpty(
        profile.locale,
      ) ||
      "en-US",

    currencyCode:
      valueOrEmpty(
        profile.currencyCode,
      ) ||
      "USD",

    procurementEmail:
      valueOrEmpty(
        clientProfile.procurementEmail,
      ),

    accountsPayableEmail:
      valueOrEmpty(
        clientProfile.accountsPayableEmail,
      ),

    defaultPaymentTermsDays:
      valueOrEmpty(
        clientProfile
          .defaultPaymentTermsDays,
      ) ||
      "30",

    purchaseOrderRequired:
      Boolean(
        clientProfile
          .purchaseOrderRequired,
      ),

    workerApprovalRequired:
      clientProfile
        .workerApprovalRequired ??
      true,

    timesheetApprovalRequired:
      clientProfile
        .timesheetApprovalRequired ??
      true,

    allowsDirectContractorContact:
      clientProfile
        .allowsDirectContractorContact ??
      true,
  };
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

export default function ClientProfilePage() {
  const {
    workspace,
  } = useOutletContext();

  const {
    hasPermission,
    isPlatformAdministrator,
  } = useAuth();

  const {
    saving,
    error,
    updateClientProfileWorkspace,
    clearError,
  } = useClient();

  const initialForm =
    useMemo(
      () =>
        buildForm(workspace),
      [
        workspace,
      ],
    );

  const [
    form,
    setForm,
  ] = useState(
    initialForm,
  );

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const [
    validationError,
    setValidationError,
  ] = useState("");

  const canEdit =
    isPlatformAdministrator ||
    hasPermission(
      "clients.update",
    ) ||
    hasPermission(
      "clients.manage",
    );

  const isDirty =
    JSON.stringify(form) !==
    JSON.stringify(initialForm);

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

    setSuccessMessage("");
    setValidationError("");
  }

  function handleDisplayNameChange(
    value,
  ) {
    setForm(
      (current) => ({
        ...current,
        displayName: value,

        slug:
          current.slug ||
          createSlug(value),
      }),
    );

    setSuccessMessage("");
  }

  async function handleSave() {
    clearError();
    setSuccessMessage("");
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

    try {
      await updateClientProfileWorkspace(
        workspace.organization.id,
        {
          organization: {
            legalName:
              form.legalName,

            displayName:
              form.displayName,

            slug:
              form.slug,

            status:
              form.status,

            email:
              form.email,

            phone:
              form.phone,

            websiteUrl:
              form.websiteUrl,
          },

          organizationProfile: {
            profileVisibility:
              form.profileVisibility,

            shortDescription:
              form.shortDescription,

            fullDescription:
              form.fullDescription,

            industryCode:
              form.industryCode,

            industryName:
              form.industryName,

            employeeSizeRange:
              form.employeeSizeRange,

            yearEstablished:
              form.yearEstablished === ""
                ? null
                : Number(
                    form.yearEstablished,
                  ),

            marketplaceHeadline:
              form.marketplaceHeadline,

            primaryContactName:
              form.primaryContactName,

            primaryContactEmail:
              form.primaryContactEmail,

            primaryContactPhone:
              form.primaryContactPhone,

            supportEmail:
              form.supportEmail,

            supportPhone:
              form.supportPhone,

            timezone:
              form.timezone,

            locale:
              form.locale,

            currencyCode:
              form.currencyCode,
          },

          clientProfile: {
            procurementEmail:
              form.procurementEmail,

            accountsPayableEmail:
              form.accountsPayableEmail,

            defaultPaymentTermsDays:
              Number(
                form
                  .defaultPaymentTermsDays,
              ),

            purchaseOrderRequired:
              form.purchaseOrderRequired,

            workerApprovalRequired:
              form.workerApprovalRequired,

            timesheetApprovalRequired:
              form.timesheetApprovalRequired,

            allowsDirectContractorContact:
              form
                .allowsDirectContractorContact,
          },
        },
      );

      setSuccessMessage(
        "Client profile saved successfully.",
      );
    } catch {
      // Provider exposes the normalized error.
    }
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-blue-600">
            Client workspace
          </p>

          <h1 className="mt-2 text-2xl font-bold text-slate-950">
            Client profile
          </h1>

          <p className="mt-2 max-w-3xl leading-7 text-slate-600">
            Maintain the client organization identity, marketplace
            profile, contact details, billing defaults, and approval
            preferences.
          </p>
        </div>

        {canEdit && (
          <button
            type="button"
            disabled={
              saving ||
              !isDirty
            }
            onClick={() => {
              void handleSave();
            }}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {saving ? (
              <LoaderCircle
                size={18}
                className="animate-spin"
              />
            ) : (
              <Save size={18} />
            )}

            Save profile
          </button>
        )}
      </section>

      {validationError && (
        <MessagePanel
          icon={AlertCircle}
          tone="error"
          title="Profile validation failed"
          message={
            validationError
          }
        />
      )}

      {error && (
        <MessagePanel
          icon={AlertCircle}
          tone="error"
          title="Profile save failed"
          message={error.message}
        />
      )}

      {successMessage && (
        <MessagePanel
          icon={CheckCircle2}
          tone="success"
          title="Profile saved"
          message={
            successMessage
          }
        />
      )}

      <FormSection
        title="Organization identity"
        description="Core legal and account information."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <TextField
            label="Legal name"
            value={form.legalName}
            required
            disabled={!canEdit}
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
            disabled={!canEdit}
            onChange={
              handleDisplayNameChange
            }
          />

          <TextField
            label="Organization slug"
            value={form.slug}
            required
            disabled={!canEdit}
            onChange={(value) => {
              updateField(
                "slug",
                createSlug(value),
              );
            }}
          />

          <SelectField
            label="Organization status"
            value={form.status}
            disabled={!canEdit}
            options={[
              {
                value: "pending",
                label: "Pending",
              },
              {
                value: "active",
                label: "Active",
              },
              {
                value: "suspended",
                label: "Suspended",
              },
              {
                value: "archived",
                label: "Archived",
              },
            ]}
            onChange={(value) => {
              updateField(
                "status",
                value,
              );
            }}
          />

          <TextField
            label="Email"
            type="email"
            value={form.email}
            disabled={!canEdit}
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
            disabled={!canEdit}
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
            disabled={!canEdit}
            onChange={(value) => {
              updateField(
                "websiteUrl",
                value,
              );
            }}
          />
        </div>
      </FormSection>

      <FormSection
        title="Marketplace profile"
        description="Client-facing company description and marketplace presentation."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <SelectField
            label="Profile visibility"
            value={
              form.profileVisibility
            }
            disabled={!canEdit}
            options={[
              {
                value: "private",
                label: "Private",
              },
              {
                value: "network",
                label: "Network",
              },
              {
                value: "public",
                label: "Public",
              },
            ]}
            onChange={(value) => {
              updateField(
                "profileVisibility",
                value,
              );
            }}
          />

          <TextField
            label="Marketplace headline"
            value={
              form.marketplaceHeadline
            }
            disabled={!canEdit}
            onChange={(value) => {
              updateField(
                "marketplaceHeadline",
                value,
              );
            }}
          />

          <TextField
            label="Industry code"
            value={form.industryCode}
            disabled={!canEdit}
            onChange={(value) => {
              updateField(
                "industryCode",
                value,
              );
            }}
          />

          <TextField
            label="Industry name"
            value={form.industryName}
            disabled={!canEdit}
            onChange={(value) => {
              updateField(
                "industryName",
                value,
              );
            }}
          />

          <TextField
            label="Employee size range"
            value={
              form.employeeSizeRange
            }
            disabled={!canEdit}
            placeholder="51-200"
            onChange={(value) => {
              updateField(
                "employeeSizeRange",
                value,
              );
            }}
          />

          <TextField
            label="Year established"
            type="number"
            value={
              form.yearEstablished
            }
            disabled={!canEdit}
            onChange={(value) => {
              updateField(
                "yearEstablished",
                value,
              );
            }}
          />
        </div>

        <TextAreaField
          label="Short description"
          rows={3}
          value={
            form.shortDescription
          }
          disabled={!canEdit}
          onChange={(value) => {
            updateField(
              "shortDescription",
              value,
            );
          }}
        />

        <TextAreaField
          label="Full description"
          rows={6}
          value={
            form.fullDescription
          }
          disabled={!canEdit}
          onChange={(value) => {
            updateField(
              "fullDescription",
              value,
            );
          }}
        />
      </FormSection>

      <FormSection
        title="Contact information"
        description="Primary and support contact details."
      >
        <div className="grid gap-5 md:grid-cols-3">
          <TextField
            label="Primary contact name"
            value={
              form.primaryContactName
            }
            disabled={!canEdit}
            onChange={(value) => {
              updateField(
                "primaryContactName",
                value,
              );
            }}
          />

          <TextField
            label="Primary contact email"
            type="email"
            value={
              form.primaryContactEmail
            }
            disabled={!canEdit}
            onChange={(value) => {
              updateField(
                "primaryContactEmail",
                value,
              );
            }}
          />

          <TextField
            label="Primary contact phone"
            value={
              form.primaryContactPhone
            }
            disabled={!canEdit}
            onChange={(value) => {
              updateField(
                "primaryContactPhone",
                value,
              );
            }}
          />

          <TextField
            label="Support email"
            type="email"
            value={form.supportEmail}
            disabled={!canEdit}
            onChange={(value) => {
              updateField(
                "supportEmail",
                value,
              );
            }}
          />

          <TextField
            label="Support phone"
            value={form.supportPhone}
            disabled={!canEdit}
            onChange={(value) => {
              updateField(
                "supportPhone",
                value,
              );
            }}
          />
        </div>
      </FormSection>

      <FormSection
        title="Localization"
        description="Timezone, locale, and currency defaults."
      >
        <div className="grid gap-5 md:grid-cols-3">
          <TextField
            label="Timezone"
            value={form.timezone}
            disabled={!canEdit}
            onChange={(value) => {
              updateField(
                "timezone",
                value,
              );
            }}
          />

          <TextField
            label="Locale"
            value={form.locale}
            disabled={!canEdit}
            onChange={(value) => {
              updateField(
                "locale",
                value,
              );
            }}
          />

          <TextField
            label="Currency code"
            value={form.currencyCode}
            disabled={!canEdit}
            onChange={(value) => {
              updateField(
                "currencyCode",
                value.toUpperCase(),
              );
            }}
          />
        </div>
      </FormSection>

      <FormSection
        title="Billing defaults"
        description="Procurement and accounts-payable preferences."
      >
        <div className="grid gap-5 md:grid-cols-3">
          <TextField
            label="Procurement email"
            type="email"
            value={
              form.procurementEmail
            }
            disabled={!canEdit}
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
            disabled={!canEdit}
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
              form
                .defaultPaymentTermsDays
            }
            disabled={!canEdit}
            onChange={(value) => {
              updateField(
                "defaultPaymentTermsDays",
                value,
              );
            }}
          />
        </div>
      </FormSection>

      <FormSection
        title="Operational preferences"
        description="Default purchasing, worker, timesheet, and communication controls."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <ToggleField
            label="Purchase order required"
            checked={
              form.purchaseOrderRequired
            }
            disabled={!canEdit}
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
            disabled={!canEdit}
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
              form
                .timesheetApprovalRequired
            }
            disabled={!canEdit}
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
              form
                .allowsDirectContractorContact
            }
            disabled={!canEdit}
            onChange={(checked) => {
              updateField(
                "allowsDirectContractorContact",
                checked,
              );
            }}
          />
        </div>
      </FormSection>
    </div>
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

        <p className="mt-1 text-sm leading-6">
          {message}
        </p>
      </div>
    </div>
  );
}

function FormSection({
  title,
  description,
  children,
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h2 className="text-xl font-bold text-slate-950">
        {title}
      </h2>

      <p className="mt-2 leading-7 text-slate-600">
        {description}
      </p>

      <div className="mt-6 space-y-5">
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
  disabled = false,
  placeholder = "",
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
        disabled={disabled}
        placeholder={placeholder}
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

function TextAreaField({
  label,
  value,
  rows,
  disabled,
  onChange,
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">
        {label}
      </span>

      <textarea
        rows={rows}
        value={value}
        disabled={disabled}
        onChange={(event) => {
          onChange(
            event.target.value,
          );
        }}
        className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-500"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  disabled,
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
        disabled={disabled}
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
  disabled,
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
        disabled={disabled}
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
  "disabled:bg-slate-100 disabled:text-slate-500",
].join(" ");
