import { useEffect, useState } from "react";
import { FileText, RefreshCcw } from "lucide-react";
import api from "../api/axios";

export default function Reports() {
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");

  const fetchReport = async () => {
    setError("");
    try {
      const response = await api.get("/reports/summary");
      setReport(response.data);
    } catch {
      setError("Unable to generate report.");
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const stats = report?.stats || {};

  return (
    <div className="space-y-5">
      <section className="panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <FileText className="text-signal-cyan" size={22} aria-hidden="true" />
            <div>
              <h2 className="text-xl font-semibold text-white">Security Report</h2>
              <p className="text-sm text-slate-400">Generated at {report?.generated_at || "-"}</p>
            </div>
          </div>
          <button className="btn-secondary" type="button" onClick={fetchReport}>
            <RefreshCcw size={16} aria-hidden="true" />
            Regenerate
          </button>
        </div>
      </section>
      {error && <div className="rounded-md border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">{error}</div>}
      <section className="grid gap-4 md:grid-cols-4">
        <SummaryCard label="Alerts" value={stats.total_alerts || 0} />
        <SummaryCard label="Suspicious Traffic" value={stats.suspicious_packets || 0} />
        <SummaryCard label="High Risk Traffic" value={stats.high_risk_packets || 0} />
        <SummaryCard label="Known Devices" value={stats.known_devices || 0} />
      </section>
      <section className="grid gap-5 xl:grid-cols-3">
        <div className="panel p-5">
          <h3 className="text-lg font-semibold text-white">Top Risky IPs</h3>
          <ul className="mt-4 space-y-2 text-sm text-slate-300">
            {(report?.top_risky_ips || []).map((item) => <li key={item.source_ip}>{item.source_ip}: {item.count} events</li>)}
            {(report?.top_risky_ips || []).length === 0 && <li>No risky IPs recorded.</li>}
          </ul>
        </div>
        <div className="panel p-5">
          <h3 className="text-lg font-semibold text-white">Recently Discovered Devices</h3>
          <ul className="mt-4 space-y-2 text-sm text-slate-300">
            {(report?.recent_devices || []).map((device) => <li key={device._id}>{device.ip_address} {device.hostname ? `| ${device.hostname}` : ""}</li>)}
            {(report?.recent_devices || []).length === 0 && <li>No devices discovered.</li>}
          </ul>
        </div>
        <div className="panel p-5">
          <h3 className="text-lg font-semibold text-white">Recommendations</h3>
          <ul className="mt-4 space-y-2 text-sm text-slate-300">
            {(report?.recommendations || []).map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
      </section>
    </div>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="panel p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
    </div>
  );
}
