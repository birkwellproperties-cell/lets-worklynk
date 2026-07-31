import BrandMark from "./BrandMark";

export default function BrandLogo({
  compact = false,
  inverted = false,
  markSize = 44,
  className = "",
}) {
  const primaryText =
    inverted
      ? "text-white"
      : "text-slate-950";

  const secondaryText =
    inverted
      ? "text-slate-300"
      : "text-slate-500";

  return (
    <span
      className={[
        "inline-flex items-center gap-3",
        className,
      ].join(" ")}
    >
      <BrandMark size={markSize} />

      {!compact && (
        <span className="min-w-0">
          <span
            className={[
              "block whitespace-nowrap text-lg font-bold tracking-tight",
              primaryText,
            ].join(" ")}
          >
            Let&apos;s WorkLynk
          </span>

          <span
            className={[
              "block whitespace-nowrap text-[0.7rem] font-semibold",
              "uppercase tracking-[0.16em]",
              secondaryText,
            ].join(" ")}
          >
            Workforce Marketplace
          </span>
        </span>
      )}
    </span>
  );
}
