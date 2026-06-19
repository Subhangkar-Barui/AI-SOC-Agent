const styles = {
  Online: "border-green-400/30 bg-green-500/15 text-green-100",
  Offline: "border-slate-400/30 bg-slate-500/15 text-slate-100",
  Paused: "border-amber-300/30 bg-amber-400/15 text-amber-100",
  Open: "border-red-400/30 bg-red-500/15 text-red-100",
  Closed: "border-green-400/30 bg-green-500/15 text-green-100",
  Normal: "border-green-400/30 bg-green-500/15 text-green-100",
  Suspicious: "border-amber-300/30 bg-amber-400/15 text-amber-100",
  "High Risk": "border-red-400/30 bg-red-500/15 text-red-100",
};

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-flex min-w-20 justify-center rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[status] || styles.Offline}`}>
      {status || "Unknown"}
    </span>
  );
}
