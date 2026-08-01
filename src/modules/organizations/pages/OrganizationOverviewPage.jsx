import {
  Building2,
  CheckCircle2,
  CreditCard,
  Globe2,
  MapPinned,
  Network,
  Palette,
  Settings2,
  ShieldCheck,
  Users,
} from "lucide-react";

import {
  Link,
  useNavigate,
} from "react-router";

import {
  useAuth,
} from "../../../platform/auth";

import {
  useOrganization,
} from "../context";

const quickActions = [
  {
    title: "Complete profile",
    description:
      "Add marketplace details, industry information, and contact information.",
    to: "/app/organization/profile",
    icon: Building2,
  },
  {
    title: "Manage locations",
    description:
      "Create and maintain offices, facilities, worksites, and billing locations.",
    to: "/app/organization/locations",
    icon: MapPinned,
  },
  {
    title: "Manage departments",
    description:
      "Configure departments, teams, reporting structures, and operating units.",
    to: "/app/organization/departments",
    icon: Network,
  },
  {
    title: "Configure branding",
    description:
      "Set organization colors, logos, display name, and marketplace tagline.",
    to: "/app/organization/branding",
    icon: Palette,
  },
  {
    title: "Configure billing",
    description:
      "Maintain billing identity, invoice contacts, payment terms, and tax details.",
    to: "/app/organization/billing",
    icon: CreditCard,
  },
  {
    title: "Manage members",
    description:
      "Manage organization users, roles, membership status, and permission overrides.",
    to: "/app/organization/members",
    icon: Users,
  },
  {
    title: "Organization settings",
    description:
      "Configure organization-wide preferences, defaults, and platform behavior.",
    to: "/app/organization/settings",
    icon: Settings2,
  },
];

function SummaryCard({
  icon: Icon,
  label,
  value,
  description,
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        <Icon size={21} />
      </span>

      <p className="mt-5 text-sm font-semibold text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold text-slate-950">
        {value}
      </p>

      {description && (
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {description}
        </p>
      )}
    </article>
  );
}

