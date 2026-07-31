import {
  AlertCircle,
  Building2,
  CheckCircle2,
  CreditCard,
  LoaderCircle,
  Mail,
  MapPin,
  Phone,
  ReceiptText,
  Save,
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

function createDefaultValues(
  organization,
  billingProfile,
) {
  return {
    billingLegalName:
      billingProfile?.billingLegalName ??
      organization?.legalName ??
      "",

    billingEmail:
      billingProfile?.billingEmail ??
      organization?.email ??
      "",

    billingPhone:
      billingProfile?.billingPhone ??
      organization?.phone ??
      "",

    addressLine1:
      billingProfile?.addressLine1 ??
      "",

    addressLine2:
      billingProfile?.addressLine2 ??
      "",

    city:
      billingProfile?.city ?? "",

    stateRegion:
      billingProfile?.stateRegion ??
      "",

    postalCode:
      billingProfile?.postalCode ??
      "",

    countryCode:
      billingProfile?.countryCode ??
      "US",

    currencyCode:
      billingProfile?.currencyCode ??
      "USD",

    paymentTermsDays:
      billingProfile?.paymentTermsDays ??
      30,

    invoicePrefix:
      billingProfile?.invoicePrefix ??
      "",

    purchaseOrderRequired:
      Boolean(
        billingProfile
          ?.purchaseOrderRequired,
      ),

    taxIdLastFour:
      billingProfile?.taxIdLastFour ??
      "",
  };
}

export default function OrganizationBillingPage() {
  const {
    hasPermission,
    isPlatformAdministrator,
  } = useAuth();

  const {
    organization,
    billingProfile,
    saving,
    error,
    saveBillingProfile,
    clearError,
  } = useOrganization();

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const canManage =
    isPlatformAdministrator ||
    hasPermission(
      "billing.manage",
    );

  const defaultValues =
    useMemo(
      () =>
        createDefaultValues(
          organization,
          billingProfile,
        ),
      [
        organization,
        billingProfile,
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

    await saveBillingProfile({
      billingLegalName:
        values.billingLegalName,

      billingEmail:
        values.billingEmail,

      billingPhone:
        values.billingPhone,

      addressLine1:
        values.addressLine1,

      addressLine2:
        values.addressLine2,

      city:
        values.city,

      stateRegion:
        values.stateRegion,

      postalCode:
        values.postalCode,

      countryCode:
        values.countryCode,

      currencyCode:
        values.currencyCode,

      paymentTermsDays:
        values.paymentTermsDays,

      invoicePrefix:
        values.invoicePrefix,

      purchaseOrderRequired:
        values.purchaseOrderRequired,

      taxIdLastFour:
        values.taxIdLastFour,
    });

    setSuccessMessage(
      "Billing profile saved successfully.",
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
            Organization billing
          </p>

          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            Billing identity and invoice defaults
          </h2>

          <p className="mt-3 max-w-3xl leading-7 text-slate-600">
            Manage the legal billing name, invoice address,
            payment terms, tax reference, currency, and
            purchase-order requirements.
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
              Save billing
            </>
          )}
        </button>
      </section>

      {!canManage && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
          Your current role may view billing information but
          cannot change it.
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
              Billing profile could not be saved
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

      <BillingSection
        icon={Building2}
        title="Billing identity"
        description="These values appear on invoices and other financial records."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <Field
            label="Billing legal name"
            error={
              errors.billingLegalName
                ?.message
            }
          >
            <input
              type="text"
              disabled={!canManage}
              {...register(
                "billingLegalName",
                {
                  required:
                    "Billing legal name is required.",
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
              disabled={!canManage}
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

          <Field
            label="Billing email"
            error={
              errors.billingEmail
                ?.message
            }
          >
            <IconInput icon={Mail}>
              <input
                type="email"
                disabled={!canManage}
                {...register(
                  "billingEmail",
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

          <Field label="Billing phone">
            <IconInput icon={Phone}>
              <input
                type="tel"
                disabled={!canManage}
                {...register(
                  "billingPhone",
                )}
                className={embeddedInputClassName}
              />
            </IconInput>
          </Field>
        </div>
      </BillingSection>

      <BillingSection
        icon={MapPin}
        title="Invoice address"
        description="This address is used for invoices and financial correspondence."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <Field label="Address line 1">
              <input
                type="text"
                disabled={!canManage}
                {...register(
                  "addressLine1",
                )}
                className={inputClassName}
              />
            </Field>
          </div>

          <div className="md:col-span-2">
            <Field label="Address line 2">
              <input
                type="text"
                disabled={!canManage}
                {...register(
                  "addressLine2",
                )}
                className={inputClassName}
              />
            </Field>
          </div>

          <Field label="City">
            <input
              type="text"
              disabled={!canManage}
              {...register("city")}
              className={inputClassName}
            />
          </Field>

          <Field label="State or region">
            <input
              type="text"
              disabled={!canManage}
              {...register(
                "stateRegion",
              )}
              className={inputClassName}
            />
          </Field>

          <Field label="Postal code">
            <input
              type="text"
              disabled={!canManage}
              {...register(
                "postalCode",
              )}
              className={inputClassName}
            />
          </Field>

          <Field
            label="Country code"
            error={
              errors.countryCode?.message
            }
          >
            <input
              type="text"
              maxLength={2}
              disabled={!canManage}
              {...register(
                "countryCode",
                {
                  required:
                    "Country code is required.",
                  pattern: {
                    value:
                      /^[A-Za-z]{2}$/,
                    message:
                      "Use a two-letter country code.",
                  },
                },
              )}
              className={[
                inputClassName,
                "uppercase",
              ].join(" ")}
            />
          </Field>
        </div>
      </BillingSection>

      <BillingSection
        icon={ReceiptText}
        title="Invoice defaults"
        description="Set the default values used when future invoices are generated."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <Field
            label="Currency code"
            error={
              errors.currencyCode
                ?.message
            }
          >
            <input
              type="text"
              maxLength={3}
              disabled={!canManage}
              {...register(
                "currencyCode",
                {
                  required:
                    "Currency code is required.",
                  pattern: {
                    value:
                      /^[A-Za-z]{3}$/,
                    message:
                      "Use a three-letter currency code.",
                  },
                },
              )}
              className={[
                inputClassName,
                "uppercase",
              ].join(" ")}
            />
          </Field>

          <Field
            label="Payment terms"
            help="Number of days after invoice issue before payment is due."
            error={
              errors.paymentTermsDays
                ?.message
            }
          >
            <input
              type="number"
              min={0}
              max={365}
              disabled={!canManage}
              {...register(
                "paymentTermsDays",
                {
                  required:
                    "Payment terms are required.",
                  min: {
                    value: 0,
                    message:
                      "Payment terms cannot be negative.",
                  },
                  max: {
                    value: 365,
                    message:
                      "Payment terms cannot exceed 365 days.",
                  },
                },
              )}
              className={inputClassName}
            />
          </Field>

          <Field
            label="Invoice prefix"
            help="Optional prefix such as TWL, INV, or CLIENT."
            error={
              errors.invoicePrefix
                ?.message
            }
          >
            <input
              type="text"
              maxLength={20}
              disabled={!canManage}
              {...register(
                "invoicePrefix",
                {
                  pattern: {
                    value:
                      /^$|^[A-Za-z0-9_-]{1,20}$/,
                    message:
                      "Use letters, numbers, underscores, or hyphens.",
                  },
                },
              )}
              className={inputClassName}
            />
          </Field>

          <label className="flex min-h-12 items-center gap-3 self-end rounded-xl border border-slate-300 bg-slate-50 px-4">
            <input
              type="checkbox"
              disabled={!canManage}
              {...register(
                "purchaseOrderRequired",
              )}
              className="h-4 w-4 rounded border-slate-300"
            />

            <span className="text-sm font-semibold text-slate-700">
              Require purchase order on invoices
            </span>
          </label>
        </div>
      </BillingSection>

      <BillingPreview
        organization={organization}
        billingProfile={billingProfile}
      />

      <div className="sticky bottom-5 z-10 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-bold text-slate-950">
            {isDirty
              ? "You have unsaved billing changes."
              : "All billing changes are saved."}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Billing data is protected by billing permissions and
            Row-Level Security.
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

function BillingPreview({
  organization,
  billingProfile,
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-slate-950 p-7 text-white shadow-xl shadow-slate-900/10">
      <div className="flex items-start justify-between gap-5">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.15em] text-cyan-300">
            Billing summary
          </p>

          <h3 className="mt-3 text-2xl font-bold">
            {billingProfile?.billingLegalName ||
              organization?.legalName ||
              "Organization billing"}
          </h3>
        </div>

        <CreditCard
          size={27}
          className="text-cyan-300"
        />
      </div>

      <div className="mt-7 grid gap-5 md:grid-cols-3">
        <PreviewItem
          label="Currency"
          value={
            billingProfile?.currencyCode ??
            "USD"
          }
        />

        <PreviewItem
          label="Payment terms"
          value={`Net ${
            billingProfile
              ?.paymentTermsDays ?? 30
          }`}
        />

        <PreviewItem
          label="Invoice prefix"
          value={
            billingProfile?.invoicePrefix ||
            "Not configured"
          }
        />
      </div>
    </section>
  );
}

function PreviewItem({
  label,
  value,
}) {
  return (
    <div className="rounded-2xl bg-white/10 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-300">
        {label}
      </p>

      <p className="mt-2 font-bold text-white">
        {value}
      </p>
    </div>
  );
}

function BillingSection({
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

const inputClassName = [
  "min-h-12 w-full rounded-xl border border-slate-300",
  "bg-white px-4 outline-none transition",
  "focus:border-blue-500 focus:ring-4 focus:ring-blue-100",
  "disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500",
].join(" ");

const embeddedInputClassName = [
  "min-h-12 w-full border-0 bg-transparent py-3 outline-none",
  "disabled:cursor-not-allowed disabled:text-slate-500",
].join(" ");
