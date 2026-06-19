import { useState } from "react";
import { PlusCircle } from "lucide-react";
import api from "../api/axios";

const initialForm = {
  timestamp: "",
  source_ip: "",
  destination_ip: "",
  event_type: "",
  severity: "Medium",
  message: "",
};

function getErrorMessage(error) {
  const detail = error.response?.data?.detail;
  if (typeof detail === "string") return detail;
  return "Unable to add log. Check the fields and try again.";
}

export default function AddLog() {
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      await api.post("/logs", form);
      setMessage("Log added successfully.");
      setForm(initialForm);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel max-w-4xl p-5">
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-white">Add Security Log</h3>
        <p className="text-sm text-slate-400">High severity entries automatically open alerts.</p>
      </div>

      {message && <div className="mb-4 rounded-md border border-green-400/30 bg-green-500/10 px-3 py-2 text-sm text-green-100">{message}</div>}
      {error && <div className="mb-4 rounded-md border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">{error}</div>}

      <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
        <div>
          <label className="label" htmlFor="timestamp">Timestamp</label>
          <input className="input mt-1" id="timestamp" name="timestamp" value={form.timestamp} onChange={handleChange} placeholder="YYYY-MM-DD HH:MM:SS" required />
        </div>
        <div>
          <label className="label" htmlFor="severity">Severity</label>
          <select className="input mt-1" id="severity" name="severity" value={form.severity} onChange={handleChange}>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="source_ip">Source IP</label>
          <input className="input mt-1" id="source_ip" name="source_ip" value={form.source_ip} onChange={handleChange} placeholder="Source IP" required />
        </div>
        <div>
          <label className="label" htmlFor="destination_ip">Destination IP</label>
          <input className="input mt-1" id="destination_ip" name="destination_ip" value={form.destination_ip} onChange={handleChange} placeholder="Destination IP" required />
        </div>
        <div className="md:col-span-2">
          <label className="label" htmlFor="event_type">Event Type</label>
          <input className="input mt-1" id="event_type" name="event_type" value={form.event_type} onChange={handleChange} placeholder="Event type from your logs" required />
        </div>
        <div className="md:col-span-2">
          <label className="label" htmlFor="message">Message</label>
          <textarea className="input mt-1 min-h-28 resize-y" id="message" name="message" value={form.message} onChange={handleChange} placeholder="Log message from your SIEM or source system" required />
        </div>
        <div className="md:col-span-2">
          <button className="btn-primary" type="submit" disabled={loading}>
            <PlusCircle size={18} aria-hidden="true" />
            {loading ? "Saving..." : "Add Log"}
          </button>
        </div>
      </form>
    </section>
  );
}
