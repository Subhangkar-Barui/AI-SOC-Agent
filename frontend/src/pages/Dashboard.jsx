import { useEffect, useMemo, useState } from "react";
import { AlertCircle, AlertTriangle, BarChart3, CheckCircle2, Database, Monitor, Network, RadioTower, ShieldAlert, ShieldCheck } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import api from "../api/axios";
import StatCard from "../components/StatCard";

const defaultStats = {
  total_logs: 0,
  total_alerts: 0,
  open_alerts: 0,
  closed_alerts: 0,
  high_severity: 0,
  medium_severity: 0,
  low_severity: 0,
  total_agents: 0,
  online_agents: 0,
  offline_agents: 0,
  known_devices: 0,
  total_packets: 0,
  suspicious_packets: 0,
  high_risk_packets: 0,
};

const severityColors = ["#ef4444", "#f5a524", "#8bd450"];
const statusColors = ["#32d7c5", "#8bd450"];

export default function Dashboard() {
  const [stats, setStats] = useState(defaultStats);
  const [trafficStats, setTrafficStats] = useState({ protocol_distribution: [], top_ports: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.get("/dashboard/stats"), api.get("/traffic/stats")])
      .then(([statsResponse, trafficResponse]) => {
        setStats({ ...defaultStats, ...statsResponse.data });
        setTrafficStats(trafficResponse.data);
      })
      .catch(() => setError("Unable to load dashboard stats."))
      .finally(() => setLoading(false));
  }, []);

  const severityData = useMemo(() => [
    { name: "High", value: stats.high_severity },
    { name: "Medium", value: stats.medium_severity },
    { name: "Low", value: stats.low_severity },
  ], [stats]);

  const statusData = useMemo(() => [
    { name: "Open", alerts: stats.open_alerts },
    { name: "Closed", alerts: stats.closed_alerts },
  ], [stats]);

  const tooltipStyle = {
    background: "rgb(var(--surface-900))",
    border: "1px solid rgb(var(--border-ui))",
    borderRadius: "8px",
    color: "rgb(var(--text-strong))",
  };

  return (
    <div className="space-y-6">
      {error && <div className="rounded-md border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">{error}</div>}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Logs" value={loading ? "..." : stats.total_logs} icon={Database} />
        <StatCard title="Total Alerts" value={loading ? "..." : stats.total_alerts} icon={ShieldAlert} accent="text-signal-amber" />
        <StatCard title="Open Alerts" value={loading ? "..." : stats.open_alerts} icon={AlertTriangle} accent="text-red-300" />
        <StatCard title="Closed Alerts" value={loading ? "..." : stats.closed_alerts} icon={CheckCircle2} accent="text-green-300" />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard title="High Severity" value={loading ? "..." : stats.high_severity} icon={AlertCircle} accent="text-red-300" />
        <StatCard title="Medium Severity" value={loading ? "..." : stats.medium_severity} icon={BarChart3} accent="text-signal-amber" />
        <StatCard title="Low Severity" value={loading ? "..." : stats.low_severity} icon={ShieldCheck} accent="text-green-300" />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Connected Agents" value={loading ? "..." : stats.total_agents} icon={Monitor} />
        <StatCard title="Online Agents" value={loading ? "..." : stats.online_agents} icon={RadioTower} accent="text-green-300" />
        <StatCard title="Known Devices" value={loading ? "..." : stats.known_devices} icon={Network} />
        <StatCard title="Total Packets" value={loading ? "..." : stats.total_packets} icon={Database} />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <StatCard title="Suspicious Packets" value={loading ? "..." : stats.suspicious_packets} icon={AlertTriangle} accent="text-signal-amber" />
        <StatCard title="High Risk Packets" value={loading ? "..." : stats.high_risk_packets} icon={AlertCircle} accent="text-red-300" />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="panel p-5">
          <h3 className="text-lg font-semibold text-white">Severity Distribution</h3>
          <div className="mt-4 h-72 overflow-hidden">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={250} debounce={100}>
              <PieChart>
                <Pie data={severityData} dataKey="value" nameKey="name" innerRadius={62} outerRadius={96} paddingAngle={4}>
                  {severityData.map((entry, index) => (
                    <Cell key={entry.name} fill={severityColors[index]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ color: "rgb(var(--text-base))" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel p-5">
          <h3 className="text-lg font-semibold text-white">Alert Status</h3>
          <div className="mt-4 h-72 overflow-hidden">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={250} debounce={100}>
              <BarChart data={statusData}>
                <XAxis dataKey="name" stroke="rgb(var(--text-muted))" />
                <YAxis allowDecimals={false} stroke="rgb(var(--text-muted))" />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="alerts" radius={[6, 6, 0, 0]}>
                  {statusData.map((entry, index) => (
                    <Cell key={entry.name} fill={statusColors[index]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="panel p-5">
          <h3 className="text-lg font-semibold text-white">Protocol Distribution</h3>
          <div className="mt-4 h-72 overflow-hidden">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={250} debounce={100}>
              <PieChart>
                <Pie data={trafficStats.protocol_distribution || []} dataKey="count" nameKey="protocol" outerRadius={94}>
                  {(trafficStats.protocol_distribution || []).map((entry, index) => (
                    <Cell key={entry.protocol} fill={severityColors[index % severityColors.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ color: "rgb(var(--text-base))" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel p-5">
          <h3 className="text-lg font-semibold text-white">Top Destination Ports</h3>
          <div className="mt-4 h-72 overflow-hidden">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={250} debounce={100}>
              <BarChart data={trafficStats.top_ports || []}>
                <CartesianGrid stroke="rgb(var(--border-ui))" vertical={false} />
                <XAxis dataKey="port" stroke="rgb(var(--text-muted))" />
                <YAxis allowDecimals={false} stroke="rgb(var(--text-muted))" />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="#32d7c5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </div>
  );
}
