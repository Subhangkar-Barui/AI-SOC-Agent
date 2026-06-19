import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import api from "../api/axios";
import StatCard from "../components/StatCard";
import { Activity, AlertTriangle, Database } from "lucide-react";

const colors = ["#32d7c5", "#8bd450", "#f5a524", "#ef4444", "#60a5fa"];

export default function TrafficAnalytics() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/traffic/stats")
      .then((response) => setStats(response.data))
      .catch(() => setError("Unable to load traffic analytics."));
  }, []);

  const tooltipStyle = { background: "rgb(var(--surface-900))", border: "1px solid rgb(var(--border-ui))", borderRadius: "8px" };
  const protocolData = stats?.protocol_distribution || [];
  const portData = stats?.top_ports || [];
  const sourceData = stats?.top_source_ips || [];
  const destinationData = stats?.top_destination_ips || [];

  return (
    <div className="space-y-5">
      {error && <div className="rounded-md border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">{error}</div>}
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard title="Total Packets" value={stats?.total_packets ?? 0} icon={Database} />
        <StatCard title="Suspicious Packets" value={stats?.suspicious_packets ?? 0} icon={Activity} accent="text-signal-amber" />
        <StatCard title="High Risk Packets" value={stats?.high_risk_packets ?? 0} icon={AlertTriangle} accent="text-red-300" />
      </section>
      <section className="grid gap-4 xl:grid-cols-2">
        <div className="panel p-5">
          <h3 className="text-lg font-semibold text-white">Protocol Distribution</h3>
          <div className="mt-4 h-72 overflow-hidden">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={250} debounce={100}>
              <PieChart>
                <Pie data={protocolData} dataKey="count" nameKey="protocol" outerRadius={96}>
                  {protocolData.map((item, index) => <Cell key={item.protocol} fill={colors[index % colors.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <ChartPanel title="Top Destination Ports" data={portData} dataKey="port" tooltipStyle={tooltipStyle} />
        <ChartPanel title="Top Source IPs" data={sourceData} dataKey="source_ip" tooltipStyle={tooltipStyle} />
        <ChartPanel title="Top Destination IPs" data={destinationData} dataKey="destination_ip" tooltipStyle={tooltipStyle} />
      </section>
    </div>
  );
}

function ChartPanel({ title, data, dataKey, tooltipStyle }) {
  return (
    <div className="panel p-5">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <div className="mt-4 h-72 overflow-hidden">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={250} debounce={100}>
          <BarChart data={data}>
            <CartesianGrid stroke="rgb(var(--border-ui))" vertical={false} />
            <XAxis dataKey={dataKey} stroke="rgb(var(--text-muted))" />
            <YAxis allowDecimals={false} stroke="rgb(var(--text-muted))" />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="count" fill="#32d7c5" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
