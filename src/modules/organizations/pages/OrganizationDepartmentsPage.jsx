import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Edit3,
  FolderTree,
  Layers3,
  LoaderCircle,
  MapPin,
  Network,
  Plus,
  Save,
  Search,
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

const EMPTY_FORM = {
  name: "",
  code: "",
  description: "",
  locationId: "",
  parentDepartmentId: "",
  status: "active",
};

function mapDepartmentToForm(
  department,
) {
  if (!department) {
    return EMPTY_FORM;
  }

  return {
    name:
      department.name ?? "",
    code:
      department.code ?? "",
    description:
      department.description ?? "",
    locationId:
      department.locationId ?? "",
    parentDepartmentId:
      department.parentDepartmentId ??
      "",
    status:
      department.status ??
      "active",
  };
}

function formatStatus(status) {
  return String(status || "active")
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase(),
    );
}

function buildDepartmentTree(
  departments,
) {
  const childrenByParent =
    new Map();

  departments.forEach(
    (department) => {
      const parentId =
        department.parentDepartmentId ??
        null;

      const children =
        childrenByParent.get(
          parentId,
        ) ?? [];

      children.push(department);

      childrenByParent.set(
        parentId,
        children,
      );
    },
  );

  for (
    const children
    of childrenByParent.values()
  ) {
    children.sort(
      (left, right) =>
        left.name.localeCompare(
          right.name,
        ),
    );
  }

  const rows = [];

  function visit(
    parentId,
    depth,
    visited,
  ) {
    const children =
      childrenByParent.get(
        parentId,
      ) ?? [];

    children.forEach(
      (department) => {
        if (
          visited.has(
            department.id,
          )
        ) {
          return;
        }

        const nextVisited =
          new Set(visited);

        nextVisited.add(
          department.id,
        );

        rows.push({
          department,
          depth,
        });

        visit(
          department.id,
          depth + 1,
          nextVisited,
        );
      },
    );
  }

  visit(
    null,
    0,
    new Set(),
  );

  const includedIds =
    new Set(
      rows.map(
        (row) =>
          row.department.id,
      ),
    );

  departments
    .filter(
      (department) =>
        !includedIds.has(
          department.id,
        ),
    )
    .sort(
      (left, right) =>
        left.name.localeCompare(
          right.name,
        ),
    )
    .forEach(
      (department) => {
        rows.push({
          department,
          depth: 0,
        });
      },
    );

  return rows;
}

