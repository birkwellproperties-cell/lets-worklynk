import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Edit3,
  LoaderCircle,
  MapPin,
  MapPinned,
  Plus,
  Save,
  Star,
  Trash2,
  X,
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

const LOCATION_TYPES = [
  {
    value: "headquarters",
    label: "Headquarters",
  },
  {
    value: "office",
    label: "Office",
  },
  {
    value: "facility",
    label: "Facility",
  },
  {
    value: "worksite",
    label: "Worksite",
  },
  {
    value: "billing",
    label: "Billing",
  },
  {
    value: "remote",
    label: "Remote",
  },
];

const EMPTY_FORM = {
  name: "",
  locationType: "office",
  status: "active",
  isPrimary: false,
  email: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  stateRegion: "",
  postalCode: "",
  countryCode: "US",
  timezone: "America/Chicago",
};

function mapLocationToForm(location) {
  if (!location) {
    return EMPTY_FORM;
  }

  return {
    name:
      location.name ?? "",
    locationType:
      location.locationType ??
      "office",
    status:
      location.status ??
      "active",
    isPrimary:
      Boolean(location.isPrimary),
    email:
      location.email ?? "",
    phone:
      location.phone ?? "",
    addressLine1:
      location.addressLine1 ?? "",
    addressLine2:
      location.addressLine2 ?? "",
    city:
      location.city ?? "",
    stateRegion:
      location.stateRegion ?? "",
    postalCode:
      location.postalCode ?? "",
    countryCode:
      location.countryCode ?? "US",
    timezone:
      location.timezone ??
      "America/Chicago",
  };
}

function formatLocationType(value) {
  return String(value || "office")
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase(),
    );
}

function buildAddress(location) {
  return [
    location.addressLine1,
    location.addressLine2,
    [
      location.city,
      location.stateRegion,
      location.postalCode,
    ]
      .filter(Boolean)
      .join(", "),
    location.countryCode,
  ].filter(Boolean);
}

