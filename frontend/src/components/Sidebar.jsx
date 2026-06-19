import { NavLink } from "react-router-dom";
import { Activity, Bell, Database, FileDown, FileText, FileUp, LayoutDashboard, Monitor, Network, PlusCircle, RadioTower, Router } from "lucide-react";
import BrandMark from "./BrandMark";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/logs", label: "Logs", icon: Database },
  { to: "/logs/add", label: "Add Log", icon: PlusCircle },
  { to: "/logs/upload", label: "Upload CSV", icon: FileUp },
  { to: "/alerts", label: "Alerts", icon: Bell },
  { to: "/agent-download", label: "Agent Download", icon: FileDown },
  { to: "/agents", label: "Connected Agents", icon: Monitor },
  { to: "/network/devices", label: "Network Devices", icon: Network },
  { to: "/traffic/live", label: "Live Traffic", icon: RadioTower },
  { to: "/traffic/analytics", label: "Traffic Analytics", icon: Router },
  { to: "/reports", label: "Reports", icon: FileText },
];

export default function Sidebar() {
  return (
    <aside className="border-b border-white/10 bg-surface-950/95 px-4 py-4 backdrop-blur lg:sticky lg:top-0 lg:min-h-screen lg:w-72 lg:border-b-0 lg:border-r">
      <div className="flex items-center gap-3 px-2">
        <BrandMark size="sm" />
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-signal-cyan">AI SOC</p>
          <h1 className="text-lg font-semibold text-white">Security Center</h1>
        </div>
      </div>

      <nav className="mt-5 flex gap-2 overflow-x-auto pb-1 lg:max-h-[calc(100vh-250px)] lg:flex-col lg:overflow-y-auto lg:pb-0" aria-label="Primary navigation">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex min-w-fit items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? "bg-signal-cyan text-slate-950 shadow-lg shadow-cyan-500/10"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`
            }
          >
            <Icon size={18} aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-6 hidden rounded-lg border border-white/10 bg-white/[0.03] p-4 lg:block">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
          <Activity size={17} className="text-signal-lime" aria-hidden="true" />
          Live Monitoring
        </div>
        <p className="mt-2 text-xs leading-5 text-slate-400">Logs and alerts are protected by JWT authentication and validated at the API boundary.</p>
      </div>
    </aside>
  );
}
