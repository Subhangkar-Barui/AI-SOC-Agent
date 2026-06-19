export default function StatCard({ title, value, icon: Icon, accent = "text-signal-cyan" }) {
  return (
    <section className="panel p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-400">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
        </div>
        {Icon && (
          <div className={`grid h-11 w-11 place-items-center rounded-md border border-white/10 bg-white/5 ${accent}`}>
            <Icon size={22} aria-hidden="true" />
          </div>
        )}
      </div>
    </section>
  );
}
