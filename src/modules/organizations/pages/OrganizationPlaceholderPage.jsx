import {
  Construction,
} from "lucide-react";

import {
  useLocation,
} from "react-router";

function formatTitle(pathname) {
  const segment =
    pathname
      .split("/")
      .filter(Boolean)
      .at(-1) || "Organization";

  return segment
    .replaceAll("-", " ")
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase(),
    );
}

export default function OrganizationPlaceholderPage() {
  const location =
    useLocation();

  const title =
    formatTitle(location.pathname);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
        <Construction size={26} />
      </span>

      <p className="mt-7 text-sm font-bold uppercase tracking-[0.16em] text-blue-600">
        Organization management
      </p>

      <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
        {title}
      </h2>

      <p className="mt-4 max-w-2xl leading-7 text-slate-600">
        This organization-management workspace is connected and ready for its production form and workflow.
      </p>
    </section>
  );
}
