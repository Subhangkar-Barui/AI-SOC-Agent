const styles = {
  High: "border-red-400/30 bg-red-500/15 text-red-200",
  Medium: "border-amber-300/30 bg-amber-400/15 text-amber-100",
  Low: "border-green-400/30 bg-green-500/15 text-green-100",
};

export default function SeverityBadge({ severity }) {
  return (
    <span className={`inline-flex min-w-16 justify-center rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[severity] || "border-slate-400/30 bg-slate-500/15 text-slate-200"}`}>
      {severity || "Unknown"}
    </span>
  );
}
