import { useEffect } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Sidebar from "./components/Sidebar";
import { applyTheme, getInitialTheme } from "./theme";
import AddLog from "./pages/AddLog";
import AgentDownload from "./pages/AgentDownload";
import Alerts from "./pages/Alerts";
import ConnectedAgents from "./pages/ConnectedAgents";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Logs from "./pages/Logs";
import LiveTraffic from "./pages/LiveTraffic";
import NetworkDevices from "./pages/NetworkDevices";
import Register from "./pages/Register";
import Reports from "./pages/Reports";
import TrafficAnalytics from "./pages/TrafficAnalytics";
import UploadCSV from "./pages/UploadCSV";

function AppLayout() {
  return (
    <div className="app-shell lg:flex">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <Navbar />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default function App() {
  useEffect(() => {
    applyTheme(getInitialTheme());
  }, []);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/logs" element={<Logs />} />
          <Route path="/logs/add" element={<AddLog />} />
          <Route path="/logs/upload" element={<UploadCSV />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/agent-download" element={<AgentDownload />} />
          <Route path="/agents" element={<ConnectedAgents />} />
          <Route path="/network/devices" element={<NetworkDevices />} />
          <Route path="/traffic/live" element={<LiveTraffic />} />
          <Route path="/traffic/analytics" element={<TrafficAnalytics />} />
          <Route path="/reports" element={<Reports />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
