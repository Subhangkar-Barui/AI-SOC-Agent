import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogIn } from "lucide-react";
import api from "../api/axios";
import BrandMark from "../components/BrandMark";
import ThemeToggle from "../components/ThemeToggle";

function getErrorMessage(error) {
  const detail = error.response?.data?.detail;
  if (typeof detail === "string") return detail;
  return "Unable to sign in. Check your credentials and try again.";
}

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/login", form);
      sessionStorage.setItem("token", response.data.access_token);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-theme-control">
        <ThemeToggle />
      </div>
      <section className="panel w-full max-w-md p-5 sm:p-6">
        <div className="mb-6 flex items-center gap-3">
          <BrandMark />
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-signal-cyan">AI SOC</p>
            <h1 className="text-2xl font-semibold text-white">Analyst Login</h1>
          </div>
        </div>

        {error && <div className="mb-4 rounded-md border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">{error}</div>}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input className="input mt-1" id="email" name="email" type="email" value={form.email} onChange={handleChange} autoComplete="email" required />
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input className="input mt-1" id="password" name="password" type="password" value={form.password} onChange={handleChange} autoComplete="current-password" required />
          </div>
          <button className="btn-primary w-full" type="submit" disabled={loading}>
            <LogIn size={18} aria-hidden="true" />
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-400">
          New analyst? <Link className="font-semibold text-signal-cyan hover:text-teal-200" to="/register">Create an account</Link>
        </p>
      </section>
    </main>
  );
}
