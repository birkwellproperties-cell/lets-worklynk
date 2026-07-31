export default function BrandMark({
  size = 44,
  className = "",
}) {
  return (
    <span
      className={[
        "relative inline-flex shrink-0 items-center justify-center",
        "overflow-hidden rounded-[30%]",
        "bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400",
        "text-white shadow-lg shadow-blue-600/20",
        className,
      ].join(" ")}
      style={{
        width: size,
        height: size,
      }}
      aria-hidden="true"
    >
      <svg
        width={Math.round(size * 0.62)}
        height={Math.round(size * 0.62)}
        viewBox="0 0 40 40"
        fill="none"
      >
        <path
          d="M6.5 11.5L13.2 28.5L20 14.2L26.8 28.5L33.5 11.5"
          stroke="currentColor"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <path
          d="M12 10.5L20 6L28 10.5"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.9"
        />
      </svg>
    </span>
  );
}
