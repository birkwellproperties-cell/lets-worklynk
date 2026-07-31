import {
  AlertCircle,
  CheckCircle2,
  Image,
  LoaderCircle,
  Palette,
  RefreshCw,
  Save,
  Sparkles,
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

const DEFAULT_COLORS = {
  primaryColor: "#2563EB",
  secondaryColor: "#0F172A",
  accentColor: "#06B6D4",
};

function createDefaultValues(
  organization,
  branding,
) {
  return {
    displayNameOverride:
      branding?.displayNameOverride ??
      "",

    tagline:
      branding?.tagline ??
      "",

    logoPath:
      branding?.logoPath ??
      "",

    logoMarkPath:
      branding?.logoMarkPath ??
      "",

    coverImagePath:
      branding?.coverImagePath ??
      "",

    primaryColor:
      branding?.primaryColor ??
      DEFAULT_COLORS.primaryColor,

    secondaryColor:
      branding?.secondaryColor ??
      DEFAULT_COLORS.secondaryColor,

    accentColor:
      branding?.accentColor ??
      DEFAULT_COLORS.accentColor,

    organizationName:
      organization?.displayName ??
      "",
  };
}

const HEX_COLOR_PATTERN =
  /^#[0-9A-Fa-f]{6}$/;

export default function OrganizationBrandingPage() {
  const {
    hasPermission,
    isPlatformAdministrator,
  } = useAuth();

  const {
    organization,
    branding,
    saving,
    error,
    saveBranding,
    clearError,
  } = useOrganization();

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const canManage =
    isPlatformAdministrator ||
    hasPermission(
      "branding.manage",
    );

  const defaultValues =
    useMemo(
      () =>
        createDefaultValues(
          organization,
          branding,
        ),
      [
        organization,
        branding,
      ],
    );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
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

  const watchedValues =
    watch();

  async function onSubmit(values) {
    clearError();
    setSuccessMessage("");

    await saveBranding({
      displayNameOverride:
        values.displayNameOverride,

      tagline:
        values.tagline,

      logoPath:
        values.logoPath,

      logoMarkPath:
        values.logoMarkPath,

      coverImagePath:
        values.coverImagePath,

      primaryColor:
        values.primaryColor,

      secondaryColor:
        values.secondaryColor,

      accentColor:
        values.accentColor,
    });

    setSuccessMessage(
      "Organization branding saved successfully.",
    );
  }

  function restoreDefaultColors() {
    setValue(
      "primaryColor",
      DEFAULT_COLORS.primaryColor,
      {
        shouldDirty: true,
        shouldValidate: true,
      },
    );

    setValue(
      "secondaryColor",
      DEFAULT_COLORS.secondaryColor,
      {
        shouldDirty: true,
        shouldValidate: true,
      },
    );

    setValue(
      "accentColor",
      DEFAULT_COLORS.accentColor,
      {
        shouldDirty: true,
        shouldValidate: true,
      },
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
            Organization branding
          </p>

          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            Brand identity and marketplace presentation
          </h2>

          <p className="mt-3 max-w-3xl leading-7 text-slate-600">
            Configure the organization name, tagline, logos,
            cover image, and color palette used throughout
            WorkLynk.
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
              Save branding
            </>
          )}
        </button>
      </section>

      {!canManage && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
          Your current role may view branding settings but cannot
          change them.
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
              Branding could not be saved
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

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <BrandSection
            icon={Sparkles}
            title="Brand presentation"
            description="Control the name and tagline displayed in organization-facing experiences."
          >
            <div className="space-y-5">
              <Field label="Display name override">
                <input
                  type="text"
                  disabled={!canManage}
                  placeholder={
                    organization?.displayName
                  }
                  {...register(
                    "displayNameOverride",
                  )}
                  className={inputClassName}
                />
              </Field>

              <Field
                label="Tagline"
                help="A short statement displayed below the organization name."
              >
                <input
                  type="text"
                  disabled={!canManage}
                  maxLength={160}
                  placeholder="Connecting organizations with trusted independent professionals"
                  {...register(
                    "tagline",
                  )}
                  className={inputClassName}
                />
              </Field>
            </div>
          </BrandSection>

          <BrandSection
            icon={Image}
            title="Image assets"
            description="Store paths or URLs for organization branding assets. File uploads will be connected to Supabase Storage in the next branding enhancement."
          >
            <div className="space-y-5">
              <Field label="Primary logo path">
                <input
                  type="text"
                  disabled={!canManage}
                  placeholder="organization-branding/logo.svg"
                  {...register(
                    "logoPath",
                  )}
                  className={inputClassName}
                />
              </Field>

              <Field label="Logo mark path">
                <input
                  type="text"
                  disabled={!canManage}
                  placeholder="organization-branding/mark.svg"
                  {...register(
                    "logoMarkPath",
                  )}
                  className={inputClassName}
                />
              </Field>

              <Field label="Cover image path">
                <input
                  type="text"
                  disabled={!canManage}
                  placeholder="organization-branding/cover.jpg"
                  {...register(
                    "coverImagePath",
                  )}
                  className={inputClassName}
                />
              </Field>
            </div>
          </BrandSection>

          <BrandSection
            icon={Palette}
            title="Brand colors"
            description="Enter six-digit hexadecimal colors used by the organization theme."
            action={
              canManage ? (
                <button
                  type="button"
                  onClick={restoreDefaultColors}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  <RefreshCw size={16} />
                  Restore defaults
                </button>
              ) : null
            }
          >
            <div className="space-y-5">
              <ColorField
                label="Primary color"
                name="primaryColor"
                disabled={!canManage}
                register={register}
                watch={watch}
                setValue={setValue}
                error={
                  errors.primaryColor
                    ?.message
                }
              />

              <ColorField
                label="Secondary color"
                name="secondaryColor"
                disabled={!canManage}
                register={register}
                watch={watch}
                setValue={setValue}
                error={
                  errors.secondaryColor
                    ?.message
                }
              />

              <ColorField
                label="Accent color"
                name="accentColor"
                disabled={!canManage}
                register={register}
                watch={watch}
                setValue={setValue}
                error={
                  errors.accentColor
                    ?.message
                }
              />
            </div>
          </BrandSection>
        </div>

        <BrandPreview
          organization={organization}
          values={watchedValues}
        />
      </section>

      <div className="sticky bottom-5 z-10 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-bold text-slate-950">
            {isDirty
              ? "You have unsaved branding changes."
              : "All branding changes are saved."}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Brand settings are isolated to the active organization.
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

function BrandPreview({
  organization,
  values,
}) {
  const displayName =
    values.displayNameOverride ||
    organization?.displayName ||
    "Organization";

  const primaryColor =
    HEX_COLOR_PATTERN.test(
      values.primaryColor ?? "",
    )
      ? values.primaryColor
      : DEFAULT_COLORS.primaryColor;

  const secondaryColor =
    HEX_COLOR_PATTERN.test(
      values.secondaryColor ?? "",
    )
      ? values.secondaryColor
      : DEFAULT_COLORS.secondaryColor;

  const accentColor =
    HEX_COLOR_PATTERN.test(
      values.accentColor ?? "",
    )
      ? values.accentColor
      : DEFAULT_COLORS.accentColor;

  return (
    <aside className="xl:sticky xl:top-28 xl:self-start">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
        <div
          className="h-44"
          style={{
            background:
              `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
          }}
        />

        <div className="relative px-7 pb-8">
          <div
            className="-mt-12 flex h-24 w-24 items-center justify-center rounded-3xl border-4 border-white text-3xl font-black text-white shadow-lg"
            style={{
              backgroundColor:
                secondaryColor,
            }}
          >
            {displayName
              .slice(0, 1)
              .toUpperCase()}
          </div>

          <p className="mt-6 text-xs font-bold uppercase tracking-[0.15em] text-slate-500">
            Organization preview
          </p>

          <h3 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            {displayName}
          </h3>

          <p className="mt-3 leading-7 text-slate-600">
            {values.tagline ||
              "Add an organization tagline to preview how the marketplace identity will appear."}
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <PreviewColor
              label="Primary"
              value={primaryColor}
            />

            <PreviewColor
              label="Secondary"
              value={secondaryColor}
            />

            <PreviewColor
              label="Accent"
              value={accentColor}
            />
          </div>

          <button
            type="button"
            className="mt-8 min-h-12 w-full rounded-xl px-5 font-bold text-white"
            style={{
              backgroundColor:
                primaryColor,
            }}
          >
            Example primary action
          </button>
        </div>
      </section>
    </aside>
  );
}

function PreviewColor({
  label,
  value,
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600">
      <span
        className="h-3 w-3 rounded-full"
        style={{
          backgroundColor: value,
        }}
      />

      {label}
    </span>
  );
}

function ColorField({
  label,
  name,
  disabled,
  register,
  watch,
  setValue,
  error,
}) {
  const value =
    watch(name);

  return (
    <Field
      label={label}
      error={error}
    >
      <div className="grid grid-cols-[56px_1fr] gap-3">
        <input
          type="color"
          disabled={disabled}
          value={
            HEX_COLOR_PATTERN.test(
              value ?? "",
            )
              ? value
              : "#000000"
          }
          onChange={(event) => {
            setValue(
              name,
              event.target.value
                .toUpperCase(),
              {
                shouldDirty: true,
                shouldValidate: true,
              },
            );
          }}
          className="h-12 w-14 cursor-pointer rounded-xl border border-slate-300 bg-white p-1 disabled:cursor-not-allowed"
        />

        <input
          type="text"
          disabled={disabled}
          maxLength={7}
          {...register(
            name,
            {
              required:
                `${label} is required.`,
              pattern: {
                value:
                  HEX_COLOR_PATTERN,
                message:
                  "Enter a color such as #2563EB.",
              },
            },
          )}
          className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 font-mono uppercase outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
        />
      </div>
    </Field>
  );
}

function BrandSection({
  icon: Icon,
  title,
  description,
  action,
  children,
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
      <div className="flex items-start justify-between gap-5 border-b border-slate-200 pb-5">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Icon size={21} />
          </span>

          <div>
            <h3 className="font-bold text-slate-950">
              {title}
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              {description}
            </p>
          </div>
        </div>

        {action}
      </div>

      <div className="mt-6">
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

const inputClassName = [
  "min-h-12 w-full rounded-xl border border-slate-300",
  "bg-white px-4 outline-none transition",
  "focus:border-blue-500 focus:ring-4 focus:ring-blue-100",
  "disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500",
].join(" ");
