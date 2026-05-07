import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

export function RegisterPage() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    dealershipName: "",
    city: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await register(form.name, form.email, form.password, form.dealershipName, form.city);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="auth-screen">
      <form className="auth-card" onSubmit={onSubmit}>
        <p className="eyebrow">New account</p>
        <h1>Register for CarSync</h1>
        <p className="muted">Create a tenant-aware dealership workspace and invite your first operator.</p>

        {error ? <div className="error-banner">{error}</div> : null}

        <div className="form-grid">
          <label className="field">
            <span>Your name</span>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </label>
          <label className="field">
            <span>Dealership name</span>
            <input value={form.dealershipName} onChange={(e) => setForm({ ...form, dealershipName: e.target.value })} required />
          </label>
          <label className="field">
            <span>City</span>
            <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </label>
          <label className="field">
            <span>Email</span>
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" required />
          </label>
          <label className="field">
            <span>Password</span>
            <input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} type="password" required />
          </label>
          <label className="field">
            <span>Confirm password</span>
            <input value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} type="password" required />
          </label>
        </div>

        <button className="primary-button" type="submit" disabled={saving}>
          {saving ? "Creating account..." : "Register"}
        </button>

        <p className="muted">
          Already registered? <Link to="/login">Login instead</Link>
        </p>
      </form>
    </div>
  );
}
