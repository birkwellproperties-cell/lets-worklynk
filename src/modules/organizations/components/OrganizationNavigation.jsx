import {
  Building2,
  CreditCard,
  LayoutDashboard,
  MapPinned,
  Network,
  Palette,
  Settings2,
  UserRoundCog,
} from "lucide-react";

import {
  NavLink,
} from "react-router";

const navigationItems = [
  {
    label: "Overview",
    to: "/app/organization",
    icon: LayoutDashboard,
    end: true,
  },
  {
    label: "Profile",
    to: "/app/organization/profile",
    icon: Building2,
  },
  {
    label: "Locations",
    to: "/app/organization/locations",
    icon: MapPinned,
  },
  {
    label: "Departments",
    to: "/app/organization/departments",
    icon: Network,
  },
  {
    label: "Branding",
    to: "/app/organization/branding",
    icon: Palette,
  },
  {
    label: "Billing",
    to: "/app/organization/billing",
    icon: CreditCard,
  },
  {
    label: "Settings",
    to: "/app/organization/settings",
    icon: Settings2,
  },
  {
    label: "Members",
    to: "/app/organization/members",
    icon: UserRoundCog,
  },
];

function getNavigationClassName({
  isActive,
}) {
  return [
    "inline-flex items-center gap-2 rounded-xl px-4 py-2.5",
    "text-sm font-semibold transition",
    isActive
      ? "bg-blue-600 text-white shadow-sm"
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
  ].join(" ");
}

export default function OrganizationNavigation() {
  return (
    <nav
      aria-label="Organization management"
      className="flex gap-2 overflow-x-auto pb-2"
    >
      {navigationItems.map((item) => {
        const Icon = item.icon;

        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={getNavigationClassName}
          >
            <Icon
              size={17}
              className="shrink-0"
            />

            <span className="whitespace-nowrap">
              {item.label}
            </span>
          </NavLink>
        );
      })}
    </nav>
  );
}
