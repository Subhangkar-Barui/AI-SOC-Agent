import { useState } from "react";
import { FileUp, Upload } from "lucide-react";
import api from "../api/axios";

function getErrorMessage(error) {
  const detail = error.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (detail?.message) return detail.message;
  return "CSV upload failed. Check the file and try again.";
}

export default function UploadCSV() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0] || null;
    setFile(selectedFile);
    setResult(null);
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setResult(null);
    setError("");

    if (!file) {
      setError("Choose a CSV file before uploading.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    setLoading(true);

    try {
      const response = await api.post("/logs/upload-csv", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(response.data);
      setFile(null);
      event.target.reset();
    } catch (err) {
      setError(getErrorMessage(err));
      const skippedRows = err.response?.data?.detail?.skipped_rows;
      if (skippedRows) {
        setResult({ skipped_rows: skippedRows, logs_inserted: 0, alerts_created: 0 });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
      <section className="panel p-5">
        <div className="mb-5 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-md border border-white/10 bg-white/5 text-signal-cyan">
            <FileUp size={21} aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Upload CSV Logs</h3>
            <p className="text-sm text-slate-400">Valid rows are imported and invalid rows are reported.</p>
          </div>
        </div>

        {error && <div className="mb-4 rounded-md border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">{error}</div>}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block rounded-lg border border-dashed border-signal-cyan/40 bg-signal-cyan/5 p-6 text-center transition hover:border-signal-cyan">
            <input className="sr-only" type="file" accept=".csv,text/csv" onChange={handleFileChange} />
            <Upload className="mx-auto text-signal-cyan" size={32} aria-hidden="true" />
            <span className="mt-3 block text-sm font-semibold text-white">{file ? file.name : "Choose CSV file"}</span>
          </label>
          <button className="btn-primary" type="submit" disabled={loading}>
            <FileUp size={18} aria-hidden="true" />
            {loading ? "Uploading..." : "Upload"}
          </button>
        </form>

        {result && (
          <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-sm text-slate-400">Logs Inserted</p>
                <p className="text-2xl font-semibold text-white">{result.logs_inserted ?? 0}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Alerts Created</p>
                <p className="text-2xl font-semibold text-white">{result.alerts_created ?? 0}</p>
              </div>
            </div>
            {result.skipped_rows?.length > 0 && (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[520px]">
                  <thead className="table-head">
                    <tr>
                      <th className="px-4 py-3">Row</th>
                      <th className="px-4 py-3">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.skipped_rows.map((row) => (
                      <tr key={`${row.row}-${row.reason}`}>
                        <td className="table-cell">{row.row}</td>
                        <td className="table-cell">{row.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </section>

      <aside className="panel p-5">
        <h3 className="text-lg font-semibold text-white">CSV Columns</h3>
        <pre className="mt-4 overflow-x-auto rounded-md border border-white/10 bg-surface-950 p-3 text-xs leading-6 text-slate-300">timestamp,source_ip,destination_ip,event_type,severity,message</pre>
        <div className="mt-4 space-y-2 text-sm text-slate-400">
          <p>Timestamp format: YYYY-MM-DD HH:MM:SS</p>
          <p>Severity values: High, Medium, Low</p>
          <p>Upload real exports from your log source. Rows with missing values or invalid fields are skipped and listed after upload.</p>
        </div>
      </aside>
    </div>
  );
}
