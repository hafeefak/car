import { Link, useLocation, useNavigate } from "react-router-dom";
import type { PropsWithChildren } from "react";
import { useAuth } from "../auth/AuthProvider";


const navItems = [
  { to: "/", label: "Dashboard" },
  { to: "/leads", label: "Leads" },
  { to: "/inventory", label: "Inventory" },
  { to: "/follow-ups", label: "Follow-ups" },
  { to: "/bookings", label: "Bookings" }
];

export function AppShell({ children }: PropsWithChildren) {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
 

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
         
          <h1>{user?.dealershipName ?? "Dealer cockpit"}</h1>
         
        </div>

        <nav className="nav-list">
          {navItems.map((item) => (
            <Link key={item.to} to={item.to} className={pathname === item.to ? "nav-item active" : "nav-item"}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="sidebar-card">
          <p className="eyebrow">Signed in</p>
          <strong>{user?.name}</strong>
          <p className="muted">{user?.email}</p>
          <button
            className="ghost-button"
            onClick={() => {
              logout();
              navigate("/login");
            }}
          >
            Logout
          </button>
        </div>
      </aside>

      <main className="main-panel">{children}</main>
    </div>
  );
}
