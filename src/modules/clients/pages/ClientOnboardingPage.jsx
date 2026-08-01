import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  LoaderCircle,
  RefreshCw,
  RotateCcw,
  Save,
  UserRound,
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

import {
  formatClientDate,
  formatStatusLabel,
} from "../utils";

const ONBOARDING_STATUS_OPTIONS = [
  {
    value: "not_started",
    label: "Not started",
  },
  {
    value: "in_progress",
    label: "In progress",
  },
  {
    value: "awaiting_client",
    label: "Awaiting client",
  },
  {
    value: "awaiting_platform",
    label: "Awaiting platform",
  },
  {
    value: "completed",
    label: "Completed",
  },
  {
    value: "cancelled",
    label: "Cancelled",
  },
];

function valueOrEmpty(value) {
  return value ?? "";
}

function buildForm(onboarding) {
  return {
    status:
      onboarding?.status ??
      "not_started",

    currentStep:
      valueOrEmpty(
        onboarding?.currentStep,
      ),

    completionPercentage:
      String(
        onboarding
          ?.completionPercentage ??
        0,
      ),

    requestedStartDate:
      valueOrEmpty(
        onboarding
          ?.requestedStartDate,
      ),

    targetLaunchDate:
      valueOrEmpty(
        onboarding
          ?.targetLaunchDate,
      ),

    assignedUserId:
      valueOrEmpty(
        onboarding
          ?.assignedUserId,
      ),

    internalNotes:
      valueOrEmpty(
        onboarding
          ?.internalNotes,
      ),

    clientNotes:
      valueOrEmpty(
        onboarding
          ?.clientNotes,
      ),

    synchronizeRelationship:
      true,
  };
}

function getRelationshipStatusForOnboarding(
  status,
) {
  switch (status) {
    case "in_progress":
    case "awaiting_client":
    case "awaiting_platform":
      return "onboarding";

    case "completed":
      return "active";

    case "cancelled":
      return "prospect";

    default:
      return null;
  }
}

