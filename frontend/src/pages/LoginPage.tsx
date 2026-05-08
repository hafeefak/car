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

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      navigate("/", { replace: true });
    }
  }, [loading, user, navigate]);

  // Clear fields on mount (optional)
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
        <h1>CarSync</h1>

        {error && <div className="error-banner">{error}</div>}

        <label className="field">
          <span>Email</span>
          <input
            type="email"
              

            value={email}
            onChange={(e) => setEmail(e.target.value)}
          
            autoComplete="new-email"
            required
          />
        </label>

        <label className="field">
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
           
            autoComplete="new-password"
            required
          />
        </label>

        <button className="primary-button " type="submit" disabled={saving}>
          {saving ? "Signing in..." : "Login"}
        </button>

        <p className="muted">
          New to CarSync? <Link to="/register">Create an account</Link>
        </p>
      </form>
    </div>
  );
}