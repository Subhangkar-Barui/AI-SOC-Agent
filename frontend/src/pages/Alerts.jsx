import { useEffect, useState } from "react";
import { CheckCircle2, Filter, RefreshCcw, ShieldAlert } from "lucide-react";
import api from "../api/axios";
import SeverityBadge from "../components/SeverityBadge";
import StatusBadge from "../components/StatusBadge";

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [filters, setFilters] = useState({ status: "", severity: "", source_type: "", agent_id: "" });
  const [loading, setLoading] = useState(false);
  const [closingId, setClosingId] = useState("");
  const [error, setError] = useState("");

  const fetchAlerts = async (activeFilters = filters) => {
    setLoading(true);
    setError("");
    const params = Object.fromEntries(Object.entries(activeFilters).filter(([, value]) => value.trim()));
    try {
      const response = await api.get("/alerts", { params });
      setAlerts(response.data);
    } catch {
      setError("Unable to load alerts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts({ status: "", severity: "", source_type: "", agent_id: "" });
  }, []);

  const handleChange = (event) => setFilters({ ...filters, [event.target.name]: event.target.value });
  const resetFilters = () => {
    const empty = { status: "", severity: "", source_type: "", agent_id: "" };
    setFilters(empty);
    fetchAlerts(empty);
  };

  const closeAlert = async (alertId) => {
    setClosingId(alertId);
    setError("");
    try {
      await api.put(`/alerts/${alertId}/close`);
      await fetchAlerts();
    } catch {
      setError("Unable to close alert.");
    } finally {
      setClosingId("");
    }
  };

  return (
    <div className="space-y-5">
      <section className="panel p-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr_auto_auto]">
          <select className="input" name="status" value={filters.status} onChange={handleChange}>
            <option value="">All statuses</option>
            <option value="Open">Open</option>
            <option value="Closed">Closed</option>
          </select>
          <select className="input" name="severity" value={filters.severity} onChange={handleChange}>
            <option value="">All severities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
          <select className="input" name="source_type" value={filters.source_type} onChange={handleChange}>
            <option value="">All sources</option>
            <option value="log">Log</option>
            <option value="traffic">Traffic</option>
            <option value="device">Device</option>
          </select>
          <input className="input" name="agent_id" value={filters.agent_id} onChange={handleChange} placeholder="Agent ID" />
          <button className="btn-primary" type="button" onClick={() => fetchAlerts()}>
            <Filter size={16} aria-hidden="true" />
            Apply
          </button>
          <button className="btn-secondary" type="button" onClick={resetFilters}>
            <RefreshCcw size={16} aria-hidden="true" />
            Reset
          </button>
        </div>
      </section>

      {error && <div className="rounded-md border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">{error}</div>}

      <section className="panel overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-md border border-white/10 bg-white/5 text-signal-amber">
              <ShieldAlert size={21} aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Security Alerts</h3>
              <p className="text-sm text-slate-400">{loading ? "Loading..." : `${alerts.length} records`}</p>
            </div>
          </div>
          <button className="btn-secondary" type="button" onClick={() => fetchAlerts()} disabled={loading}>
            <RefreshCcw size={17} aria-hidden="true" />
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1120px] w-full">
            <thead className="table-head">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3">Source IP</th>
                <th className="px-4 py-3">Destination IP</th>
                <th className="px-4 py-3">Event Type</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Risk</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Detected At</th>
                <th className="px-4 py-3">Created By</th>
                <th className="px-4 py-3">Closed At</th>
                <th className="px-4 py-3">Closed By</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((alert) => (
                <tr key={alert._id} className="hover:bg-white/[0.03]">
                  <td className="table-cell">{alert.title}</td>
                  <td className="table-cell"><SeverityBadge severity={alert.severity} /></td>
                  <td className="table-cell">{alert.source_ip}</td>
                  <td className="table-cell">{alert.destination_ip || "-"}</td>
                  <td className="table-cell">{alert.event_type}</td>
                  <td className="table-cell">{alert.source_type || "log"}</td>
                  <td className="table-cell">{alert.risk_score ?? "-"}</td>
                  <td className="table-cell"><StatusBadge status={alert.status} /></td>
                  <td className="table-cell">{alert.detected_at}</td>
                  <td className="table-cell">{alert.created_by || alert.user_email}</td>
                  <td className="table-cell">{alert.closed_at || "-"}</td>
                  <td className="table-cell">{alert.closed_by || "-"}</td>
                  <td className="table-cell">
                    {alert.status === "Open" && (
                      <button className="btn-secondary px-3 py-1.5" type="button" onClick={() => closeAlert(alert._id)} disabled={closingId === alert._id}>
                        <CheckCircle2 size={16} aria-hidden="true" />
                        {closingId === alert._id ? "Closing..." : "Close"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {!loading && alerts.length === 0 && (
                <tr>
                  <td className="table-cell text-center text-slate-400" colSpan="13">No alerts found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
