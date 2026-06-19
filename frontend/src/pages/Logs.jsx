import { useEffect, useState } from "react";
import { Filter, RefreshCcw, Search } from "lucide-react";
import api from "../api/axios";
import SeverityBadge from "../components/SeverityBadge";

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [filters, setFilters] = useState({ severity: "", source_ip: "", destination_ip: "", event_type: "", date_from: "", date_to: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchLogs = async (activeFilters = filters) => {
    setLoading(true);
    setError("");

    const params = Object.fromEntries(
      Object.entries(activeFilters).filter(([, value]) => value.trim() !== "")
    );

    try {
      const response = await api.get("/logs", { params });
      setLogs(response.data);
    } catch {
      setError("Unable to load logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs({ severity: "", source_ip: "", destination_ip: "", event_type: "", date_from: "", date_to: "" });
  }, []);

  const handleChange = (event) => {
    setFilters({ ...filters, [event.target.name]: event.target.value });
  };

  const resetFilters = () => {
    const emptyFilters = { severity: "", source_ip: "", destination_ip: "", event_type: "", date_from: "", date_to: "" };
    setFilters(emptyFilters);
    fetchLogs(emptyFilters);
  };

  return (
    <div className="space-y-5">
      <section className="panel p-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr_1fr_1fr_auto_auto]">
          <div>
            <label className="label" htmlFor="severity">Severity</label>
            <select className="input mt-1" id="severity" name="severity" value={filters.severity} onChange={handleChange}>
              <option value="">All</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="source_ip">Source IP</label>
            <input className="input mt-1" id="source_ip" name="source_ip" value={filters.source_ip} onChange={handleChange} placeholder="Source IP" />
          </div>
          <div>
            <label className="label" htmlFor="destination_ip">Destination IP</label>
            <input className="input mt-1" id="destination_ip" name="destination_ip" value={filters.destination_ip} onChange={handleChange} placeholder="Destination IP" />
          </div>
          <div>
            <label className="label" htmlFor="event_type">Event Type</label>
            <input className="input mt-1" id="event_type" name="event_type" value={filters.event_type} onChange={handleChange} placeholder="Event type" />
          </div>
          <div>
            <label className="label" htmlFor="date_from">Date From</label>
            <input className="input mt-1" id="date_from" name="date_from" value={filters.date_from} onChange={handleChange} placeholder="YYYY-MM-DD HH:MM:SS" />
          </div>
          <div>
            <label className="label" htmlFor="date_to">Date To</label>
            <input className="input mt-1" id="date_to" name="date_to" value={filters.date_to} onChange={handleChange} placeholder="YYYY-MM-DD HH:MM:SS" />
          </div>
          <button className="btn-primary self-end" type="button" onClick={() => fetchLogs()}>
            <Filter size={17} aria-hidden="true" />
            Apply
          </button>
          <button className="btn-secondary self-end" type="button" onClick={resetFilters}>
            <RefreshCcw size={17} aria-hidden="true" />
            Reset
          </button>
        </div>
      </section>

      {error && <div className="rounded-md border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">{error}</div>}

      <section className="panel overflow-hidden">
        <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Security Logs</h3>
            <p className="text-sm text-slate-400">{loading ? "Loading..." : `${logs.length} records`}</p>
          </div>
          <Search size={20} className="text-signal-cyan" aria-hidden="true" />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[1080px] w-full">
            <thead className="table-head">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Source IP</th>
                <th className="px-4 py-3">Destination IP</th>
                <th className="px-4 py-3">Event Type</th>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3">Message</th>
                <th className="px-4 py-3">Created By</th>
                <th className="px-4 py-3">Created At</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log._id} className="hover:bg-white/[0.03]">
                  <td className="table-cell">{log.timestamp}</td>
                  <td className="table-cell">{log.source_ip}</td>
                  <td className="table-cell">{log.destination_ip}</td>
                  <td className="table-cell">{log.event_type}</td>
                  <td className="table-cell"><SeverityBadge severity={log.severity} /></td>
                  <td className="table-cell max-w-xs whitespace-normal">{log.message}</td>
                  <td className="table-cell">{log.created_by}</td>
                  <td className="table-cell">{log.created_at}</td>
                </tr>
              ))}
              {!loading && logs.length === 0 && (
                <tr>
                  <td className="table-cell text-center text-slate-400" colSpan="8">No logs found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
