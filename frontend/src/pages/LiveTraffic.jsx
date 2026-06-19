import { useEffect, useState } from "react";
import { Filter, RefreshCcw, Wifi } from "lucide-react";
import api from "../api/axios";
import StatusBadge from "../components/StatusBadge";

export default function LiveTraffic() {
  const [traffic, setTraffic] = useState([]);
  const [summary, setSummary] = useState(null);
  const [filters, setFilters] = useState({ protocol: "", source_ip: "", destination_ip: "", destination_port: "", status: "", agent_id: "" });
  const [error, setError] = useState("");

  const fetchTraffic = async (activeFilters = filters) => {
    const params = Object.fromEntries(Object.entries(activeFilters).filter(([, value]) => String(value).trim()));
    setError("");
    try {
      const [trafficResponse, summaryResponse] = await Promise.all([
        api.get("/traffic", { params: { ...params, limit: 75 } }),
        api.get("/traffic/live-summary"),
      ]);
      setTraffic(trafficResponse.data.items || []);
      setSummary(summaryResponse.data);
    } catch {
      setError("Unable to load live traffic.");
    }
  };

  useEffect(() => {
    fetchTraffic({ protocol: "", source_ip: "", destination_ip: "", destination_port: "", status: "", agent_id: "" });
    const timer = setInterval(() => fetchTraffic(), 5000);
    return () => clearInterval(timer);
  }, []);

  const handleChange = (event) => setFilters({ ...filters, [event.target.name]: event.target.value });
  const reset = () => {
    const empty = { protocol: "", source_ip: "", destination_ip: "", destination_port: "", status: "", agent_id: "" };
    setFilters(empty);
    fetchTraffic(empty);
  };

  return (
    <div className="space-y-5">
      <section className="grid gap-4 md:grid-cols-3">
        <div className="panel p-5">
          <p className="text-sm text-slate-400">Recent Traffic</p>
          <p className="mt-2 text-3xl font-semibold text-white">{summary?.recent_traffic_count ?? 0}</p>
        </div>
        <div className="panel p-5">
          <p className="text-sm text-slate-400">Suspicious Recent</p>
          <p className="mt-2 text-3xl font-semibold text-white">{summary?.suspicious_count ?? 0}</p>
        </div>
        <div className="panel p-5">
          <p className="text-sm text-slate-400">Active Agents</p>
          <p className="mt-2 text-3xl font-semibold text-white">{summary?.active_agents ?? 0}</p>
        </div>
      </section>

      <section className="panel p-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr_1fr_1fr_auto_auto]">
          <select className="input" name="protocol" value={filters.protocol} onChange={handleChange}>
            <option value="">All protocols</option>
            <option value="TCP">TCP</option>
            <option value="UDP">UDP</option>
            <option value="ICMP">ICMP</option>
            <option value="ARP">ARP</option>
            <option value="OTHER">OTHER</option>
          </select>
          <input className="input" name="source_ip" value={filters.source_ip} onChange={handleChange} placeholder="Source IP" />
          <input className="input" name="destination_ip" value={filters.destination_ip} onChange={handleChange} placeholder="Destination IP" />
          <input className="input" name="destination_port" value={filters.destination_port} onChange={handleChange} placeholder="Dest port" />
          <select className="input" name="status" value={filters.status} onChange={handleChange}>
            <option value="">All statuses</option>
            <option value="Normal">Normal</option>
            <option value="Suspicious">Suspicious</option>
            <option value="High Risk">High Risk</option>
          </select>
          <input className="input" name="agent_id" value={filters.agent_id} onChange={handleChange} placeholder="Agent ID" />
          <button className="btn-primary" type="button" onClick={() => fetchTraffic()}>
            <Filter size={16} aria-hidden="true" />
            Apply
          </button>
          <button className="btn-secondary" type="button" onClick={reset}>
            <RefreshCcw size={16} aria-hidden="true" />
            Reset
          </button>
        </div>
      </section>

      {error && <div className="rounded-md border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">{error}</div>}

      <section className="panel overflow-hidden">
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
          <Wifi className="text-signal-cyan" size={20} aria-hidden="true" />
          <div>
            <h2 className="text-lg font-semibold text-white">Live Traffic Metadata</h2>
            <p className="text-sm text-slate-400">Auto-refreshes every 5 seconds</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[1180px] w-full">
            <thead className="table-head">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Source IP</th>
                <th className="px-4 py-3">Destination IP</th>
                <th className="px-4 py-3">Protocol</th>
                <th className="px-4 py-3">Src Port</th>
                <th className="px-4 py-3">Dst Port</th>
                <th className="px-4 py-3">Size</th>
                <th className="px-4 py-3">Direction</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Risk</th>
                <th className="px-4 py-3">Agent</th>
              </tr>
            </thead>
            <tbody>
              {traffic.map((event) => (
                <tr key={event._id} className="hover:bg-white/[0.03]">
                  <td className="table-cell">{event.timestamp}</td>
                  <td className="table-cell">{event.source_ip}</td>
                  <td className="table-cell">{event.destination_ip}</td>
                  <td className="table-cell">{event.protocol}</td>
                  <td className="table-cell">{event.source_port ?? "-"}</td>
                  <td className="table-cell">{event.destination_port ?? "-"}</td>
                  <td className="table-cell">{event.packet_size}</td>
                  <td className="table-cell">{event.direction}</td>
                  <td className="table-cell"><StatusBadge status={event.status} /></td>
                  <td className="table-cell">{event.risk_score}</td>
                  <td className="table-cell">{event.agent_id}</td>
                </tr>
              ))}
              {traffic.length === 0 && <tr><td className="table-cell text-center text-slate-400" colSpan="11">No traffic received yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
