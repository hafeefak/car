import { useEffect, useState } from "react";
import { AppShell } from "../components/AppShell";
import { PageHeader } from "../components/PageHeader";
import { StatGrid } from "../components/StatGrid";
import { api } from "../lib/api";
import type { Snapshot } from "../types";

export function DashboardPage() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.snapshot().then(setSnapshot).catch((err) => setError(err.message));
  }, []);

  return (
    <AppShell>
      <PageHeader
        title="Dealer dashboard"
        subtitle="A focused React + Spring Boot cockpit for second-hand car dealers with tenant-safe data access."
        sideLabel="Cash Inflow"
        sideValue={snapshot?.revenue ?? "Loading..."}
      />
      {error ? <div className="error-banner">{error}</div> : null}
      {snapshot ? (
        <>
          <StatGrid stats={snapshot.stats} />
          <section className="two-column">
            <article className="panel">
              <div className="panel-header">
                <h3>Pipeline at a glance</h3>
                <span>Priority board</span>
              </div>
              <div className="stack-list">
                {snapshot.leads.map((lead) => (
                  <div key={lead.id} className="list-card">
                    <div className="between-row">
                      <div>
                        <strong>{lead.customerName}</strong>
                        <p>{lead.interest} from {lead.source}</p>
                      </div>
                      <span className="badge">{lead.status}</span>
                    </div>
                    <p className="muted">{lead.city} | {lead.budget}</p>
                  </div>
                ))}
              </div>
            </article>

            <article className="panel dark-panel">
              <div className="panel-header">
                <h3>Today's follow-ups</h3>
                <span>Action queue</span>
              </div>
              <div className="stack-list">
                {snapshot.followUps.map((followUp) => (
                  <div key={followUp.id} className="dark-card">
                    <p className="eyebrow soft">{followUp.dueLabel}</p>
                    <strong>{followUp.title}</strong>
                    <p>{followUp.customerName}</p>
                    <small>{followUp.notes}</small>
                  </div>
                ))}
              </div>
            </article>
          </section>
        </>
      ) : null}
    </AppShell>
  );
}