export default function OrganizationDepartmentsPage() {
  const {
    hasPermission,
    isPlatformAdministrator,
  } = useAuth();

  const {
    departments,
    locations,
    saving,
    error,
    createDepartment,
    updateDepartment,
    archiveDepartment,
    clearError,
  } = useOrganization();

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("active");

  const [
    locationFilter,
    setLocationFilter,
  ] = useState("all");

  const [
    dialogOpen,
    setDialogOpen,
  ] = useState(false);

  const [
    selectedDepartment,
    setSelectedDepartment,
  ] = useState(null);

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const canManage =
    isPlatformAdministrator ||
    hasPermission(
      "departments.manage",
    );

  const activeLocations =
    useMemo(
      () =>
        locations.filter(
          (location) =>
            location.status ===
            "active",
        ),
      [
        locations,
      ],
    );

  const filteredDepartments =
    useMemo(
      () => {
        const normalizedSearch =
          search
            .trim()
            .toLowerCase();

        return departments.filter(
          (department) => {
            const matchesSearch =
              !normalizedSearch ||
              department.name
                .toLowerCase()
                .includes(
                  normalizedSearch,
                ) ||
              department.code
                ?.toLowerCase()
                .includes(
                  normalizedSearch,
                ) ||
              department.description
                ?.toLowerCase()
                .includes(
                  normalizedSearch,
                );

            const matchesStatus =
              statusFilter === "all" ||
              department.status ===
                statusFilter;

            const matchesLocation =
              locationFilter ===
                "all" ||
              (
                locationFilter ===
                  "unassigned"
                  ? !department.locationId
                  : department.locationId ===
                    locationFilter
              );

            return (
              matchesSearch &&
              matchesStatus &&
              matchesLocation
            );
          },
        );
      },
      [
        departments,
        locationFilter,
        search,
        statusFilter,
      ],
    );

  const treeRows =
    useMemo(
      () =>
        buildDepartmentTree(
          filteredDepartments,
        ),
      [
        filteredDepartments,
      ],
    );

  const childCounts =
    useMemo(
      () => {
        const counts =
          new Map();

        departments.forEach(
          (department) => {
            if (
              !department
                .parentDepartmentId
            ) {
              return;
            }

            counts.set(
              department
                .parentDepartmentId,
              (
                counts.get(
                  department
                    .parentDepartmentId,
                ) ?? 0
              ) + 1,
            );
          },
        );

        return counts;
      },
      [
        departments,
      ],
    );

  function openCreateDialog() {
    clearError();
    setSuccessMessage("");
    setSelectedDepartment(null);
    setDialogOpen(true);
  }

  function openEditDialog(
    department,
  ) {
    clearError();
    setSuccessMessage("");
    setSelectedDepartment(
      department,
    );
    setDialogOpen(true);
  }

  function closeDialog() {
    if (saving) {
      return;
    }

    setDialogOpen(false);
    setSelectedDepartment(null);
  }

  async function handleArchive(
    department,
  ) {
    const childCount =
      childCounts.get(
        department.id,
      ) ?? 0;

    const warning =
      childCount > 0
        ? ` This department currently has ${childCount} child department(s).`
        : "";

    const confirmed =
      window.confirm(
        `Archive "${department.name}"?${warning}`,
      );

    if (!confirmed) {
      return;
    }

    clearError();
    setSuccessMessage("");

    try {
      await archiveDepartment(
        department.id,
      );

      setSuccessMessage(
        `${department.name} was archived.`,
      );
    } catch {
      // Provider exposes normalized errors.
    }
  }

  function getLocationName(
    locationId,
  ) {
    if (!locationId) {
      return "Organization-wide";
    }

    return (
      locations.find(
        (location) =>
          location.id ===
          locationId,
      )?.name ??
      "Unknown location"
    );
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-600">
            Organization departments
          </p>

          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            Departments, divisions, and teams
          </h2>

          <p className="mt-3 max-w-3xl leading-7 text-slate-600">
            Build the organization hierarchy used by job requests,
            workforce assignments, approvals, reporting, and future
            cost-center workflows.
          </p>
        </div>

        <button
          type="button"
          disabled={!canManage}
          onClick={openCreateDialog}
          className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          <Plus size={18} />
          Add department
        </button>
      </section>

      {!canManage && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
          You may view departments, but your current role cannot
          create, update, or archive them.
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
              Department operation failed
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
          icon={Network}
          label="Active departments"
          value={
            departments.filter(
              (department) =>
                department.status ===
                "active",
            ).length
          }
        />

        <SummaryCard
          icon={Layers3}
          label="Top-level departments"
          value={
            departments.filter(
              (department) =>
                department.status ===
                  "active" &&
                !department
                  .parentDepartmentId,
            ).length
          }
        />

        <SummaryCard
          icon={MapPin}
          label="Location assignments"
          value={
            departments.filter(
              (department) =>
                department.status ===
                  "active" &&
                department.locationId,
            ).length
          }
        />
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_220px_240px]">
          <label className="flex min-h-12 items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100">
            <Search
              size={18}
              className="shrink-0 text-slate-400"
            />

            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(
                  event.target.value,
                );
              }}
              placeholder="Search departments…"
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
            <option value="active">
              Active
            </option>

            <option value="inactive">
              Inactive
            </option>

            <option value="all">
              All statuses
            </option>
          </select>

          <select
            value={locationFilter}
            onChange={(event) => {
              setLocationFilter(
                event.target.value,
              );
            }}
            className={inputClassName}
          >
            <option value="all">
              All locations
            </option>

            <option value="unassigned">
              Organization-wide
            </option>

            {activeLocations.map(
              (location) => (
                <option
                  key={location.id}
                  value={location.id}
                >
                  {location.name}
                </option>
              ),
            )}
          </select>
        </div>
      </section>

      {treeRows.length === 0 ? (
        <EmptyDepartments
          canManage={canManage}
          hasFilters={
            Boolean(search) ||
            statusFilter !== "active" ||
            locationFilter !== "all"
          }
          onCreate={openCreateDialog}
        />
      ) : (
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="hidden grid-cols-[1fr_210px_150px_140px] gap-5 border-b border-slate-200 bg-slate-50 px-6 py-4 text-xs font-bold uppercase tracking-[0.12em] text-slate-500 lg:grid">
            <span>Department</span>
            <span>Location</span>
            <span>Status</span>
            <span>Actions</span>
          </div>

          <div className="divide-y divide-slate-200">
            {treeRows.map(
              ({
                department,
                depth,
              }) => (
                <DepartmentRow
                  key={department.id}
                  department={department}
                  depth={depth}
                  childCount={
                    childCounts.get(
                      department.id,
                    ) ?? 0
                  }
                  locationName={getLocationName(
                    department.locationId,
                  )}
                  canManage={canManage}
                  saving={saving}
                  onEdit={() => {
                    openEditDialog(
                      department,
                    );
                  }}
                  onArchive={() => {
                    void handleArchive(
                      department,
                    );
                  }}
                />
              ),
            )}
          </div>
        </section>
      )}

      {dialogOpen && (
        <DepartmentDialog
          department={
            selectedDepartment
          }
          departments={
            departments
          }
          locations={
            activeLocations
          }
          saving={saving}
          onClose={closeDialog}
          createDepartment={
            createDepartment
          }
          updateDepartment={
            updateDepartment
          }
          onSaved={(message) => {
            setSuccessMessage(
              message,
            );
            setDialogOpen(false);
            setSelectedDepartment(
              null,
            );
          }}
        />
      )}
    </div>
  );
}

