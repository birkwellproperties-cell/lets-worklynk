import {
  ArrowLeft,
  Building2,
  UserRoundSearch,
} from "lucide-react";

import {
  Link,
  useParams,
} from "react-router";

export default function RegistrationPlaceholderPage() {
  const {
    accountType,
  } = useParams();

  const isContractor =
    accountType === "contractor";

  const Icon =
    isContractor
      ? UserRoundSearch
      : Building2;

  const title =
    isContractor
      ? "Contractor registration"
      : "Business registration";

  const description =
    isContractor
      ? "The contractor onboarding workflow will collect business identity, professional services, rates, credentials, and availability."
      : "The business onboarding workflow will collect organization identity, facilities, team members, billing, and marketplace requirements.";

  return (
    <div>
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
        <Icon size={27} />
      </span>

      <p className="mt-7 text-sm font-bold uppercase tracking-[0.16em] text-blue-600">
        Account setup
      </p>

      <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
        {title}
      </h1>

      <p className="mt-4 leading-7 text-slate-600">
        {description}
      </p>

      <div className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm leading-6 text-blue-900">
        Registration architecture is prepared. The production
        onboarding forms will be implemented after the identity
        and multi-tenant database foundation is created.
      </div>

      <Link
        to="/join"
        className="mt-8 inline-flex items-center gap-2 font-bold text-blue-600"
      >
        <ArrowLeft size={18} />
        Choose another account type
      </Link>
    </div>
  );
}
