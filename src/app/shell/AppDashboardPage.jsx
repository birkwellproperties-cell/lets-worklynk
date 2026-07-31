import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  Users,
} from "lucide-react";

import {
  Link,
} from "react-router";

import {
  useAuth,
} from "../../platform/auth";

export default function AppDashboardPage() {
  const {
    profile,
    organization,
  } = useAuth();

  return (
    <section>
      <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-600">
        Dashboard
      </p>

      <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950">
        Welcome,{" "}
        {profile?.display_name ||
          "WorkLynk user"}
      </h1>

      <p className="mt-4 max-w-2xl leading-7 text-slate-600">
        Manage your organization, workforce marketplace activity, jobs, contractors, and assignments.
      </p>

      <div className="mt-10 grid gap-5 md:grid-cols-3">
        <DashboardCard
          icon={Building2}
          title={organization?.displayName}
          description="Manage organization profile, locations, billing, branding, and settings."
          to="/app/organization"
        />

        <DashboardCard
          icon={Users}
          title="Contractors"
          description="Manage contractor organizations and independent workforce relationships."
          to="/app/contractors"
        />

        <DashboardCard
          icon={BriefcaseBusiness}
          title="Jobs"
          description="Create and manage short-term and long-term work opportunities."
          to="/app/jobs"
        />
      </div>
    </section>
  );
}

function DashboardCard({
  icon: Icon,
  title,
  description,
  to,
}) {
  return (
    <Link
      to={to}
      className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-300 hover:shadow-md"
    >
      <Icon
        size={24}
        className="text-blue-600"
      />

      <h2 className="mt-5 text-lg font-bold text-slate-950">
        {title}
      </h2>

      <p className="mt-2 leading-7 text-slate-600">
        {description}
      </p>

      <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-blue-600">
        Open workspace
        <ArrowRight
          size={17}
          className="transition group-hover:translate-x-1"
        />
      </span>
    </Link>
  );
}