function SummaryCard({
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

      <p className="mt-2 text-2xl font-bold text-slate-950">
        {value}
      </p>
    </article>
  );
}

function DepartmentRow({
  department,
  depth,
  childCount,
  locationName,
  canManage,
  saving,
  onEdit,
  onArchive,
}) {
  return (
    <article className="grid gap-4 px-5 py-5 lg:grid-cols-[1fr_210px_150px_140px] lg:items-center lg:gap-5 lg:px-6">
      <div
        className="min-w-0"
        style={{
          paddingLeft:
            `${Math.min(depth, 6) * 24}px`,
        }}
      >
        <div className="flex items-start gap-3">
          {depth > 0 ? (
            <ChevronRight
              size={18}
              className="mt-1 shrink-0 text-slate-400"
            />
          ) : (
            <FolderTree
              size={20}
              className="mt-0.5 shrink-0 text-blue-600"
            />
          )}

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate font-bold text-slate-950">
                {department.name}
              </h3>

              {department.code && (
                <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
                  {department.code}
                </span>
              )}

              {childCount > 0 && (
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                  {childCount} child
                  {childCount === 1
                    ? ""
                    : "ren"}
                </span>
              )}
            </div>

            {department.description && (
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                {department.description}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="text-sm text-slate-600">
        <span className="lg:hidden font-semibold text-slate-500">
          Location:{" "}
        </span>
        {locationName}
      </div>

      <div>
        <span
          className={[
            "inline-flex rounded-full px-3 py-1 text-xs font-bold",
            department.status ===
              "active"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-slate-100 text-slate-600",
          ].join(" ")}
        >
          {formatStatus(
            department.status,
          )}
        </span>
      </div>

      {canManage && (
        <div className="flex gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={onEdit}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            aria-label={`Edit ${department.name}`}
          >
            <Edit3 size={16} />
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={onArchive}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50"
            aria-label={`Archive ${department.name}`}
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}
    </article>
  );
}

function EmptyDepartments({
  canManage,
  hasFilters,
  onCreate,
}) {
  return (
    <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
        <Network size={29} />
      </span>

      <h3 className="mt-6 text-2xl font-bold text-slate-950">
        {hasFilters
          ? "No departments match your filters"
          : "No departments configured"}
      </h3>

      <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-600">
        {hasFilters
          ? "Adjust the search, status, or location filters to see more results."
          : "Create the first department to establish the organization hierarchy used by future staffing and assignment workflows."}
      </p>

      {canManage && !hasFilters && (
        <button
          type="button"
          onClick={onCreate}
          className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 font-bold text-white hover:bg-blue-700"
        >
          <Plus size={18} />
          Create first department
        </button>
      )}
    </section>
  );
}

function DepartmentDialog({
  department,
  departments,
  locations,
  saving,
  onClose,
  createDepartment,
  updateDepartment,
  onSaved,
}) {
  const editing =
    Boolean(department);

  const defaultValues =
    useMemo(
      () =>
        mapDepartmentToForm(
          department,
        ),
      [
        department,
      ],
    );

  const availableParents =
    useMemo(
      () =>
        departments.filter(
          (candidate) =>
            candidate.status !==
              "archived" &&
            candidate.id !==
              department?.id &&
            candidate
              .parentDepartmentId !==
              department?.id,
        ),
      [
        department?.id,
        departments,
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
      code: values.code,
      description:
        values.description,
      locationId:
        values.locationId ||
        null,
      parentDepartmentId:
        values
          .parentDepartmentId ||
        null,
      status:
        values.status,
    };

    if (editing) {
      await updateDepartment(
        department.id,
        payload,
      );

      onSaved(
        `${values.name} was updated successfully.`,
      );

      return;
    }

    await createDepartment(
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
        aria-label="Close department dialog"
        onClick={onClose}
        className="absolute inset-0"
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="department-dialog-title"
        className="relative z-10 max-h-full w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl"
      >
        <header className="sticky top-0 z-10 flex items-start justify-between gap-5 border-b border-slate-200 bg-white px-6 py-5 sm:px-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.15em] text-blue-600">
              Organization hierarchy
            </p>

            <h2
              id="department-dialog-title"
              className="mt-2 text-2xl font-bold text-slate-950"
            >
              {editing
                ? "Edit department"
                : "Create department"}
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
          className="space-y-6 p-6 sm:p-8"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <Field
                label="Department name"
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
                        "Department name is required.",
                    },
                  )}
                  className={inputClassName}
                />
              </Field>
            </div>

            <Field
              label="Department code"
              help="Optional short code used in reports and future job workflows."
            >
              <input
                type="text"
                {...register("code")}
                className={inputClassName}
              />
            </Field>

            <Field label="Status">
              <select
                {...register("status")}
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

            <Field label="Location">
              <select
                {...register(
                  "locationId",
                )}
                className={inputClassName}
              >
                <option value="">
                  Organization-wide
                </option>

                {locations.map(
                  (location) => (
                    <option
                      key={location.id}
                      value={location.id}
                    >
                      {location.name}
                    </option>
                  ),
                )}
              </select>
            </Field>

            <Field
              label="Parent department"
              help="Optional. Use this to create divisions, units, and nested teams."
            >
              <select
                {...register(
                  "parentDepartmentId",
                )}
                className={inputClassName}
              >
                <option value="">
                  No parent department
                </option>

                {availableParents.map(
                  (candidate) => (
                    <option
                      key={candidate.id}
                      value={candidate.id}
                    >
                      {candidate.name}
                    </option>
                  ),
                )}
              </select>
            </Field>

            <div className="md:col-span-2">
              <Field label="Description">
                <textarea
                  rows={5}
                  {...register(
                    "description",
                  )}
                  className={textareaClassName}
                />
              </Field>
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
                    : "Create department"}
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

const textareaClassName = [
  "w-full resize-y rounded-xl border border-slate-300",
  "bg-white px-4 py-3 outline-none transition",
  "focus:border-blue-500 focus:ring-4 focus:ring-blue-100",
].join(" ");

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