export default function OrganizationLocationsPage() {
  const {
    hasPermission,
    isPlatformAdministrator,
  } = useAuth();

  const {
    locations,
    saving,
    error,
    createLocation,
    updateLocation,
    archiveLocation,
    clearError,
  } = useOrganization();

  const [
    dialogOpen,
    setDialogOpen,
  ] = useState(false);

  const [
    selectedLocation,
    setSelectedLocation,
  ] = useState(null);

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const canManage =
    isPlatformAdministrator ||
    hasPermission(
      "locations.manage",
    );

  const activeLocations =
    useMemo(
      () =>
        locations.filter(
          (location) =>
            location.status !==
            "archived",
        ),
      [
        locations,
      ],
    );

  function openCreateDialog() {
    clearError();
    setSuccessMessage("");
    setSelectedLocation(null);
    setDialogOpen(true);
  }

  function openEditDialog(location) {
    clearError();
    setSuccessMessage("");
    setSelectedLocation(location);
    setDialogOpen(true);
  }

  function closeDialog() {
    if (saving) {
      return;
    }

    setDialogOpen(false);
    setSelectedLocation(null);
  }

  async function handleArchive(location) {
    const confirmed =
      window.confirm(
        `Archive "${location.name}"? This location will no longer appear in active organization workflows.`,
      );

    if (!confirmed) {
      return;
    }

    clearError();
    setSuccessMessage("");

    try {
      await archiveLocation(
        location.id,
      );

      setSuccessMessage(
        `${location.name} was archived.`,
      );
    } catch {
      // Provider exposes the normalized error.
    }
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-600">
            Organization locations
          </p>

          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            Offices, facilities, and worksites
          </h2>

          <p className="mt-3 max-w-3xl leading-7 text-slate-600">
            Manage headquarters, operating offices, client
            facilities, remote locations, worksites, and billing
            addresses.
          </p>
        </div>

        <button
          type="button"
          disabled={!canManage}
          onClick={openCreateDialog}
          className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          <Plus size={18} />
          Add location
        </button>
      </section>

      {!canManage && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
          You may view organization locations, but your current
          role cannot create, update, or archive them.
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
              Location operation failed
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

      <section className="grid gap-5 md:grid-cols-3">
        <SummaryCard
          label="Active locations"
          value={activeLocations.length}
          icon={MapPinned}
        />

        <SummaryCard
          label="Primary location"
          value={
            activeLocations.find(
              (location) =>
                location.isPrimary,
            )?.name ?? "Not set"
          }
          icon={Star}
        />

        <SummaryCard
          label="Facilities and worksites"
          value={
            activeLocations.filter(
              (location) =>
                [
                  "facility",
                  "worksite",
                ].includes(
                  location.locationType,
                ),
            ).length
          }
          icon={Building2}
        />
      </section>

      {activeLocations.length === 0 ? (
        <EmptyLocations
          canManage={canManage}
          onCreate={openCreateDialog}
        />
      ) : (
        <section className="grid gap-5 lg:grid-cols-2">
          {activeLocations.map(
            (location) => (
              <LocationCard
                key={location.id}
                location={location}
                canManage={canManage}
                saving={saving}
                onEdit={() => {
                  openEditDialog(
                    location,
                  );
                }}
                onArchive={() => {
                  void handleArchive(
                    location,
                  );
                }}
              />
            ),
          )}
        </section>
      )}

      {dialogOpen && (
        <LocationDialog
          location={selectedLocation}
          saving={saving}
          onClose={closeDialog}
          onSaved={(message) => {
            setSuccessMessage(
              message,
            );
            setDialogOpen(false);
            setSelectedLocation(null);
          }}
          createLocation={
            createLocation
          }
          updateLocation={
            updateLocation
          }
        />
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
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

      <p className="mt-2 truncate text-2xl font-bold text-slate-950">
        {value}
      </p>
    </article>
  );
}

function EmptyLocations({
  canManage,
  onCreate,
}) {
  return (
    <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
        <MapPin size={29} />
      </span>

      <h3 className="mt-6 text-2xl font-bold text-slate-950">
        No locations configured
      </h3>

      <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-600">
        Add the organization headquarters or another operating
        location to support departments, job requests, billing,
        and assignment workflows.
      </p>

      {canManage && (
        <button
          type="button"
          onClick={onCreate}
          className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 font-bold text-white hover:bg-blue-700"
        >
          <Plus size={18} />
          Create first location
        </button>
      )}
    </section>
  );
}

function LocationCard({
  location,
  canManage,
  saving,
  onEdit,
  onArchive,
}) {
  const address =
    buildAddress(location);

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-5">
        <div className="flex min-w-0 items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <MapPin size={22} />
          </span>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-xl font-bold text-slate-950">
                {location.name}
              </h3>

              {location.isPrimary && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                  <Star size={13} />
                  Primary
                </span>
              )}
            </div>

            <p className="mt-2 text-sm font-semibold text-blue-600">
              {formatLocationType(
                location.locationType,
              )}
            </p>
          </div>
        </div>

        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold capitalize text-emerald-700">
          {location.status}
        </span>
      </div>

      <div className="mt-6 space-y-2 text-sm leading-6 text-slate-600">
        {address.length > 0 ? (
          address.map(
            (line) => (
              <p key={line}>
                {line}
              </p>
            ),
          )
        ) : (
          <p className="italic text-slate-400">
            No physical address provided.
          </p>
        )}

        {location.phone && (
          <p>{location.phone}</p>
        )}

        {location.email && (
          <p>{location.email}</p>
        )}

        <p>
          Timezone:{" "}
          {location.timezone}
        </p>
      </div>

      {canManage && (
        <div className="mt-7 flex flex-wrap gap-3 border-t border-slate-200 pt-5">
          <button
            type="button"
            disabled={saving}
            onClick={onEdit}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <Edit3 size={16} />
            Edit
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={onArchive}
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            <Trash2 size={16} />
            Archive
          </button>
        </div>
      )}
    </article>
  );
}

function LocationDialog({
  location,
  saving,
  onClose,
  onSaved,
  createLocation,
  updateLocation,
}) {
  const editing =
    Boolean(location);

  const defaultValues =
    useMemo(
      () =>
        mapLocationToForm(
          location,
        ),
      [
        location,
      ],
    );

  const {
    register,
    handleSubmit,
    reset,
    formState: {
      errors,
      isSubmitting,
    },
  } = useForm({
    defaultValues,
  });

  useEffect(() => {
    reset(defaultValues);
  }, [
    defaultValues,
    reset,
  ]);

  async function onSubmit(values) {
    const payload = {
      name: values.name,
      locationType:
        values.locationType,
      status:
        values.status,
      isPrimary:
        values.isPrimary,
      email:
        values.email,
      phone:
        values.phone,
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
      timezone:
        values.timezone,
    };

    if (editing) {
      await updateLocation(
        location.id,
        payload,
      );

      onSaved(
        `${values.name} was updated successfully.`,
      );

      return;
    }

    await createLocation(
      payload,
    );

    onSaved(
      `${values.name} was created successfully.`,
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-8">
      <button
        type="button"
        aria-label="Close location dialog"
        onClick={onClose}
        className="absolute inset-0"
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="location-dialog-title"
        className="relative z-10 max-h-full w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl"
      >
        <header className="sticky top-0 z-10 flex items-start justify-between gap-5 border-b border-slate-200 bg-white px-6 py-5 sm:px-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.15em] text-blue-600">
              Organization location
            </p>

            <h2
              id="location-dialog-title"
              className="mt-2 text-2xl font-bold text-slate-950"
            >
              {editing
                ? "Edit location"
                : "Create location"}
            </h2>
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

        <form
          onSubmit={handleSubmit(
            onSubmit,
          )}
          className="space-y-7 p-6 sm:p-8"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <Field
              label="Location name"
              error={
                errors.name?.message
              }
            >
              <input
                type="text"
                {...register(
                  "name",
                  {
                    required:
                      "Location name is required.",
                  },
                )}
                className={inputClassName}
              />
            </Field>

            <Field label="Location type">
              <select
                {...register(
                  "locationType",
                )}
                className={inputClassName}
              >
                {LOCATION_TYPES.map(
                  (type) => (
                    <option
                      key={type.value}
                      value={type.value}
                    >
                      {type.label}
                    </option>
                  ),
                )}
              </select>
            </Field>

            <Field label="Status">
              <select
                {...register(
                  "status",
                )}
                className={inputClassName}
              >
                <option value="active">
                  Active
                </option>

                <option value="inactive">
                  Inactive
                </option>
              </select>
            </Field>

            <label className="flex min-h-12 items-center gap-3 self-end rounded-xl border border-slate-300 bg-slate-50 px-4">
              <input
                type="checkbox"
                {...register(
                  "isPrimary",
                )}
                className="h-4 w-4 rounded border-slate-300"
              />

              <span className="text-sm font-semibold text-slate-700">
                Set as primary location
              </span>
            </label>
          </div>

          <div className="border-t border-slate-200 pt-7">
            <h3 className="font-bold text-slate-950">
              Address
            </h3>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <Field label="Address line 1">
                  <input
                    type="text"
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
                  {...register("city")}
                  className={inputClassName}
                />
              </Field>

              <Field label="State or region">
                <input
                  type="text"
                  {...register(
                    "stateRegion",
                  )}
                  className={inputClassName}
                />
              </Field>

              <Field label="Postal code">
                <input
                  type="text"
                  {...register(
                    "postalCode",
                  )}
                  className={inputClassName}
                />
              </Field>

              <Field
                label="Country code"
                error={
                  errors.countryCode
                    ?.message
                }
              >
                <input
                  type="text"
                  maxLength={2}
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
          </div>

          <div className="border-t border-slate-200 pt-7">
            <h3 className="font-bold text-slate-950">
              Contact and timezone
            </h3>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <Field
                label="Email"
                error={
                  errors.email?.message
                }
              >
                <input
                  type="email"
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
                  className={inputClassName}
                />
              </Field>

              <Field label="Phone">
                <input
                  type="tel"
                  {...register("phone")}
                  className={inputClassName}
                />
              </Field>

              <div className="md:col-span-2">
                <Field
                  label="Timezone"
                  error={
                    errors.timezone
                      ?.message
                  }
                >
                  <input
                    type="text"
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
              </div>
            </div>
          </div>

          <footer className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="min-h-12 rounded-xl border border-slate-300 px-6 font-bold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                saving ||
                isSubmitting
              }
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
            >
              {saving ||
              isSubmitting ? (
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
                  {editing
                    ? "Save changes"
                    : "Create location"}
                </>
              )}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

const inputClassName = [
  "min-h-12 w-full rounded-xl border border-slate-300",
  "bg-white px-4 outline-none transition",
  "focus:border-blue-500 focus:ring-4 focus:ring-blue-100",
].join(" ");

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
