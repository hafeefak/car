import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { AuthShowcase } from "../components/AuthShowcase";

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
      <div className="auth-layout">
        <AuthShowcase
          title="A simpler sales operating system for growing dealers"
          body="Give your dealership a clear process from first inquiry to final booking. CarSync helps teams respond faster, stay organized, and turn more follow-ups into revenue."
          primaryLabel="Login"
          primaryTo="/login"
          secondaryLabel="Request demo"
          secondaryTo="/login#demo-request"
        />
        <form className="auth-card auth-card-register" onSubmit={onSubmit}>
          <h1>Register for CarSync</h1>

          {error ? <div className="error-banner">{error}</div> : null}

          <div className="form-grid">
            <label className="field">
              <span>Your name</span>
              <input className="auth-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </label>
            <label className="field">
              <span>Dealership name</span>
              <input className="auth-input" value={form.dealershipName} onChange={(e) => setForm({ ...form, dealershipName: e.target.value })} required />
            </label>
            <label className="field">
              <span>City</span>
              <input className="auth-input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </label>
            <label className="field">
              <span>Email</span>
              <input className="auth-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" autoComplete="new-email" required />
            </label>
            <label className="field">
              <span>Password</span>
              <input className="auth-input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} type="password" autoComplete="new-password" required />
            </label>
            <label className="field">
              <span>Confirm password</span>
              <input className="auth-input" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} type="password" required />
            </label>
          </div>

          <button className="auth-submit-button" type="submit" disabled={saving}>
            {saving ? "Creating account..." : "Register"}
          </button>

          <p className="muted">
            Already registered? <Link to="/login">Login instead</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
