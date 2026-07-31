import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Globe2,
  LoaderCircle,
  Mail,
  Phone,
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

const EMPLOYEE_SIZE_OPTIONS = [
  {
    value: "",
    label: "Not specified",
  },
  {
    value: "1-10",
    label: "1–10",
  },
  {
    value: "11-50",
    label: "11–50",
  },
  {
    value: "51-200",
    label: "51–200",
  },
  {
    value: "201-500",
    label: "201–500",
  },
  {
    value: "501-1000",
    label: "501–1,000",
  },
  {
    value: "1001-5000",
    label: "1,001–5,000",
  },
  {
    value: "5001+",
    label: "5,001+",
  },
];

const VISIBILITY_OPTIONS = [
  {
    value: "private",
    label: "Private",
    description:
      "Only authorized members and platform administrators can view the profile.",
  },
  {
    value: "marketplace",
    label: "Marketplace",
    description:
      "Authenticated marketplace participants may discover the organization.",
  },
  {
    value: "public",
    label: "Public",
    description:
      "The profile may be displayed on public-facing marketplace pages.",
  },
];

function createDefaultValues(
  organization,
  profile,
) {
  return {
    legalName:
      organization?.legalName ?? "",
    displayName:
      organization?.displayName ?? "",
    email:
      organization?.email ?? "",
    phone:
      organization?.phone ?? "",
    websiteUrl:
      organization?.websiteUrl ?? "",
    taxIdLastFour:
      organization?.taxIdLastFour ?? "",

    profileVisibility:
      profile?.profileVisibility ??
      "private",

    marketplaceHeadline:
      profile?.marketplaceHeadline ??
      "",

    shortDescription:
      profile?.shortDescription ??
      "",

    fullDescription:
      profile?.fullDescription ??
      "",

    industryCode:
      profile?.industryCode ?? "",

    industryName:
      profile?.industryName ?? "",

    employeeSizeRange:
      profile?.employeeSizeRange ??
      "",

    yearEstablished:
      profile?.yearEstablished ?? "",

    primaryContactName:
      profile?.primaryContactName ??
      "",

    primaryContactEmail:
      profile?.primaryContactEmail ??
      "",

    primaryContactPhone:
      profile?.primaryContactPhone ??
      "",

    supportEmail:
      profile?.supportEmail ?? "",

    supportPhone:
      profile?.supportPhone ?? "",

    timezone:
      profile?.timezone ??
      "America/Chicago",

    locale:
      profile?.locale ??
      "en-US",

    currencyCode:
      profile?.currencyCode ??
      "USD",
  };
}

