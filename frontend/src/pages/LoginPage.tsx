import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

export function LoginPage() {
  const { user, login, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      navigate("/", { replace: true });
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    setEmail("");
    setPassword("");
  }, []);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      await login(email, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="auth-screen">
      <form className="auth-card" onSubmit={onSubmit} autoComplete="off">
        <p className="eyebrow">Dealer access</p>
        <h1>Login to CarSync</h1>
        <p className="muted">
          Use your account to access leads, inventory, follow-ups, and bookings.
        </p>

        {error ? <div className="error-banner">{error}</div> : null}

        <label className="field">
          <span>Email</span>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            autoComplete="off"
            required
          />
        </label>

        <label className="field">
          <span>Password</span>
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            autoComplete="new-password"
            required
          />
        </label>

        <button className="primary-button" type="submit" disabled={saving}>
          {saving ? "Signing in..." : "Login"}
        </button>

        <p className="muted">
          New to CarSync? <Link to="/register">Create an account</Link>
        </p>
      </form>
    </div>
  );
}
