import {
  Building2,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  Users,
} from "lucide-react";

import {
  NavLink,
} from "react-router";

const ITEMS = [
  {
    end: true,
    label: "Overview",
    path: "",
    icon: LayoutDashboard,
  },
  {
    label: "Profile",
    path: "profile",
    icon: Building2,
  },
  {
    label: "Contacts",
    path: "contacts",
    icon: Users,
  },
  {
    label: "Onboarding",
    path: "onboarding",
    icon: ClipboardCheck,
  },
  {
    label: "Documents",
    path: "documents",
    icon: FileText,
  },
];

export default function ClientWorkspaceNavigation() {
  return (
    <nav
      aria-label="Client workspace"
      className="flex gap-2 overflow-x-auto border-b border-slate-200 px-2"
    >
      {ITEMS.map(
        ({
          end,
          label,
          path,
          icon: Icon,
        }) => (
          <NavLink
            key={label}
            end={end}
            to={path || "."}
            className={({
              isActive,
            }) =>
              [
                "inline-flex min-h-12 shrink-0 items-center gap-2 border-b-2 px-4 text-sm font-bold transition",
                isActive
                  ? "border-blue-600 text-blue-700"
                  : "border-transparent text-slate-500 hover:text-slate-900",
              ].join(" ")
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ),
      )}
    </nav>
  );
}
