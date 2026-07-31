const statusStyles = {
  active:
    "border-emerald-200 bg-emerald-50 text-emerald-700",
  pending:
    "border-amber-200 bg-amber-50 text-amber-700",
  suspended:
    "border-red-200 bg-red-50 text-red-700",
  rejected:
    "border-red-200 bg-red-50 text-red-700",
  archived:
    "border-slate-200 bg-slate-100 text-slate-600",
  inactive:
    "border-slate-200 bg-slate-100 text-slate-600",
};

function formatStatus(status) {
  if (!status) {
    return "Unknown";
  }

  return status
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase(),
    );
}

export default function OrganizationStatusBadge({
  status,
}) {
  const classes =
    statusStyles[status] ??
    statusStyles.inactive;

  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-3 py-1",
        "text-xs font-bold",
        classes,
      ].join(" ")}
    >
      {formatStatus(status)}
    </span>
  );
}
