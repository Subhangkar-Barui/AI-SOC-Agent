import { useEffect, useState } from "react";
import { RefreshCcw } from "lucide-react";
import api from "../api/axios";
import AgentCard from "../components/AgentCard";

export default function ConnectedAgents() {
  const [agents, setAgents] = useState([]);
  const [error, setError] = useState("");

  const fetchAgents = async () => {
    setError("");
    try {
      const response = await api.get("/agents");
      setAgents(response.data);
    } catch {
      setError("Unable to load agents.");
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const deleteAgent = async (agentId) => {
    await api.delete(`/agent/${agentId}`);
    await fetchAgents();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-white">Connected Agents</h2>
          <p className="text-sm text-slate-400">Manage paired Windows monitoring agents.</p>
        </div>
        <button className="btn-secondary" type="button" onClick={fetchAgents}>
          <RefreshCcw size={16} aria-hidden="true" />
          Refresh
        </button>
      </div>
      {error && <div className="rounded-md border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">{error}</div>}
      <div className="grid gap-4 xl:grid-cols-2">
        {agents.map((agent) => <AgentCard key={agent.agent_id} agent={agent} onDelete={deleteAgent} />)}
        {agents.length === 0 && <div className="panel p-5 text-sm text-slate-400">No agents connected.</div>}
      </div>
    </div>
  );
}
