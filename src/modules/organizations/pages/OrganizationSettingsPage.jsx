import {
  AlertCircle,
  Bell,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  Save,
  ShieldCheck,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useForm,
} from "react-hook-form";

import {
  useAuth,
} from "../../../platform/auth";

import {
  useOrganization,
} from "../context";

const DEFAULT_VALUES = {
  timezone: "America/Chicago",
  locale: "en-US",
  dateFormat: "MM/DD/YYYY",
  timeFormat: "12-hour",
  weekStartsOn: "sunday",

  emailNotifications: true,
  assignmentNotifications: true,
  billingNotifications: true,
  complianceNotifications: true,

  requireJobApproval: false,
  requireWorkerApproval: true,
  requireTimesheetApproval: true,
  allowDirectMessages: true,

  marketplaceVisibility: "private",
  allowMarketplaceInvites: true,
  allowDirectClientInvites: true,
};

function findSetting(
  settings,
  key,
) {
  return settings.find(
    (setting) =>
      setting.settingKey === key,
  )?.settingValue;
}

function createDefaultValues(
  settings,
  profile,
) {
  const regional =
    findSetting(
      settings,
      "organization.regional",
    ) ?? {};

  const notifications =
    findSetting(
      settings,
      "organization.notifications",
    ) ?? {};

  const workflow =
    findSetting(
      settings,
      "organization.workflow",
    ) ?? {};

  const marketplace =
    findSetting(
      settings,
      "organization.marketplace",
    ) ?? {};

  return {
    timezone:
      regional.timezone ??
      profile?.timezone ??
      DEFAULT_VALUES.timezone,

    locale:
      regional.locale ??
      profile?.locale ??
      DEFAULT_VALUES.locale,

    dateFormat:
      regional.dateFormat ??
      DEFAULT_VALUES.dateFormat,

    timeFormat:
      regional.timeFormat ??
      DEFAULT_VALUES.timeFormat,

    weekStartsOn:
      regional.weekStartsOn ??
      DEFAULT_VALUES.weekStartsOn,

    emailNotifications:
      notifications.emailNotifications ??
      DEFAULT_VALUES.emailNotifications,

    assignmentNotifications:
      notifications.assignmentNotifications ??
      DEFAULT_VALUES.assignmentNotifications,

    billingNotifications:
      notifications.billingNotifications ??
      DEFAULT_VALUES.billingNotifications,

    complianceNotifications:
      notifications.complianceNotifications ??
      DEFAULT_VALUES.complianceNotifications,

    requireJobApproval:
      workflow.requireJobApproval ??
      DEFAULT_VALUES.requireJobApproval,

    requireWorkerApproval:
      workflow.requireWorkerApproval ??
      DEFAULT_VALUES.requireWorkerApproval,

    requireTimesheetApproval:
      workflow.requireTimesheetApproval ??
      DEFAULT_VALUES.requireTimesheetApproval,

    allowDirectMessages:
      workflow.allowDirectMessages ??
      DEFAULT_VALUES.allowDirectMessages,

    marketplaceVisibility:
      marketplace.marketplaceVisibility ??
      DEFAULT_VALUES.marketplaceVisibility,

    allowMarketplaceInvites:
      marketplace.allowMarketplaceInvites ??
      DEFAULT_VALUES.allowMarketplaceInvites,

    allowDirectClientInvites:
      marketplace.allowDirectClientInvites ??
      DEFAULT_VALUES.allowDirectClientInvites,
  };
}

