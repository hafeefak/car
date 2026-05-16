import { useEffect, useState } from "react";
import { AppShell } from "../components/AppShell";
import { PageHeader } from "../components/PageHeader";
import { StatGrid } from "../components/StatGrid";
import { api } from "../lib/api";
import type { Snapshot } from "../types";

export function DashboardPage() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [error, setError] = useState("");
  const today = new Date().toISOString().slice(0, 10);

  const recentLeads = [...(snapshot?.leads ?? [])]
    .sort((left, right) => {
      const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
      const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
      return rightTime - leftTime;
    })
    .slice(0, 3);

  const todaysFollowUps = (snapshot?.followUps ?? []).filter((followUp) => {
    if (!followUp.dueAt) {
      return false;
    }

    return followUp.dueAt.slice(0, 10) === today;
  });

  useEffect(() => {
    api.snapshot().then(setSnapshot).catch((err) => setError(err.message));
  }, []);

  return (
    <AppShell>
      <PageHeader
        title="Dealer dashboard"
        
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
                <span>Most recent 3 leads</span>
              </div>
              <div className="stack-list">
                {recentLeads.map((lead) => (
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
                {recentLeads.length === 0 ? <p className="muted">No recent leads yet.</p> : null}
              </div>
            </article>

            <article className="panel dark-panel">
              <div className="panel-header">
                <h3>Today's follow-ups</h3>
                <span>{todaysFollowUps.length} due today</span>
              </div>
              <div className="stack-list">
                {todaysFollowUps.map((followUp) => (
                  <div key={followUp.id} className="dark-card">
                    <p className="eyebrow soft">{followUp.dueLabel}</p>
                    <strong>{followUp.title}</strong>
                    <p>{followUp.customerName}</p>
                    <small>{followUp.notes}</small>
                  </div>
                ))}
                {todaysFollowUps.length === 0 ? <p className="muted">No follow-ups due today.</p> : null}
              </div>
            </article>
          </section>
        </>
      ) : null}
    </AppShell>
  );
}
