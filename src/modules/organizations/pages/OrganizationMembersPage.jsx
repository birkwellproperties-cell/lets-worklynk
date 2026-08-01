import {
  AlertCircle,
  CheckCircle2,
  Edit3,
  LoaderCircle,
  Search,
  ShieldCheck,
  UserCheck,
  UserCog,
  UserMinus,
  UserRound,
  Users,
  X,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

import {
  useAuth,
} from "../../../platform/auth";

import {
  useOrganization,
} from "../context";

const STATUS_OPTIONS = [
  {
    value: "all",
    label: "All statuses",
  },
  {
    value: "active",
    label: "Active",
  },
  {
    value: "invited",
    label: "Invited",
  },
  {
    value: "suspended",
    label: "Suspended",
  },
  {
    value: "revoked",
    label: "Revoked",
  },
];

function normalizeSearch(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function formatDate(value) {
  if (!value) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat(
    "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    },
  ).format(
    new Date(value),
  );
}

function getMemberName(member) {
  return (
    member?.displayName ||
    [
      member?.firstName,
      member?.lastName,
    ]
      .filter(Boolean)
      .join(" ") ||
    member?.email ||
    "Organization member"
  );
}

function getInitials(member) {
  const name =
    getMemberName(member);

  return name
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

function getStatusClasses(status) {
  switch (status) {
    case "active":
      return "bg-emerald-50 text-emerald-700";

    case "invited":
      return "bg-blue-50 text-blue-700";

    case "suspended":
      return "bg-amber-50 text-amber-700";

    case "revoked":
      return "bg-red-50 text-red-700";

    default:
      return "bg-slate-100 text-slate-600";
  }
}

export default function OrganizationMembersPage() {
  const {
    user,
    hasPermission,
    isPlatformAdministrator,
  } = useAuth();

  const {
    members,
    memberRoles,
    memberPermissions,
    selectedMember,
    membersLoading,
    membersSaving,
    error,
    selectMember,
    refreshMembers,
    updateMemberStatus,
    replaceMemberRoles,
    setMemberPermissionOverride,
    removeMemberPermissionOverride,
    clearError,
  } = useOrganization();

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("all");

  const [
    roleFilter,
    setRoleFilter,
  ] = useState("all");

  const [
    roleDialogOpen,
    setRoleDialogOpen,
  ] = useState(false);

  const [
    permissionDialogOpen,
    setPermissionDialogOpen,
  ] = useState(false);

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const canManageMemberships =
    isPlatformAdministrator ||
    hasPermission(
      "memberships.manage",
    );

  const canManageRoles =
    isPlatformAdministrator ||
    hasPermission(
      "roles.manage",
    );

  const filteredMembers =
    useMemo(
      () => {
        const normalizedSearch =
          normalizeSearch(search);

        return members.filter(
          (member) => {
            const searchableText = [
              member.displayName,
              member.firstName,
              member.lastName,
              member.email,
              member.phone,
              member.title,
              ...member.roles.map(
                (role) => role.name,
              ),
              ...member.roles.map(
                (role) => role.code,
              ),
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();

            const matchesSearch =
              !normalizedSearch ||
              searchableText.includes(
                normalizedSearch,
              );

            const matchesStatus =
              statusFilter === "all" ||
              member.status ===
                statusFilter;

            const matchesRole =
              roleFilter === "all" ||
              member.roles.some(
                (role) =>
                  role.id ===
                  roleFilter,
              );

            return (
              matchesSearch &&
              matchesStatus &&
              matchesRole
            );
          },
        );
      },
      [
        members,
        roleFilter,
        search,
        statusFilter,
      ],
    );

  async function runAction(
    operation,
    message,
  ) {
    clearError();
    setSuccessMessage("");

    try {
      await operation();

      setSuccessMessage(
        message,
      );
    } catch {
      // Provider exposes the normalized error.
    }
  }

  async function handleStatusChange(
    status,
  ) {
    if (!selectedMember) {
      return;
    }

    const memberName =
      getMemberName(
        selectedMember,
      );

    const confirmed =
      window.confirm(
        `Change ${memberName}'s membership status to ${status}?`,
      );

    if (!confirmed) {
      return;
    }

    await runAction(
      () =>
        updateMemberStatus(
          selectedMember.membershipId,
          status,
          {
            title:
              selectedMember.title,
          },
        ),
      `${memberName} is now ${status}.`,
    );
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-600">
            Organization members
          </p>

          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            Memberships, roles, and access
          </h2>

          <p className="mt-3 max-w-3xl leading-7 text-slate-600">
            Review organization members, assign roles, manage
            membership status, and apply targeted permission
            overrides.
          </p>
        </div>

        <button
          type="button"
          disabled={membersLoading}
          onClick={() => {
            void refreshMembers();
          }}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          {membersLoading ? (
            <LoaderCircle
              size={18}
              className="animate-spin"
            />
          ) : (
            <Users size={18} />
          )}

          Refresh members
        </button>
      </section>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-900">
          <AlertCircle
            size={20}
            className="mt-0.5 shrink-0"
          />

          <div>
            <p className="font-bold">
              Member operation failed
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
          icon={Users}
          label="Total members"
          value={members.length}
        />

        <SummaryCard
          icon={UserCheck}
          label="Active members"
          value={
            members.filter(
              (member) =>
                member.status ===
                "active",
            ).length
          }
        />

        <SummaryCard
          icon={ShieldCheck}
          label="Available roles"
          value={memberRoles.length}
        />
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_220px_260px]">
          <label className="flex min-h-12 items-center gap-3 rounded-xl border border-slate-300 px-4 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100">
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
              placeholder="Search members…"
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
            {STATUS_OPTIONS.map(
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

          <select
            value={roleFilter}
            onChange={(event) => {
              setRoleFilter(
                event.target.value,
              );
            }}
            className={inputClassName}
          >
            <option value="all">
              All roles
            </option>

            {memberRoles.map(
              (role) => (
                <option
                  key={role.id}
                  value={role.id}
                >
                  {role.name}
                </option>
              ),
            )}
          </select>
        </div>
      </section>

      <section className="grid min-h-[560px] gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
            <p className="text-sm font-bold text-slate-700">
              {filteredMembers.length} member
              {filteredMembers.length === 1
                ? ""
                : "s"}
            </p>
          </div>

          {membersLoading ? (
            <div className="flex min-h-72 items-center justify-center">
              <LoaderCircle
                size={28}
                className="animate-spin text-blue-600"
              />
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="p-10 text-center">
              <UserRound
                size={34}
                className="mx-auto text-slate-300"
              />

              <h3 className="mt-5 text-xl font-bold text-slate-950">
                No members found
              </h3>

              <p className="mt-2 text-slate-600">
                Adjust the search or filters to see more members.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {filteredMembers.map(
                (member) => (
                  <MemberListItem
                    key={
                      member.membershipId
                    }
                    member={member}
                    selected={
                      selectedMember
                        ?.membershipId ===
                      member.membershipId
                    }
                    onSelect={() => {
                      selectMember(
                        member.membershipId,
                      );
                    }}
                  />
                ),
              )}
            </div>
          )}
        </div>

        <MemberDetailsPanel
          member={selectedMember}
          currentUserId={
            user?.id ?? null
          }
          canManageMemberships={
            canManageMemberships
          }
          canManageRoles={
            canManageRoles
          }
          saving={membersSaving}
          onEditRoles={() => {
            setRoleDialogOpen(true);
          }}
          onEditPermissions={() => {
            setPermissionDialogOpen(
              true,
            );
          }}
          onActivate={() => {
            void handleStatusChange(
              "active",
            );
          }}
          onSuspend={() => {
            void handleStatusChange(
              "suspended",
            );
          }}
          onRevoke={() => {
            void handleStatusChange(
              "revoked",
            );
          }}
          onRemoveOverride={(
            permissionCode,
          ) => {
            if (!selectedMember) {
              return;
            }

            void runAction(
              () =>
                removeMemberPermissionOverride(
                  selectedMember
                    .membershipId,
                  permissionCode,
                ),
              `Permission override ${permissionCode} was removed.`,
            );
          }}
        />
      </section>

      {roleDialogOpen &&
        selectedMember && (
          <RoleAssignmentDialog
            member={selectedMember}
            roles={memberRoles}
            saving={membersSaving}
            onClose={() => {
              setRoleDialogOpen(false);
            }}
            onSave={(roleIds) => {
              void runAction(
                async () => {
                  await replaceMemberRoles(
                    selectedMember
                      .membershipId,
                    roleIds,
                  );

                  setRoleDialogOpen(
                    false,
                  );
                },
                `Roles updated for ${getMemberName(selectedMember)}.`,
              );
            }}
          />
        )}

      {permissionDialogOpen &&
        selectedMember && (
          <PermissionOverrideDialog
            member={selectedMember}
            permissions={
              memberPermissions
            }
            saving={membersSaving}
            onClose={() => {
              setPermissionDialogOpen(
                false,
              );
            }}
            onSave={(
              permissionCode,
              effect,
              reason,
            ) => {
              void runAction(
                async () => {
                  await setMemberPermissionOverride(
                    selectedMember
                      .membershipId,
                    permissionCode,
                    effect,
                    {
                      reason,
                    },
                  );

                  setPermissionDialogOpen(
                    false,
                  );
                },
                `${permissionCode} override was saved.`,
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

function MemberListItem({
  member,
  selected,
  onSelect,
}) {
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
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">
        {getInitials(member)}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="truncate font-bold text-slate-950">
            {getMemberName(member)}
          </span>

          <span
            className={[
              "rounded-full px-2.5 py-1 text-xs font-bold capitalize",
              getStatusClasses(
                member.status,
              ),
            ].join(" ")}
          >
            {member.status}
          </span>
        </span>

        <span className="mt-1 block truncate text-sm text-slate-600">
          {member.email}
        </span>

        <span className="mt-2 block text-xs font-semibold text-slate-500">
          {member.roles.length > 0
            ? member.roles
                .map(
                  (role) =>
                    role.name,
                )
                .join(", ")
            : "No roles assigned"}
        </span>
      </span>
    </button>
  );
}

function MemberDetailsPanel({
  member,
  currentUserId,
  canManageMemberships,
  canManageRoles,
  saving,
  onEditRoles,
  onEditPermissions,
  onActivate,
  onSuspend,
  onRevoke,
  onRemoveOverride,
}) {
  if (!member) {
    return (
      <section className="flex min-h-72 items-center justify-center rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <div>
          <UserCog
            size={38}
            className="mx-auto text-slate-300"
          />

          <h3 className="mt-5 text-xl font-bold text-slate-950">
            Select a member
          </h3>

          <p className="mt-2 text-slate-600">
            Choose a member to review roles, permissions, and status.
          </p>
        </div>
      </section>
    );
  }

  const isCurrentUser =
    currentUserId ===
    member.userId;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-5 border-b border-slate-200 pb-7 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-lg font-bold text-white">
            {getInitials(member)}
          </span>

          <div className="min-w-0">
            <h3 className="truncate text-2xl font-bold text-slate-950">
              {getMemberName(member)}
            </h3>

            <p className="mt-1 truncate text-slate-600">
              {member.email}
            </p>

            <span
              className={[
                "mt-3 inline-flex rounded-full px-3 py-1 text-xs font-bold capitalize",
                getStatusClasses(
                  member.status,
                ),
              ].join(" ")}
            >
              {member.status}
            </span>
          </div>
        </div>

        {isCurrentUser && (
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
            Current user
          </span>
        )}
      </div>

      <div className="mt-7 grid gap-5 sm:grid-cols-2">
        <DetailItem
          label="Title"
          value={
            member.title ||
            "Not assigned"
          }
        />

        <DetailItem
          label="Account status"
          value={
            member.accountStatus ||
            "Unknown"
          }
        />

        <DetailItem
          label="Joined"
          value={formatDate(
            member.joinedAt,
          )}
        />

        <DetailItem
          label="Invited"
          value={formatDate(
            member.invitedAt,
          )}
        />
      </div>

      <div className="mt-8 border-t border-slate-200 pt-7">
        <div className="flex items-center justify-between gap-4">
          <h4 className="font-bold text-slate-950">
            Assigned roles
          </h4>

          {canManageRoles && (
            <button
              type="button"
              disabled={saving}
              onClick={onEditRoles}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              <Edit3 size={15} />
              Edit roles
            </button>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {member.roles.length > 0 ? (
            member.roles.map(
              (role) => (
                <span
                  key={role.id}
                  className="rounded-full bg-blue-50 px-3 py-1.5 text-sm font-bold text-blue-700"
                >
                  {role.name}
                </span>
              ),
            )
          ) : (
            <p className="text-sm text-slate-500">
              No roles assigned.
            </p>
          )}
        </div>
      </div>

      <div className="mt-8 border-t border-slate-200 pt-7">
        <div className="flex items-center justify-between gap-4">
          <h4 className="font-bold text-slate-950">
            Permission overrides
          </h4>

          {canManageRoles && (
            <button
              type="button"
              disabled={saving}
              onClick={
                onEditPermissions
              }
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              <ShieldCheck size={15} />
              Add override
            </button>
          )}
        </div>

        <div className="mt-4 space-y-3">
          {member.permissionOverrides
            .length > 0 ? (
            member.permissionOverrides.map(
              (override) => (
                <div
                  key={override.id}
                  className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div>
                    <p className="font-mono text-sm font-bold text-slate-900">
                      {override.permissionCode}
                    </p>

                    <p className="mt-1 text-sm text-slate-600">
                      Effect:{" "}
                      <span className="font-bold capitalize">
                        {override.effect}
                      </span>
                    </p>

                    {override.reason && (
                      <p className="mt-1 text-sm text-slate-500">
                        {override.reason}
                      </p>
                    )}
                  </div>

                  {canManageRoles && (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => {
                        onRemoveOverride(
                          override.permissionCode,
                        );
                      }}
                      className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ),
            )
          ) : (
            <p className="text-sm text-slate-500">
              No permission overrides configured.
            </p>
          )}
        </div>
      </div>

      {canManageMemberships && (
        <div className="mt-8 flex flex-wrap gap-3 border-t border-slate-200 pt-7">
          {member.status !==
            "active" && (
            <button
              type="button"
              disabled={saving}
              onClick={onActivate}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              <UserCheck size={16} />
              Activate
            </button>
          )}

          {member.status ===
            "active" && (
            <button
              type="button"
              disabled={
                saving ||
                isCurrentUser
              }
              onClick={onSuspend}
              className="inline-flex items-center gap-2 rounded-xl border border-amber-300 px-4 py-2.5 text-sm font-bold text-amber-800 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <UserMinus size={16} />
              Suspend
            </button>
          )}

          {member.status !==
            "revoked" && (
            <button
              type="button"
              disabled={
                saving ||
                isCurrentUser
              }
              onClick={onRevoke}
              className="inline-flex items-center gap-2 rounded-xl border border-red-300 px-4 py-2.5 text-sm font-bold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X size={16} />
              Revoke
            </button>
          )}
        </div>
      )}
    </section>
  );
}

function DetailItem({
  label,
  value,
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>

      <p className="mt-2 font-semibold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function RoleAssignmentDialog({
  member,
  roles,
  saving,
  onClose,
  onSave,
}) {
  const [
    selectedRoleIds,
    setSelectedRoleIds,
  ] = useState(
    () =>
      new Set(
        member.roles.map(
          (role) => role.id,
        ),
      ),
  );

  function toggleRole(roleId) {
    setSelectedRoleIds(
      (current) => {
        const next =
          new Set(current);

        if (next.has(roleId)) {
          next.delete(roleId);
        } else {
          next.add(roleId);
        }

        return next;
      },
    );
  }

  return (
    <DialogShell
      title="Assign member roles"
      subtitle={getMemberName(
        member,
      )}
      saving={saving}
      onClose={onClose}
    >
      <div className="space-y-3">
        {roles.map(
          (role) => (
            <label
              key={role.id}
              className="flex items-start gap-3 rounded-xl border border-slate-200 p-4"
            >
              <input
                type="checkbox"
                checked={selectedRoleIds.has(
                  role.id,
                )}
                onChange={() => {
                  toggleRole(
                    role.id,
                  );
                }}
                className="mt-1 h-4 w-4 rounded border-slate-300"
              />

              <span>
                <span className="block font-bold text-slate-950">
                  {role.name}
                </span>

                <span className="mt-1 block text-sm leading-6 text-slate-600">
                  {role.description ||
                    `${role.permissionCount} permissions`}
                </span>
              </span>
            </label>
          ),
        )}
      </div>

      <DialogActions
        saving={saving}
        saveLabel="Save roles"
        onCancel={onClose}
        onSave={() => {
          onSave(
            Array.from(
              selectedRoleIds,
            ),
          );
        }}
      />
    </DialogShell>
  );
}

function PermissionOverrideDialog({
  member,
  permissions,
  saving,
  onClose,
  onSave,
}) {
  const [
    permissionCode,
    setPermissionCode,
  ] = useState("");

  const [
    effect,
    setEffect,
  ] = useState("allow");

  const [
    reason,
    setReason,
  ] = useState("");

  return (
    <DialogShell
      title="Add permission override"
      subtitle={getMemberName(
        member,
      )}
      saving={saving}
      onClose={onClose}
    >
      <div className="space-y-5">
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Permission
          </span>

          <select
            value={permissionCode}
            onChange={(event) => {
              setPermissionCode(
                event.target.value,
              );
            }}
            className={[
              inputClassName,
              "mt-2",
            ].join(" ")}
          >
            <option value="">
              Select a permission…
            </option>

            {permissions
              .filter(
                (permission) =>
                  !member.permissionOverrides
                    .some(
                      (override) =>
                        override.permissionCode ===
                        permission.code,
                    ),
              )
              .map(
                (permission) => (
                <option
                  key={permission.id}
                  value={permission.code}
                >
                  {permission.module}
                  {" · "}
                  {permission.action}
                  {" — "}
                  {permission.code}
                </option>
              ),
            )}
          </select>

          {permissions.length === 0 && (
            <span className="mt-2 block text-sm text-amber-700">
              No permissions are available.
            </span>
          )}
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Effect
          </span>

          <select
            value={effect}
            onChange={(event) => {
              setEffect(
                event.target.value,
              );
            }}
            className={[
              inputClassName,
              "mt-2",
            ].join(" ")}
          >
            <option value="allow">
              Allow
            </option>

            <option value="deny">
              Deny
            </option>
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Reason
          </span>

          <textarea
            rows={4}
            value={reason}
            onChange={(event) => {
              setReason(
                event.target.value,
              );
            }}
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </label>
      </div>

      <DialogActions
        saving={saving}
        saveLabel="Save override"
        saveDisabled={
          !permissionCode.trim()
        }
        onCancel={onClose}
        onSave={() => {
          onSave(
            permissionCode.trim(),
            effect,
            reason.trim() ||
              null,
          );
        }}
      />
    </DialogShell>
  );
}

function DialogShell({
  title,
  subtitle,
  saving,
  onClose,
  children,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-8">
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0"
      />

      <section className="relative z-10 max-h-full w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <header className="sticky top-0 z-10 flex items-start justify-between gap-5 border-b border-slate-200 bg-white px-6 py-5 sm:px-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-950">
              {title}
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              {subtitle}
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
          {children}
        </div>
      </section>
    </div>
  );
}

function DialogActions({
  saving,
  saveLabel,
  saveDisabled = false,
  onCancel,
  onSave,
}) {
  return (
    <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
      <button
        type="button"
        disabled={saving}
        onClick={onCancel}
        className="min-h-12 rounded-xl border border-slate-300 px-6 font-bold text-slate-700 hover:bg-slate-50"
      >
        Cancel
      </button>

      <button
        type="button"
        disabled={
          saving ||
          saveDisabled
        }
        onClick={onSave}
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {saving && (
          <LoaderCircle
            size={18}
            className="animate-spin"
          />
        )}

        {saveLabel}
      </button>
    </div>
  );
}

const inputClassName = [
  "min-h-12 w-full rounded-xl border border-slate-300",
  "bg-white px-4 outline-none transition",
  "focus:border-blue-500 focus:ring-4 focus:ring-blue-100",
].join(" ");
