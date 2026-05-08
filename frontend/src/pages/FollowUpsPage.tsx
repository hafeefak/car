import { useEffect, useState } from "react";
import { AppShell } from "../components/AppShell";
import { PageHeader } from "../components/PageHeader";
import { api } from "../lib/api";
import type { FollowUp } from "../types";

export function FollowUpsPage() {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.followUps().then(setFollowUps).catch((err) => setError(err.message));
  }, []);

  return (
    <AppShell>
      <PageHeader
        title="Follow-ups"
        
      />
      {error ? <div className="error-banner">{error}</div> : null}
      <section className="panel">
        <div className="panel-header">
          <h3>Reminder queue</h3>
          <span>{followUps.length} pending</span>
        </div>
        <div className="stack-list">
          {followUps.map((followUp) => (
            <div key={followUp.id} className="list-card">
              <div className="between-row">
                <div>
                  <strong>{followUp.title}</strong>
                  <p>{followUp.customerName}</p>
                </div>
                <span className="badge">{followUp.status}</span>
              </div>
              {followUp.leadInterest ? <p className="muted">Lead: {followUp.leadInterest}</p> : null}
              <p>{followUp.notes}</p>
              <small>{followUp.dueLabel}</small>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