export default function OrganizationProfilePage() {
  const {
    hasPermission,
    isPlatformAdministrator,
  } = useAuth();

  const {
    organization,
    profile,
    saving,
    error,
    updateOrganization,
    saveProfile,
    clearError,
  } = useOrganization();

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const canEdit =
    isPlatformAdministrator ||
    hasPermission(
      "organizations.update",
    );

  const defaultValues =
    useMemo(
      () =>
        createDefaultValues(
          organization,
          profile,
        ),
      [
        organization,
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

    await updateOrganization({
      legalName:
        values.legalName,
      displayName:
        values.displayName,
      email:
        values.email,
      phone:
        values.phone,
      websiteUrl:
        values.websiteUrl,
      taxIdLastFour:
        values.taxIdLastFour,
    });

    await saveProfile({
      profileVisibility:
        values.profileVisibility,

      marketplaceHeadline:
        values.marketplaceHeadline,

      shortDescription:
        values.shortDescription,

      fullDescription:
        values.fullDescription,

      industryCode:
        values.industryCode,

      industryName:
        values.industryName,

      employeeSizeRange:
        values.employeeSizeRange,

      yearEstablished:
        values.yearEstablished,

      primaryContactName:
        values.primaryContactName,

      primaryContactEmail:
        values.primaryContactEmail,

      primaryContactPhone:
        values.primaryContactPhone,

      supportEmail:
        values.supportEmail,

      supportPhone:
        values.supportPhone,

      timezone:
        values.timezone,

      locale:
        values.locale,

      currencyCode:
        values.currencyCode,
    });

    setSuccessMessage(
      "Organization profile saved successfully.",
    );
  }

  const submitDisabled =
    !canEdit ||
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
            Organization profile
          </p>

          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            Identity and marketplace profile
          </h2>

          <p className="mt-3 max-w-3xl leading-7 text-slate-600">
            Manage the legal identity, public presentation,
            industry details, and primary contacts associated
            with this organization.
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
              Save profile
            </>
          )}
        </button>
      </section>

      {!canEdit && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
          <ShieldCheck
            size={20}
            className="mt-0.5 shrink-0"
          />

          <div>
            <p className="font-bold">
              Read-only access
            </p>

            <p className="mt-1 text-sm leading-6">
              You may view this profile, but your current role
              does not have permission to update organization
              information.
            </p>
          </div>
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
              Profile could not be saved
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

      <FormSection
        icon={Building2}
        eyebrow="Organization identity"
        title="Legal and operating information"
        description="These values identify the organization throughout WorkLynk."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <Field
            label="Legal name"
            error={
              errors.legalName?.message
            }
          >
            <input
              type="text"
              disabled={!canEdit}
              {...register(
                "legalName",
                {
                  required:
                    "Legal name is required.",
                  minLength: {
                    value: 2,
                    message:
                      "Legal name must contain at least two characters.",
                  },
                },
              )}
              className={inputClassName}
            />
          </Field>

          <Field
            label="Display name"
            error={
              errors.displayName
                ?.message
            }
          >
            <input
              type="text"
              disabled={!canEdit}
              {...register(
                "displayName",
                {
                  required:
                    "Display name is required.",
                  minLength: {
                    value: 2,
                    message:
                      "Display name must contain at least two characters.",
                  },
                },
              )}
              className={inputClassName}
            />
          </Field>

          <Field
            label="Organization type"
            help="Organization type is controlled by the platform and cannot be changed here."
          >
            <input
              type="text"
              readOnly
              value={
                organization
                  ?.organizationType ??
                ""
              }
              className={[
                inputClassName,
                "capitalize",
              ].join(" ")}
            />
          </Field>

          <Field
            label="Organization number"
          >
            <input
              type="text"
              readOnly
              value={
                organization
                  ?.organizationNumber
                  ? `#${organization.organizationNumber}`
                  : ""
              }
              className={inputClassName}
            />
          </Field>

          <Field
            label="Website"
            error={
              errors.websiteUrl?.message
            }
          >
            <input
              type="url"
              disabled={!canEdit}
              placeholder="https://example.com"
              {...register(
                "websiteUrl",
                {
                  pattern: {
                    value:
                      /^https?:\/\/.+/i,
                    message:
                      "Enter a complete URL beginning with http:// or https://.",
                  },
                },
              )}
              className={inputClassName}
            />
          </Field>

          <Field
            label="Tax ID last four"
            help="Only the last four digits are stored."
            error={
              errors.taxIdLastFour
                ?.message
            }
          >
            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              disabled={!canEdit}
              placeholder="1234"
              {...register(
                "taxIdLastFour",
                {
                  pattern: {
                    value:
                      /^$|^\d{4}$/,
                    message:
                      "Enter exactly four digits.",
                  },
                },
              )}
              className={inputClassName}
            />
          </Field>
        </div>
      </FormSection>

      <FormSection
        icon={Globe2}
        eyebrow="Marketplace identity"
        title="How the organization appears"
        description="Control marketplace visibility and explain what the organization offers."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <Field
            label="Profile visibility"
          >
            <select
              disabled={!canEdit}
              {...register(
                "profileVisibility",
              )}
              className={inputClassName}
            >
              {VISIBILITY_OPTIONS.map(
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
          </Field>

          <Field
            label="Marketplace headline"
            help="A concise statement shown near the organization name."
          >
            <input
              type="text"
              disabled={!canEdit}
              maxLength={140}
              placeholder="Trusted workforce solutions for growing organizations"
              {...register(
                "marketplaceHeadline",
              )}
              className={inputClassName}
            />
          </Field>

          <Field
            label="Industry"
          >
            <input
              type="text"
              disabled={!canEdit}
              placeholder="Healthcare, logistics, construction…"
              {...register(
                "industryName",
              )}
              className={inputClassName}
            />
          </Field>

          <Field
            label="Industry code"
          >
            <input
              type="text"
              disabled={!canEdit}
              placeholder="Optional NAICS or internal code"
              {...register(
                "industryCode",
              )}
              className={inputClassName}
            />
          </Field>

          <Field
            label="Employee size"
          >
            <select
              disabled={!canEdit}
              {...register(
                "employeeSizeRange",
              )}
              className={inputClassName}
            >
              {EMPLOYEE_SIZE_OPTIONS.map(
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
          </Field>

          <Field
            label="Year established"
            error={
              errors.yearEstablished
                ?.message
            }
          >
            <input
              type="number"
              disabled={!canEdit}
              min={1800}
              max={2200}
              {...register(
                "yearEstablished",
                {
                  min: {
                    value: 1800,
                    message:
                      "Year must be 1800 or later.",
                  },
                  max: {
                    value: 2200,
                    message:
                      "Year must be 2200 or earlier.",
                  },
                },
              )}
              className={inputClassName}
            />
          </Field>

          <div className="md:col-span-2">
            <Field
              label="Short description"
              help="A brief summary used on cards and search results."
            >
              <textarea
                rows={3}
                disabled={!canEdit}
                maxLength={400}
                {...register(
                  "shortDescription",
                )}
                className={textareaClassName}
              />
            </Field>
          </div>

          <div className="md:col-span-2">
            <Field
              label="Full description"
              help="A detailed organization overview for the marketplace profile."
            >
              <textarea
                rows={7}
                disabled={!canEdit}
                {...register(
                  "fullDescription",
                )}
                className={textareaClassName}
              />
            </Field>
          </div>
        </div>
      </FormSection>

      <FormSection
        icon={Mail}
        eyebrow="Contact information"
        title="Organization and support contacts"
        description="Define the public organization contact and internal support channels."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <Field
            label="Organization email"
            error={
              errors.email?.message
            }
          >
            <IconInput icon={Mail}>
              <input
                type="email"
                disabled={!canEdit}
                {...register(
                  "email",
                  {
                    pattern: {
                      value:
                        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message:
                        "Enter a valid email address.",
                    },
                  },
                )}
                className={embeddedInputClassName}
              />
            </IconInput>
          </Field>

          <Field
            label="Organization phone"
          >
            <IconInput icon={Phone}>
              <input
                type="tel"
                disabled={!canEdit}
                {...register(
                  "phone",
                )}
                className={embeddedInputClassName}
              />
            </IconInput>
          </Field>

          <Field
            label="Primary contact name"
          >
            <input
              type="text"
              disabled={!canEdit}
              {...register(
                "primaryContactName",
              )}
              className={inputClassName}
            />
          </Field>

          <Field
            label="Primary contact email"
            error={
              errors
                .primaryContactEmail
                ?.message
            }
          >
            <input
              type="email"
              disabled={!canEdit}
              {...register(
                "primaryContactEmail",
                {
                  pattern: {
                    value:
                      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message:
                      "Enter a valid email address.",
                  },
                },
              )}
              className={inputClassName}
            />
          </Field>

          <Field
            label="Primary contact phone"
          >
            <input
              type="tel"
              disabled={!canEdit}
              {...register(
                "primaryContactPhone",
              )}
              className={inputClassName}
            />
          </Field>

          <Field
            label="Support email"
            error={
              errors.supportEmail
                ?.message
            }
          >
            <input
              type="email"
              disabled={!canEdit}
              {...register(
                "supportEmail",
                {
                  pattern: {
                    value:
                      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message:
                      "Enter a valid email address.",
                  },
                },
              )}
              className={inputClassName}
            />
          </Field>

          <Field
            label="Support phone"
          >
            <input
              type="tel"
              disabled={!canEdit}
              {...register(
                "supportPhone",
              )}
              className={inputClassName}
            />
          </Field>
        </div>
      </FormSection>

      <FormSection
        icon={ShieldCheck}
        eyebrow="Regional preferences"
        title="Locale and financial defaults"
        description="These defaults will be inherited by future organization workflows."
      >
        <div className="grid gap-5 md:grid-cols-3">
          <Field label="Timezone">
            <input
              type="text"
              disabled={!canEdit}
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

          <Field label="Locale">
            <input
              type="text"
              disabled={!canEdit}
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

          <Field
            label="Currency"
            error={
              errors.currencyCode
                ?.message
            }
          >
            <input
              type="text"
              disabled={!canEdit}
              maxLength={3}
              placeholder="USD"
              {...register(
                "currencyCode",
                {
                  required:
                    "Currency is required.",
                  pattern: {
                    value:
                      /^[A-Za-z]{3}$/,
                    message:
                      "Enter a three-letter currency code.",
                  },
                },
              )}
              className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 uppercase outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
            />
          </Field>
        </div>
      </FormSection>

      <div className="sticky bottom-5 z-10 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-bold text-slate-950">
            {isDirty
              ? "You have unsaved changes."
              : "All profile changes are saved."}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Organization updates are protected by workspace
            permissions and Row-Level Security.
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

const inputClassName = [
  "min-h-12 w-full rounded-xl border border-slate-300",
  "bg-white px-4 outline-none transition",
  "focus:border-blue-500 focus:ring-4 focus:ring-blue-100",
  "disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500",
].join(" ");

const textareaClassName = [
  "w-full resize-y rounded-xl border border-slate-300",
  "bg-white px-4 py-3 outline-none transition",
  "focus:border-blue-500 focus:ring-4 focus:ring-blue-100",
  "disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500",
].join(" ");

const embeddedInputClassName = [
  "min-h-12 w-full border-0 bg-transparent py-3 outline-none",
  "disabled:cursor-not-allowed disabled:text-slate-500",
].join(" ");

function FormSection({
  icon: Icon,
  eyebrow,
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
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-600">
            {eyebrow}
          </p>

          <h3 className="mt-2 text-xl font-bold text-slate-950">
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

function Field({
  label,
  help,
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

      {error ? (
        <span className="mt-2 block text-sm font-medium text-red-600">
          {error}
        </span>
      ) : help ? (
        <span className="mt-2 block text-sm leading-6 text-slate-500">
          {help}
        </span>
      ) : null}
    </label>
  );
}

function IconInput({
  icon: Icon,
  children,
}) {
  return (
    <span className="flex items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100">
      <Icon
        size={18}
        className="shrink-0 text-slate-400"
      />

      {children}
    </span>
  );
}
