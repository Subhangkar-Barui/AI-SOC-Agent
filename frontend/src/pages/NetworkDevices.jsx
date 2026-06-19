import { useEffect, useState } from "react";
import { Filter, RefreshCcw } from "lucide-react";
import api from "../api/axios";
import StatusBadge from "../components/StatusBadge";

export default function NetworkDevices() {
  const [devices, setDevices] = useState([]);
  const [filters, setFilters] = useState({ agent_id: "", status: "", ip_address: "", hostname: "" });
  const [error, setError] = useState("");

  const fetchDevices = async (activeFilters = filters) => {
    const params = Object.fromEntries(Object.entries(activeFilters).filter(([, value]) => value.trim()));
    setError("");
    try {
      const response = await api.get("/network/devices", { params });
      setDevices(response.data);
    } catch {
      setError("Unable to load network devices.");
    }
  };

  useEffect(() => {
    fetchDevices({ agent_id: "", status: "", ip_address: "", hostname: "" });
  }, []);

  const handleChange = (event) => setFilters({ ...filters, [event.target.name]: event.target.value });
  const reset = () => {
    const empty = { agent_id: "", status: "", ip_address: "", hostname: "" };
    setFilters(empty);
    fetchDevices(empty);
  };

  return (
    <div className="space-y-5">
      <section className="panel p-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr_auto_auto]">
          <input className="input" name="agent_id" value={filters.agent_id} onChange={handleChange} placeholder="Agent ID" />
          <select className="input" name="status" value={filters.status} onChange={handleChange}>
            <option value="">All statuses</option>
            <option value="Online">Online</option>
            <option value="Offline">Offline</option>
            <option value="Unknown">Unknown</option>
          </select>
          <input className="input" name="ip_address" value={filters.ip_address} onChange={handleChange} placeholder="IP address" />
          <input className="input" name="hostname" value={filters.hostname} onChange={handleChange} placeholder="Hostname" />
          <button className="btn-primary" type="button" onClick={() => fetchDevices()}>
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
        <div className="border-b border-white/10 px-5 py-4">
          <h2 className="text-lg font-semibold text-white">Network Devices</h2>
          <p className="text-sm text-slate-400">{devices.length} records</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[1040px] w-full">
            <thead className="table-head">
              <tr>
                <th className="px-4 py-3">IP Address</th>
                <th className="px-4 py-3">MAC</th>
                <th className="px-4 py-3">Hostname</th>
                <th className="px-4 py-3">Vendor</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">First Seen</th>
                <th className="px-4 py-3">Last Seen</th>
                <th className="px-4 py-3">Agent</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((device) => (
                <tr key={device._id} className="hover:bg-white/[0.03]">
                  <td className="table-cell">{device.ip_address}</td>
                  <td className="table-cell">{device.mac_address || "-"}</td>
                  <td className="table-cell">{device.hostname || "-"}</td>
                  <td className="table-cell">{device.vendor || "Unknown"}</td>
                  <td className="table-cell"><StatusBadge status={device.status} /></td>
                  <td className="table-cell">{device.first_seen}</td>
                  <td className="table-cell">{device.last_seen}</td>
                  <td className="table-cell">{device.agent_id}</td>
                </tr>
              ))}
              {devices.length === 0 && <tr><td className="table-cell text-center text-slate-400" colSpan="8">No devices discovered.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
