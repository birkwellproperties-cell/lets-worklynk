import {
  ArrowRight,
  Building2,
  UserRoundSearch,
} from "lucide-react";

import {
  Link,
} from "react-router";

const accountTypes = [
  {
    icon: Building2,
    title: "Business account",
    description:
      "Post opportunities, find contractors, negotiate terms, and manage assignments.",
    action: "Create business account",
    to: "/join/business",
  },
  {
    icon: UserRoundSearch,
    title: "Contractor account",
    description:
      "Build your profile, set rates, find opportunities, negotiate, and get paid.",
    action: "Create contractor account",
    to: "/join/contractor",
  },
];

export default function JoinPage() {
  return (
    <div>
      <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-600">
        Join the marketplace
      </p>

      <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
        How will you use WorkLynk?
      </h1>

      <p className="mt-3 text-slate-600">
        Choose the account type that represents your organization.
      </p>

      <div className="mt-8 grid gap-4">
        {accountTypes.map((accountType) => {
          const Icon = accountType.icon;

          return (
            <Link
              key={accountType.title}
              to={accountType.to}
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-300 hover:shadow-md"
            >
              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Icon size={22} />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-lg font-bold text-slate-950">
                    {accountType.title}
                  </span>

                  <span className="mt-2 block leading-7 text-slate-600">
                    {accountType.description}
                  </span>

                  <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-blue-600">
                    {accountType.action}
                    <ArrowRight
                      size={17}
                      className="transition group-hover:translate-x-1"
                    />
                  </span>
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      <p className="mt-7 text-center text-sm text-slate-600">
        Already registered?{" "}
        <Link
          to="/sign-in"
          className="font-bold text-blue-600"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
