import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Clock3,
  LogOut,
  ShieldX,
  UserRoundX,
} from "lucide-react";

import {
  useMemo,
} from "react";

import {
  useAuth,
} from "../index";

const statusContent = {
  profile_missing: {
    icon: UserRoundX,
    eyebrow: "Profile unavailable",
    title:
      "Your identity profile could not be loaded.",
    description:
      "Your sign-in succeeded, but WorkLynk could not locate the profile required to initialize your account.",
  },
  account_pending: {
    icon: Clock3,
    eyebrow: "Account pending",
    title:
      "Your WorkLynk account is awaiting activation.",
    description:
      "Your account exists, but access has not yet been activated.",
  },
  account_suspended: {
    icon: ShieldX,
    eyebrow: "Account suspended",
    title:
      "Your WorkLynk account is currently suspended.",
    description:
      "Access has been temporarily disabled. Contact platform support or your organization administrator.",
  },
  account_disabled: {
    icon: UserRoundX,
    eyebrow: "Account disabled",
    title:
      "Your WorkLynk account has been disabled.",
    description:
      "This account can no longer access the platform.",
  },
  invited: {
    icon: Clock3,
    eyebrow: "Invitation pending",
    title:
      "Your organization invitation is awaiting acceptance.",
    description:
      "Your identity is active, but your organization membership has not yet been activated.",
  },
  membership_suspended: {
    icon: ShieldX,
    eyebrow: "Membership suspended",
    title:
      "Your organization membership is suspended.",
    description:
      "Your WorkLynk account remains active, but this organization has suspended your membership.",
  },
  organization_pending: {
    icon: Building2,
    eyebrow: "Organization pending",
    title:
      "Your organization is awaiting approval.",
    description:
      "WorkLynk access will become available after the organization is approved and activated.",
  },
  organization_suspended: {
    icon: Building2,
    eyebrow: "Organization suspended",
    title:
      "Your organization is currently suspended.",
    description:
      "Workspace access is unavailable until the organization is reactivated.",
  },
  no_workspace: {
    icon: Building2,
    eyebrow: "Workspace unavailable",
    title:
      "No active organization workspace was found.",
    description:
      "Your account is active, but it is not assigned to an active WorkLynk organization.",
  },
  bootstrap_error: {
    icon: AlertTriangle,
    eyebrow: "Workspace error",
    title:
      "WorkLynk could not initialize your workspace.",
    description:
      "An unexpected error occurred while loading your identity, membership, roles, or permissions.",
  },
};

export default function AccountStatusPage() {
  const {
    accessStatus,
    error,
    signOut,
  } = useAuth();

  const content =
    useMemo(
      () =>
        statusContent[accessStatus] ??
        statusContent.bootstrap_error,
      [
        accessStatus,
      ],
    );

  const Icon =
    content.icon;

  async function handleSignOut() {
    await signOut();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-16">
      <section className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-900/5 sm:p-10">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <Icon size={26} />
        </span>

        <p className="mt-7 text-sm font-bold uppercase tracking-[0.16em] text-blue-600">
          {content.eyebrow}
        </p>

        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
          {content.title}
        </h1>

        <p className="mt-4 leading-7 text-slate-600">
          {content.description}
        </p>

        {error?.message && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800">
            {error.message}
          </div>
        )}

        <button
          type="button"
          onClick={handleSignOut}
          className="mt-8 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 font-bold text-white transition hover:bg-slate-800"
        >
          <LogOut size={18} />
          Sign out
          <ArrowRight size={17} />
        </button>
      </section>
    </main>
  );
}
