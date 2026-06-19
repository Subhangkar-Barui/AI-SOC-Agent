import { useEffect, useState } from "react";
import { Copy, Download, KeyRound, RefreshCcw, ShieldCheck } from "lucide-react";
import api from "../api/axios";
import AgentCard from "../components/AgentCard";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
const releaseUrl = import.meta.env.VITE_AGENT_DOWNLOAD_URL || "https://github.com/your-username/ai-soc-dashboard/releases";

export default function AgentDownload() {
  const [pairing, setPairing] = useState(null);
  const [agents, setAgents] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchAgents = async () => {
    const response = await api.get("/agents");
    setAgents(response.data);
  };

  useEffect(() => {
    fetchAgents().catch(() => setError("Unable to load connected agents."));
  }, []);

  const generateKey = async () => {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const response = await api.post("/agent/generate-key");
      setPairing(response.data);
    } catch {
      setError("Unable to generate pairing key.");
    } finally {
      setLoading(false);
    }
  };

  const copyValue = async (value, label) => {
    await navigator.clipboard.writeText(value);
    setMessage(`${label} copied.`);
  };

  return (
    <div className="space-y-5">
      <section className="panel p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-white">Windows Network Monitoring Agent</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              Download the visible, consent-based Windows agent to monitor metadata from your own device and authorized network only. The agent sends data to the backend, not directly to the browser.
            </p>
          </div>
          <a className="btn-primary" href={releaseUrl} target="_blank" rel="noreferrer">
            <Download size={18} aria-hidden="true" />
            Download Agent
          </a>
        </div>
      </section>

      {(message || error) && (
        <div className={`rounded-md border px-3 py-2 text-sm ${error ? "border-red-400/30 bg-red-500/10 text-red-100" : "border-green-400/30 bg-green-500/10 text-green-100"}`}>
          {error || message}
        </div>
      )}

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="panel p-5">
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-signal-cyan" size={22} aria-hidden="true" />
            <h3 className="text-lg font-semibold text-white">Pair New Agent</h3>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div>
              <label className="label">Backend URL</label>
              <div className="mt-1 flex gap-2">
                <input className="input" readOnly value={apiBaseUrl} />
                <button className="btn-secondary px-3" type="button" onClick={() => copyValue(apiBaseUrl, "Backend URL")} title="Copy backend URL">
                  <Copy size={16} aria-hidden="true" />
                </button>
              </div>
            </div>
            <div>
              <label className="label">Pairing Key</label>
              <div className="mt-1 flex gap-2">
                <input className="input" readOnly value={pairing?.pairing_key || "Generate a key"} />
                {pairing?.pairing_key && (
                  <button className="btn-secondary px-3" type="button" onClick={() => copyValue(pairing.pairing_key, "Pairing key")} title="Copy pairing key">
                    <Copy size={16} aria-hidden="true" />
                  </button>
                )}
              </div>
              {pairing?.expires_at && <p className="mt-2 text-xs text-slate-400">Expires at {pairing.expires_at}</p>}
            </div>
          </div>
          <button className="btn-primary mt-5" type="button" onClick={generateKey} disabled={loading}>
            <KeyRound size={18} aria-hidden="true" />
            {loading ? "Generating..." : "Generate Pairing Key"}
          </button>
        </div>

        <aside className="panel p-5">
          <h3 className="text-lg font-semibold text-white">Setup Flow</h3>
          <ol className="mt-4 space-y-3 text-sm text-slate-300">
            <li>1. Download or build the Windows agent.</li>
            <li>2. Run it visibly in a terminal.</li>
            <li>3. Enter the backend URL and pairing key.</li>
            <li>4. Select your network adapter.</li>
            <li>5. Monitor metadata from your authorized network.</li>
          </ol>
          <p className="mt-4 rounded-md border border-amber-300/30 bg-amber-400/10 p-3 text-sm text-amber-100">
            Use only on your own device, lab, home network, or a network where you have explicit permission.
          </p>
        </aside>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-white">Connected Agents</h3>
          <button className="btn-secondary" type="button" onClick={fetchAgents}>
            <RefreshCcw size={16} aria-hidden="true" />
            Refresh
          </button>
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          {agents.map((agent) => <AgentCard key={agent.agent_id} agent={agent} />)}
          {agents.length === 0 && <div className="panel p-5 text-sm text-slate-400">No agents connected yet.</div>}
        </div>
      </section>
    </div>
  );
}