export default function OrganizationOverviewPage() {
  const navigate =
    useNavigate();

  const {
    roles,
    permissions,
    isPlatformAdministrator,
  } = useAuth();

  const {
    organization,
    profile,
    locations,
    departments,
    settings,
    branding,
    billingProfile,
  } = useOrganization();

  const profileComplete =
    Boolean(
      profile?.shortDescription ||
      profile?.industryName ||
      profile?.primaryContactEmail,
    );

  const brandingConfigured =
    Boolean(
      branding?.primaryColor ||
      branding?.logoPath ||
      branding?.tagline,
    );

  const billingConfigured =
    Boolean(
      billingProfile?.billingLegalName ||
      billingProfile?.billingEmail,
    );

  return (
    <div className="space-y-6">
      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={MapPinned}
          label="Locations"
          value={locations.length}
          description="Active organization locations"
        />

        <SummaryCard
          icon={Network}
          label="Departments"
          value={departments.length}
          description="Configured departments and teams"
        />

        <SummaryCard
          icon={Users}
          label="Assigned roles"
          value={
            isPlatformAdministrator
              ? "Platform"
              : roles.length
          }
          description={
            isPlatformAdministrator
              ? "Platform administrator access"
              : `${permissions.length} resolved permissions`
          }
        />

        <SummaryCard
          icon={Settings2}
          label="Settings"
          value={settings.length}
          description="Organization-specific settings"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <article className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
          <div className="flex items-center gap-3">
            <ShieldCheck
              size={23}
              className="text-blue-600"
            />

            <h2 className="text-xl font-bold text-slate-950">
              Organization readiness
            </h2>
          </div>

          <div className="mt-7 space-y-4">
            <ReadinessItem
              complete
              label="Organization identity"
              description={`${organization.legalName} is active and available.`}
            />

            <ReadinessItem
              complete={profileComplete}
              label="Organization profile"
              description={
                profileComplete
                  ? "Profile information has been started."
                  : "Add profile and marketplace information."
              }
            />

            <ReadinessItem
              complete={locations.length > 0}
              label="Primary location"
              description={
                locations.length > 0
                  ? `${locations.length} location(s) configured.`
                  : "Create a headquarters or primary location."
              }
            />

            <ReadinessItem
              complete={brandingConfigured}
              label="Organization branding"
              description={
                brandingConfigured
                  ? "Branding preferences are configured."
                  : "Add colors, logos, or a marketplace tagline."
              }
            />

            <ReadinessItem
              complete={billingConfigured}
              label="Billing profile"
              description={
                billingConfigured
                  ? "Billing information is configured."
                  : "Add billing and invoice information."
              }
            />
          </div>
        </article>

        <article className="rounded-3xl bg-slate-950 p-7 text-white shadow-xl shadow-slate-900/10">
          <Globe2
            size={27}
            className="text-cyan-300"
          />

          <p className="mt-6 text-sm font-bold uppercase tracking-[0.16em] text-cyan-300">
            Marketplace identity
          </p>

          <h2 className="mt-3 text-2xl font-bold">
            {profile?.marketplaceHeadline ||
              organization.displayName}
          </h2>

          <p className="mt-4 leading-7 text-slate-300">
            {profile?.shortDescription ||
              "Add a marketplace description so clients and contractors understand what your organization offers."}
          </p>

          <Link
            to="/app/organization/profile"
            aria-label="Edit organization profile"
            className="mt-7 inline-flex min-h-12 items-center justify-center rounded-xl border border-white bg-white px-5 py-3 font-bold transition hover:bg-slate-100"
            style={{
              color: "#0f172a",
              WebkitTextFillColor: "#0f172a",
              opacity: 1,
            }}
          >
            Edit organization profile
          </Link>
        </article>
      </section>

      <section>
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-600">
            Quick actions
          </p>

          <h2 className="mt-2 text-2xl font-bold text-slate-950">
            Continue organization setup
          </h2>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon;

            return (
              <button
                type="button"
                key={action.to}
                onClick={() => {
                  navigate(action.to);
                }}
                className="group w-full cursor-pointer rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:border-blue-300 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-blue-100"
              >
                <Icon
                  size={23}
                  className="text-blue-600"
                />

                <h3 className="mt-5 text-lg font-bold text-slate-950">
                  {action.title}
                </h3>

                <p className="mt-2 leading-7 text-slate-600">
                  {action.description}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        <ConfigurationCard
          icon={Palette}
          title="Branding"
          configured={brandingConfigured}
        />

        <ConfigurationCard
          icon={CreditCard}
          title="Billing"
          configured={billingConfigured}
        />

        <ConfigurationCard
          icon={Network}
          title="Departments"
          configured={departments.length > 0}
        />
      </section>
    </div>
  );
}

function ReadinessItem({
  complete,
  label,
  description,
}) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <CheckCircle2
        size={21}
        className={[
          "mt-0.5 shrink-0",
          complete
            ? "text-emerald-500"
            : "text-slate-300",
        ].join(" ")}
      />

      <div>
        <p className="font-bold text-slate-900">
          {label}
        </p>

        <p className="mt-1 text-sm leading-6 text-slate-600">
          {description}
        </p>
      </div>
    </div>
  );
}

function ConfigurationCard({
  icon: Icon,
  title,
  configured,
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <Icon
          size={22}
          className="text-blue-600"
        />

        <span
          className={[
            "rounded-full px-3 py-1 text-xs font-bold",
            configured
              ? "bg-emerald-50 text-emerald-700"
              : "bg-amber-50 text-amber-700",
          ].join(" ")}
        >
          {configured
            ? "Configured"
            : "Needs setup"}
        </span>
      </div>

      <h3 className="mt-5 font-bold text-slate-950">
        {title}
      </h3>
    </article>
  );
}
