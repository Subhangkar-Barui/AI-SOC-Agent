export default function BrandMark({ size = "md", className = "" }) {
  const sizeClass = size === "lg" ? "h-14 w-14" : size === "sm" ? "h-10 w-10" : "h-11 w-11";

  return (
    <div className={`brand-mark ${sizeClass} ${className}`} aria-hidden="true">
      <svg viewBox="0 0 64 64" fill="none">
        <path className="brand-mark-shell" d="M32 7 52 19v26L32 57 12 45V19L32 7Z" />
        <path className="brand-mark-core" d="M22 42 32 18l10 24M26.5 34h11" />
        <path className="brand-mark-node-line" d="M16 27h10M38 27h10M32 46v7" />
        <circle className="brand-mark-node" cx="16" cy="27" r="3" />
        <circle className="brand-mark-node" cx="48" cy="27" r="3" />
        <circle className="brand-mark-node" cx="32" cy="53" r="3" />
      </svg>
    </div>
  );
}
