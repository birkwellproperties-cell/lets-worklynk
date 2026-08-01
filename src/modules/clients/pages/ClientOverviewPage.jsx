import {
  Building2,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Mail,
  Phone,
  UserRound,
  Users,
} from "lucide-react";

import {
  Link,
  useOutletContext,
} from "react-router";

import {
  formatClientDate,
  formatStatusLabel,
} from "../utils";

export default function ClientOverviewPage() {
  const {
    workspace,
  } = useOutletContext();

  const {
    relationship,
    organization,
    organizationProfile,
    clientProfile,
    contacts = [],
    onboarding,
  } = workspace;

  const primaryContact =
    contacts.find(
      (contact) =>
        contact.isPrimary,
    ) ??
    contacts[0] ??
    null;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Users}
          label="Contacts"
          value={contacts.length}
        />

        <MetricCard
          icon={ClipboardCheck}
          label="Onboarding"
          value={`${
            onboarding
              ?.completionPercentage ??
            0
          }%`}
        />

        <MetricCard
          icon={CalendarClock}
          label="Target launch"
          value={formatClientDate(
            onboarding
              ?.targetLaunchDate,
          )}
        />

        <MetricCard
          icon={CheckCircle2}
          label="Relationship"
          value={formatStatusLabel(
            relationship?.status,
          )}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <WorkspaceCard
          title="Organization details"
          action={
            <Link
              to="profile"
              className="text-sm font-bold text-blue-700 hover:text-blue-800"
            >
              Edit profile
            </Link>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <DetailItem
              icon={Building2}
              label="Industry"
              value={
                organizationProfile
                  ?.industryName ||
                "Not specified"
              }
            />

            <DetailItem
              icon={Mail}
              label="Email"
              value={
                organization?.email ||
                "Not provided"
              }
            />

            <DetailItem
              icon={Phone}
              label="Phone"
              value={
                organization?.phone ||
                "Not provided"
              }
            />

            <DetailItem
              icon={CalendarClock}
              label="Created"
              value={formatClientDate(
                relationship?.createdAt,
              )}
            />
          </div>
        </WorkspaceCard>

        <WorkspaceCard
          title="Primary contact"
          action={
            <Link
              to="contacts"
              className="text-sm font-bold text-blue-700 hover:text-blue-800"
            >
              Manage contacts
            </Link>
          }
        >
          {primaryContact ? (
            <div className="flex items-start gap-4 rounded-2xl bg-slate-50 p-5">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                <UserRound size={22} />
              </span>

              <div>
                <p className="font-bold text-slate-950">
                  {primaryContact.firstName}
                  {" "}
                  {primaryContact.lastName}
                </p>

                <p className="mt-1 text-sm text-slate-600">
                  {primaryContact.jobTitle ||
                    formatStatusLabel(
                      primaryContact
                        .contactType,
                    )}
                </p>

                <p className="mt-3 text-sm text-slate-500">
                  {primaryContact.email ||
                    primaryContact.phone ||
                    "No contact details"}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              No client contacts have been added.
            </p>
          )}
        </WorkspaceCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <WorkspaceCard
          title="Onboarding progress"
          action={
            <Link
              to="onboarding"
              className="text-sm font-bold text-blue-700 hover:text-blue-800"
            >
              Manage onboarding
            </Link>
          }
        >
          <div className="rounded-2xl bg-slate-50 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-bold text-slate-950">
                  {formatStatusLabel(
                    onboarding?.status ||
                    "not_started",
                  )}
                </p>

                <p className="mt-1 text-sm text-slate-600">
                  {onboarding
                    ?.currentStep ||
                    "No current onboarding step."}
                </p>
              </div>

              <span className="text-xl font-bold text-blue-700">
                {onboarding
                  ?.completionPercentage ??
                  0}
                %
              </span>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-blue-600"
                style={{
                  width: `${
                    onboarding
                      ?.completionPercentage ??
                    0
                  }%`,
                }}
              />
            </div>
          </div>
        </WorkspaceCard>

        <WorkspaceCard
          title="Operating preferences"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <BooleanItem
              label="Purchase order required"
              value={
                clientProfile
                  ?.purchaseOrderRequired
              }
            />

            <BooleanItem
              label="Worker approval required"
              value={
                clientProfile
                  ?.workerApprovalRequired
              }
            />

            <BooleanItem
              label="Timesheet approval required"
              value={
                clientProfile
                  ?.timesheetApprovalRequired
              }
            />

            <BooleanItem
              label="Direct contractor contact"
              value={
                clientProfile
                  ?.allowsDirectContractorContact
              }
            />
          </div>
        </WorkspaceCard>
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

      <p className="mt-2 text-2xl font-bold text-slate-950">
        {value}
      </p>
    </article>
  );
}

function WorkspaceCard({
  title,
  action,
  children,
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-bold text-slate-950">
          {title}
        </h2>

        {action}
      </div>

      <div className="mt-5">
        {children}
      </div>
    </section>
  );
}

function DetailItem({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-slate-500">
        <Icon size={15} />

        <p className="text-xs font-bold uppercase tracking-[0.1em]">
          {label}
        </p>
      </div>

      <p className="mt-2 break-words font-semibold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function BooleanItem({
  label,
  value,
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 p-4">
      <span className="text-sm font-semibold text-slate-700">
        {label}
      </span>

      <span
        className={[
          "rounded-full px-2.5 py-1 text-xs font-bold",
          value
            ? "bg-emerald-50 text-emerald-700"
            : "bg-slate-200 text-slate-600",
        ].join(" ")}
      >
        {value
          ? "Yes"
          : "No"}
      </span>
    </div>
  );
}