export default function ClientOnboardingPage() {
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
    saveOnboarding,
    changeRelationshipStatus,
    loadClientWorkspace,
    clearError,
  } = useClient();

  const initialForm =
    useMemo(
      () =>
        buildForm(
          workspace.onboarding,
        ),
      [
        workspace.onboarding,
      ],
    );

  const [
    form,
    setForm,
  ] = useState(
    initialForm,
  );

  const [
    validationError,
    setValidationError,
  ] = useState("");

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

  const isDirty =
    JSON.stringify(form) !==
    JSON.stringify(initialForm);

  const percentage =
    Math.min(
      100,
      Math.max(
        0,
        Number(
          form.completionPercentage,
        ) || 0,
      ),
    );

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
    setSuccessMessage("");
  }

  function handleStatusChange(
    status,
  ) {
    setForm(
      (current) => ({
        ...current,
        status,

        completionPercentage:
          status === "completed"
            ? "100"
            : current
                .completionPercentage,
      }),
    );

    setValidationError("");
    setSuccessMessage("");
  }

  async function handleSave() {
    clearError();
    setValidationError("");
    setSuccessMessage("");

    const normalizedPercentage =
      Number(
        form.completionPercentage,
      );

    if (
      !Number.isInteger(
        normalizedPercentage,
      ) ||
      normalizedPercentage < 0 ||
      normalizedPercentage > 100
    ) {
      setValidationError(
        "Completion percentage must be a whole number between 0 and 100.",
      );

      return;
    }

    if (
      form.requestedStartDate &&
      form.targetLaunchDate &&
      form.targetLaunchDate <
        form.requestedStartDate
    ) {
      setValidationError(
        "Target launch date cannot be earlier than the requested start date.",
      );

      return;
    }

    try {
      const onboarding =
        await saveOnboarding(
          relationshipId,
          {
            status:
              form.status,

            currentStep:
              form.currentStep,

            completionPercentage:
              normalizedPercentage,

            requestedStartDate:
              form.requestedStartDate ||
              null,

            targetLaunchDate:
              form.targetLaunchDate ||
              null,

            assignedUserId:
              form.assignedUserId ||
              null,

            internalNotes:
              form.internalNotes,

            clientNotes:
              form.clientNotes,
          },
        );

      if (
        form.synchronizeRelationship
      ) {
        const relationshipStatus =
          getRelationshipStatusForOnboarding(
            form.status,
          );

        if (
          relationshipStatus &&
          workspace.relationship
            ?.status !==
            relationshipStatus
        ) {
          await changeRelationshipStatus(
            relationshipId,
            relationshipStatus,
          );
        }
      }

      await loadClientWorkspace(
        relationshipId,
        {
          silent: true,
        },
      );

      setForm(
        buildForm(
          onboarding,
        ),
      );

      setSuccessMessage(
        form.status === "completed"
          ? "Client onboarding completed and the workspace was refreshed."
          : "Client onboarding saved successfully.",
      );
    } catch {
      // The provider exposes the normalized error.
    }
  }

  function handleReset() {
    setForm(
      initialForm,
    );

    setValidationError("");
    setSuccessMessage("");
    clearError();
  }

  async function handleRefresh() {
    clearError();
    setValidationError("");
    setSuccessMessage("");

    try {
      const refreshed =
        await loadClientWorkspace(
          relationshipId,
        );

      setForm(
        buildForm(
          refreshed?.onboarding,
        ),
      );
    } catch {
      // The provider exposes the normalized error.
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
            Client onboarding
          </h1>

          <p className="mt-2 max-w-3xl leading-7 text-slate-600">
            Track onboarding ownership, launch readiness, progress,
            dependencies, and communications with the client.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            disabled={saving}
            onClick={() => {
              void handleRefresh();
            }}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={18} />
            Refresh
          </button>

          {canManage && (
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

              Save onboarding
            </button>
          )}
        </div>
      </section>

      {validationError && (
        <MessagePanel
          icon={AlertCircle}
          tone="error"
          title="Onboarding validation failed"
          message={
            validationError
          }
        />
      )}

      {error && (
        <MessagePanel
          icon={AlertCircle}
          tone="error"
          title="Onboarding operation failed"
          message={error.message}
        />
      )}

      {successMessage && (
        <MessagePanel
          icon={CheckCircle2}
          tone="success"
          title="Onboarding updated"
          message={
            successMessage
          }
        />
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={ClipboardCheck}
          label="Status"
          value={formatStatusLabel(
            form.status,
          )}
        />

        <MetricCard
          icon={CheckCircle2}
          label="Completion"
          value={`${percentage}%`}
        />

        <MetricCard
          icon={CalendarDays}
          label="Target launch"
          value={formatClientDate(
            form.targetLaunchDate,
          )}
        />

        <MetricCard
          icon={Clock3}
          label="Relationship"
          value={formatStatusLabel(
            workspace.relationship
              ?.status,
          )}
        />
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-950">
              Launch readiness
            </h2>

            <p className="mt-2 text-slate-600">
              Overall onboarding progress toward client activation.
            </p>
          </div>

          <span className="text-3xl font-bold text-blue-700">
            {percentage}%
          </span>
        </div>

        <div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-blue-600 transition-all"
            style={{
              width:
                `${percentage}%`,
            }}
          />
        </div>

        <div className="mt-4 flex justify-between text-xs font-semibold text-slate-500">
          <span>Not started</span>
          <span>Launch ready</span>
        </div>
      </section>

      <FormSection
        title="Onboarding status"
        description="Control the current lifecycle stage and active work step."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <SelectField
            label="Onboarding status"
            value={form.status}
            disabled={!canManage}
            options={
              ONBOARDING_STATUS_OPTIONS
            }
            onChange={
              handleStatusChange
            }
          />

          <TextField
            label="Completion percentage"
            type="number"
            min="0"
            max="100"
            value={
              form.completionPercentage
            }
            disabled={!canManage}
            onChange={(value) => {
              updateField(
                "completionPercentage",
                value,
              );
            }}
          />
        </div>

        <TextField
          label="Current onboarding step"
          value={form.currentStep}
          disabled={!canManage}
          placeholder="Example: Waiting for billing contact approval"
          onChange={(value) => {
            updateField(
              "currentStep",
              value,
            );
          }}
        />
      </FormSection>

      <FormSection
        title="Schedule and ownership"
        description="Track requested dates, target launch, and the assigned platform owner."
      >
        <div className="grid gap-5 md:grid-cols-3">
          <TextField
            label="Requested start date"
            type="date"
            value={
              form.requestedStartDate
            }
            disabled={!canManage}
            onChange={(value) => {
              updateField(
                "requestedStartDate",
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
            disabled={!canManage}
            onChange={(value) => {
              updateField(
                "targetLaunchDate",
                value,
              );
            }}
          />

          <TextField
            label="Assigned user ID"
            value={
              form.assignedUserId
            }
            disabled={!canManage}
            placeholder="Platform user UUID"
            onChange={(value) => {
              updateField(
                "assignedUserId",
                value,
              );
            }}
          />
        </div>

        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
          <div className="flex items-start gap-3">
            <UserRound
              size={20}
              className="mt-0.5 shrink-0 text-blue-700"
            />

            <div>
              <p className="font-bold text-blue-950">
                Assigned owner
              </p>

              <p className="mt-1 break-all text-sm text-blue-800">
                {form.assignedUserId ||
                  "No onboarding owner assigned."}
              </p>
            </div>
          </div>
        </div>
      </FormSection>

      <FormSection
        title="Onboarding notes"
        description="Maintain separate internal and client-facing onboarding notes."
      >
        <TextAreaField
          label="Internal notes"
          help="Visible to authorized platform staff."
          rows={6}
          value={
            form.internalNotes
          }
          disabled={!canManage}
          onChange={(value) => {
            updateField(
              "internalNotes",
              value,
            );
          }}
        />

        <TextAreaField
          label="Client notes"
          help="Information suitable for client-facing communication."
          rows={6}
          value={
            form.clientNotes
          }
          disabled={!canManage}
          onChange={(value) => {
            updateField(
              "clientNotes",
              value,
            );
          }}
        />
      </FormSection>

      {canManage && (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-bold text-slate-950">
            Lifecycle synchronization
          </h2>

          <p className="mt-2 leading-7 text-slate-600">
            Keep the platform-to-client relationship aligned with
            onboarding progress.
          </p>

          <label className="mt-6 flex items-start justify-between gap-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div>
              <p className="font-bold text-slate-900">
                Synchronize relationship status
              </p>

              <p className="mt-1 text-sm leading-6 text-slate-600">
                In-progress onboarding sets the relationship to
                Onboarding. Completion activates it. Cancellation
                returns it to Prospect.
              </p>
            </div>

            <input
              type="checkbox"
              checked={
                form
                  .synchronizeRelationship
              }
              onChange={(event) => {
                updateField(
                  "synchronizeRelationship",
                  event.target.checked,
                );
              }}
              className="mt-1 h-5 w-5 shrink-0 rounded border-slate-300"
            />
          </label>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={
                saving ||
                !isDirty
              }
              onClick={
                handleReset
              }
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <RotateCcw size={17} />
              Reset changes
            </button>

            <button
              type="button"
              disabled={
                saving ||
                !isDirty
              }
              onClick={() => {
                void handleSave();
              }}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 font-bold text-white hover:bg-blue-700 disabled:bg-slate-300"
            >
              {saving ? (
                <LoaderCircle
                  size={18}
                  className="animate-spin"
                />
              ) : (
                <Save size={18} />
              )}

              Save onboarding
            </button>
          </div>
        </section>
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
        size={22}
        className="text-blue-600"
      />

      <p className="mt-5 text-sm font-semibold text-slate-500">
        {label}
      </p>

      <p className="mt-2 break-words text-xl font-bold text-slate-950">
        {value}
      </p>
    </article>
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
  min,
  max,
  disabled = false,
  placeholder = "",
  onChange,
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">
        {label}
      </span>

      <input
        type={type}
        min={min}
        max={max}
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

function TextAreaField({
  label,
  help,
  rows,
  value,
  disabled,
  onChange,
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">
        {label}
      </span>

      {help && (
        <span className="mt-1 block text-xs text-slate-500">
          {help}
        </span>
      )}

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

const inputClassName = [
  "min-h-12 w-full rounded-xl border border-slate-300",
  "bg-white px-4 outline-none transition",
  "focus:border-blue-500 focus:ring-4 focus:ring-blue-100",
  "disabled:bg-slate-100 disabled:text-slate-500",
].join(" ");
