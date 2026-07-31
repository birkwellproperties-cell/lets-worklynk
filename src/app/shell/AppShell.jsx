import {
  Bell,
  BriefcaseBusiness,
  Building2,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Users,
  X,
} from "lucide-react";

import {
  useState,
} from "react";

import {
  NavLink,
  Outlet,
} from "react-router";

import {
  useAuth,
} from "../../platform/auth";

import {
  BrandLogo,
} from "../../shared/branding";

const navigationItems = [
  {
    label: "Dashboard",
    to: "/app",
    icon: LayoutDashboard,
    end: true,
  },
  {
    label: "Organization",
    to: "/app/organization",
    icon: Building2,
  },
  {
    label: "Contractors",
    to: "/app/contractors",
    icon: Users,
  },
  {
    label: "Jobs",
    to: "/app/jobs",
    icon: BriefcaseBusiness,
  },
];

function getNavigationClassName({
  isActive,
}) {
  return [
    "flex items-center gap-3 rounded-xl px-4 py-3",
    "text-sm font-semibold transition",
    isActive
      ? "bg-blue-600 text-white shadow-sm"
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
  ].join(" ");
}

export default function AppShell() {
  const {
    profile,
    organization,
    memberships,
    signOut,
  } = useAuth();

  const [
    mobileNavigationOpen,
    setMobileNavigationOpen,
  ] = useState(false);

  async function handleSignOut() {
    await signOut();
  }

  function closeMobileNavigation() {
    setMobileNavigationOpen(false);
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
        <div className="flex min-h-20 items-center justify-between gap-5 px-5 sm:px-6">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => {
                setMobileNavigationOpen(
                  (current) => !current,
                );
              }}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-700 lg:hidden"
              aria-label="Toggle navigation"
            >
              {mobileNavigationOpen
                ? <X size={20} />
                : <Menu size={20} />}
            </button>

            <BrandLogo />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50"
              aria-label="Notifications"
            >
              <Bell size={19} />
            </button>

            <div className="hidden items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 sm:flex">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-700">
                {(profile?.display_name ||
                  profile?.email ||
                  "U")
                  .slice(0, 1)
                  .toUpperCase()}
              </span>

              <span className="min-w-0">
                <span className="block max-w-48 truncate text-sm font-bold text-slate-950">
                  {profile?.display_name ||
                    profile?.email}
                </span>

                <span className="block max-w-48 truncate text-xs text-slate-500">
                  {organization?.displayName}
                </span>
              </span>

              {memberships.length > 1 && (
                <ChevronDown
                  size={17}
                  className="text-slate-400"
                />
              )}
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              <LogOut size={17} />
              <span className="hidden sm:inline">
                Sign out
              </span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside
          className={[
            "fixed inset-y-20 left-0 z-30 w-72 border-r border-slate-200",
            "bg-white p-5 transition-transform lg:sticky lg:top-20 lg:h-[calc(100vh-5rem)]",
            mobileNavigationOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0",
          ].join(" ")}
        >
          <nav className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={closeMobileNavigation}
                  className={getNavigationClassName}
                >
                  <Icon size={19} />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </aside>

        {mobileNavigationOpen && (
          <button
            type="button"
            aria-label="Close navigation overlay"
            onClick={closeMobileNavigation}
            className="fixed inset-0 top-20 z-20 bg-slate-950/30 lg:hidden"
          />
        )}

        <main className="min-w-0 flex-1 px-5 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
