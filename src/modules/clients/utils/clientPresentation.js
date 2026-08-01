export function getClientName(
  workspace,
) {
  return (
    workspace?.organization
      ?.displayName ||
    workspace?.organization
      ?.legalName ||
    "Client organization"
  );
}

export function getClientInitials(
  workspace,
) {
  return getClientName(
    workspace,
  )
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(
      (part) =>
        part.slice(0, 1),
    )
    .join("")
    .toUpperCase();
}

export function formatClientDate(
  value,
) {
  if (!value) {
    return "Not recorded";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat(
    "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    },
  ).format(date);
}

export function formatStatusLabel(
  value,
) {
  if (!value) {
    return "Unknown";
  }

  return String(value)
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase(),
    );
}

export function getClientStatusClasses(
  status,
) {
  switch (status) {
    case "active":
      return "bg-emerald-50 text-emerald-700";

    case "onboarding":
      return "bg-blue-50 text-blue-700";

    case "prospect":
      return "bg-violet-50 text-violet-700";

    case "paused":
      return "bg-amber-50 text-amber-700";

    case "suspended":
      return "bg-orange-50 text-orange-700";

    case "terminated":
      return "bg-red-50 text-red-700";

    case "archived":
      return "bg-slate-100 text-slate-600";

    default:
      return "bg-slate-100 text-slate-600";
  }
}
