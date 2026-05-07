import type { Stat } from "../types";

export function StatGrid({ stats }: { stats: Stat[] }) {
  return (
    <section className="stat-grid">
      {stats.map((stat) => (
        <article key={stat.label} className="stat-card">
          <span>{stat.label}</span>
          <strong>{stat.value}</strong>
          <p>{stat.hint}</p>
        </article>
      ))}
    </section>
  );
}
