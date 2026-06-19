import { Monitor, Trash2 } from "lucide-react";
import StatusBadge from "./StatusBadge";

export default function AgentCard({ agent, onDelete }) {
  return (
    <article className="panel p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-md border border-white/10 bg-white/5 text-signal-cyan">
            <Monitor size={20} aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-semibold text-white">{agent.device_name}</h3>
            <p className="mt-1 text-sm text-slate-400">{agent.os} | v{agent.agent_version}</p>
          </div>
        </div>
        <StatusBadge status={agent.status} />
      </div>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-slate-400">Agent ID</dt>
          <dd className="break-all text-slate-100">{agent.agent_id}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Last Heartbeat</dt>
          <dd className="text-slate-100">{agent.last_heartbeat || "-"}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Created</dt>
          <dd className="text-slate-100">{agent.created_at || "-"}</dd>
        </div>
      </dl>
      {onDelete && (
        <button className="btn-secondary mt-4" type="button" onClick={() => onDelete(agent.agent_id)}>
          <Trash2 size={16} aria-hidden="true" />
          Unpair
        </button>
      )}
    </article>
  );
}
