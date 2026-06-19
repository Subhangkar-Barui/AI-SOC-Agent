import { useEffect, useState } from "react";
import { LogOut, UserCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    api.get("/profile")
      .then((response) => {
        if (isMounted) setProfile(response.data);
      })
      .catch(() => {
        if (isMounted) setProfile(null);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const logout = () => {
    sessionStorage.removeItem("token");
    navigate("/login", { replace: true });
  };

  return (
    <header className="border-b border-white/10 bg-surface-900/90 px-4 py-4 backdrop-blur lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">Operations Dashboard</p>
          <h2 className="text-xl font-semibold text-white">Security Monitoring</h2>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <ThemeToggle compact />
          <div className="hidden items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 sm:flex">
            <UserCircle size={18} className="text-signal-cyan" aria-hidden="true" />
            {profile?.name || profile?.email || "Analyst"}
          </div>
          <button className="btn-secondary" type="button" onClick={logout} title="Log out">
            <LogOut size={17} aria-hidden="true" />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