export default function OrganizationSettingsPage() {
  const {
    hasPermission,
    isPlatformAdministrator,
  } = useAuth();

  const {
    profile,
    settings,
    saving,
    error,
    saveSetting,
    saveProfile,
    clearError,
  } = useOrganization();

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const canManage =
    isPlatformAdministrator ||
    hasPermission(
      "settings.manage",
    );

  const defaultValues =
    useMemo(
      () =>
        createDefaultValues(
          settings,
          profile,
        ),
      [
        settings,
        profile,
      ],
    );

  const {
    register,
    handleSubmit,
    reset,
    formState: {
      errors,
      isDirty,
      isSubmitting,
    },
  } = useForm({
    defaultValues,
    mode: "onBlur",
  });

  useEffect(() => {
    reset(defaultValues);
  }, [
    defaultValues,
    reset,
  ]);

  async function onSubmit(values) {
    clearError();
    setSuccessMessage("");

    await Promise.all([
      saveSetting(
        "organization.regional",
        {
          timezone:
            values.timezone,
          locale:
            values.locale,
          dateFormat:
            values.dateFormat,
          timeFormat:
            values.timeFormat,
          weekStartsOn:
            values.weekStartsOn,
        },
      ),

      saveSetting(
        "organization.notifications",
        {
          emailNotifications:
            values.emailNotifications,
          assignmentNotifications:
            values.assignmentNotifications,
          billingNotifications:
            values.billingNotifications,
          complianceNotifications:
            values.complianceNotifications,
        },
      ),

      saveSetting(
        "organization.workflow",
        {
          requireJobApproval:
            values.requireJobApproval,
          requireWorkerApproval:
            values.requireWorkerApproval,
          requireTimesheetApproval:
            values.requireTimesheetApproval,
          allowDirectMessages:
            values.allowDirectMessages,
        },
      ),

      saveSetting(
        "organization.marketplace",
        {
          marketplaceVisibility:
            values.marketplaceVisibility,
          allowMarketplaceInvites:
            values.allowMarketplaceInvites,
          allowDirectClientInvites:
            values.allowDirectClientInvites,
        },
      ),

      saveProfile({
        profileVisibility:
          profile?.profileVisibility ??
          "private",
        shortDescription:
          profile?.shortDescription,
        fullDescription:
          profile?.fullDescription,
        industryCode:
          profile?.industryCode,
        industryName:
          profile?.industryName,
        employeeSizeRange:
          profile?.employeeSizeRange,
        yearEstablished:
          profile?.yearEstablished,
        marketplaceHeadline:
          profile?.marketplaceHeadline,
        primaryContactName:
          profile?.primaryContactName,
        primaryContactEmail:
          profile?.primaryContactEmail,
        primaryContactPhone:
          profile?.primaryContactPhone,
        supportEmail:
          profile?.supportEmail,
        supportPhone:
          profile?.supportPhone,
        timezone:
          values.timezone,
        locale:
          values.locale,
        currencyCode:
          profile?.currencyCode ??
          "USD",
      }),
    ]);

    setSuccessMessage(
      "Organization settings saved successfully.",
    );
  }

  const submitDisabled =
    !canManage ||
    saving ||
    isSubmitting ||
    !isDirty;

  return (
    <form
      onSubmit={handleSubmit(
        onSubmit,
      )}
      className="space-y-6"
    >
      <section className="flex flex-col gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-600">
            Organization settings
          </p>

          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            Workspace defaults and preferences
          </h2>

          <p className="mt-3 max-w-3xl leading-7 text-slate-600">
            Configure regional preferences, notifications,
            workflow approvals, communication defaults, and
            marketplace availability.
          </p>
        </div>

        <button
          type="submit"
          disabled={submitDisabled}
          className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {saving || isSubmitting ? (
            <>
              <LoaderCircle
                size={18}
                className="animate-spin"
              />
              Saving…
            </>
          ) : (
            <>
              <Save size={18} />
              Save settings
            </>
          )}
        </button>
      </section>

      {!canManage && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
          Your current role may view organization settings but
          cannot change them.
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-900">
          <AlertCircle
            size={20}
            className="mt-0.5 shrink-0"
          />

          <div>
            <p className="font-bold">
              Settings could not be saved
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

      <SettingsSection
        icon={Clock3}
        title="Regional preferences"
        description="Set the default timezone, locale, date format, time format, and first day of the work week."
      >
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <Field
            label="Timezone"
            error={
              errors.timezone?.message
            }
          >
            <input
              type="text"
              disabled={!canManage}
              placeholder="America/Chicago"
              {...register(
                "timezone",
                {
                  required:
                    "Timezone is required.",
                },
              )}
              className={inputClassName}
            />
          </Field>

          <Field
            label="Locale"
            error={
              errors.locale?.message
            }
          >
            <input
              type="text"
              disabled={!canManage}
              placeholder="en-US"
              {...register(
                "locale",
                {
                  required:
                    "Locale is required.",
                },
              )}
              className={inputClassName}
            />
          </Field>

          <Field label="Date format">
            <select
              disabled={!canManage}
              {...register(
                "dateFormat",
              )}
              className={inputClassName}
            >
              <option value="MM/DD/YYYY">
                MM/DD/YYYY
              </option>

              <option value="DD/MM/YYYY">
                DD/MM/YYYY
              </option>

              <option value="YYYY-MM-DD">
                YYYY-MM-DD
              </option>
            </select>
          </Field>

          <Field label="Time format">
            <select
              disabled={!canManage}
              {...register(
                "timeFormat",
              )}
              className={inputClassName}
            >
              <option value="12-hour">
                12-hour
              </option>

              <option value="24-hour">
                24-hour
              </option>
            </select>
          </Field>

          <Field label="Week starts on">
            <select
              disabled={!canManage}
              {...register(
                "weekStartsOn",
              )}
              className={inputClassName}
            >
              <option value="sunday">
                Sunday
              </option>

              <option value="monday">
                Monday
              </option>
            </select>
          </Field>
        </div>
      </SettingsSection>

      <SettingsSection
        icon={Bell}
        title="Notification defaults"
        description="Control which categories of organization activity generate notifications by default."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <ToggleField
            label="Email notifications"
            description="Enable organization-level email notifications."
            disabled={!canManage}
            register={register}
            name="emailNotifications"
          />

          <ToggleField
            label="Assignment notifications"
            description="Notify users about assignment activity and status changes."
            disabled={!canManage}
            register={register}
            name="assignmentNotifications"
          />

          <ToggleField
            label="Billing notifications"
            description="Notify finance users about invoices, approvals, and payments."
            disabled={!canManage}
            register={register}
            name="billingNotifications"
          />

          <ToggleField
            label="Compliance notifications"
            description="Notify authorized users about expiring or missing compliance records."
            disabled={!canManage}
            register={register}
            name="complianceNotifications"
          />
        </div>
      </SettingsSection>

      <SettingsSection
        icon={ShieldCheck}
        title="Workflow controls"
        description="Configure approval and communication defaults used by future jobs, assignments, and timesheets."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <ToggleField
            label="Require job approval"
            description="Job requests must be approved before becoming available."
            disabled={!canManage}
            register={register}
            name="requireJobApproval"
          />

          <ToggleField
            label="Require worker approval"
            description="Submitted workers require organization approval."
            disabled={!canManage}
            register={register}
            name="requireWorkerApproval"
          />

          <ToggleField
            label="Require timesheet approval"
            description="Timesheets must be approved before invoicing."
            disabled={!canManage}
            register={register}
            name="requireTimesheetApproval"
          />

          <ToggleField
            label="Allow direct messages"
            description="Permit direct communication between approved marketplace participants."
            disabled={!canManage}
            register={register}
            name="allowDirectMessages"
          />
        </div>
      </SettingsSection>

      <SettingsSection
        icon={BriefcaseBusiness}
        title="Marketplace behavior"
        description="Control how the organization can participate in marketplace discovery and invitations."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Marketplace visibility">
            <select
              disabled={!canManage}
              {...register(
                "marketplaceVisibility",
              )}
              className={inputClassName}
            >
              <option value="private">
                Private
              </option>

              <option value="selected">
                Selected organizations
              </option>

              <option value="marketplace">
                Marketplace
              </option>
            </select>
          </Field>

          <div />

          <ToggleField
            label="Allow marketplace invitations"
            description="Permit other marketplace organizations to send opportunities or collaboration invitations."
            disabled={!canManage}
            register={register}
            name="allowMarketplaceInvites"
          />

          <ToggleField
            label="Allow direct client invitations"
            description="Permit clients to invite the organization directly to jobs or negotiations."
            disabled={!canManage}
            register={register}
            name="allowDirectClientInvites"
          />
        </div>
      </SettingsSection>

      <div className="sticky bottom-5 z-10 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-bold text-slate-950">
            {isDirty
              ? "You have unsaved settings."
              : "All organization settings are saved."}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Settings apply only to the active organization workspace.
          </p>
        </div>

        <button
          type="submit"
          disabled={submitDisabled}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {saving || isSubmitting ? (
            <>
              <LoaderCircle
                size={18}
                className="animate-spin"
              />
              Saving…
            </>
          ) : (
            <>
              <Save size={18} />
              Save changes
            </>
          )}
        </button>
      </div>
    </form>
  );
}

function SettingsSection({
  icon: Icon,
  title,
  description,
  children,
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex items-start gap-4 border-b border-slate-200 pb-6">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Icon size={22} />
        </span>

        <div>
          <h3 className="text-xl font-bold text-slate-950">
            {title}
          </h3>

          <p className="mt-2 leading-7 text-slate-600">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-7">
        {children}
      </div>
    </section>
  );
}

function ToggleField({
  label,
  description,
  disabled,
  register,
  name,
}) {
  return (
    <label className="flex items-start justify-between gap-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <span>
        <span className="block font-bold text-slate-900">
          {label}
        </span>

        <span className="mt-1 block text-sm leading-6 text-slate-600">
          {description}
        </span>
      </span>

      <input
        type="checkbox"
        disabled={disabled}
        {...register(name)}
        className="mt-1 h-5 w-5 shrink-0 rounded border-slate-300"
      />
    </label>
  );
}

function Field({
  label,
  error,
  children,
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">
        {label}
      </span>

      <span className="mt-2 block">
        {children}
      </span>

      {error && (
        <span className="mt-2 block text-sm font-medium text-red-600">
          {error}
        </span>
      )}
    </label>
  );
}

const inputClassName = [
  "min-h-12 w-full rounded-xl border border-slate-300",
  "bg-white px-4 outline-none transition",
  "focus:border-blue-500 focus:ring-4 focus:ring-blue-100",
  "disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500",
].join(" ");
