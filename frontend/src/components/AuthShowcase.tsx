import { Link } from "react-router-dom";

type AuthShowcaseProps = {
  title: string;
  body: string;
  primaryLabel: string;
  primaryTo: string;
  secondaryLabel: string;
  secondaryTo: string;
};

const demoRequestHref =
  "mailto:?subject=Request%20a%20CarSync%20demo&body=Hi%2C%20I%20would%20like%20to%20book%20a%2015-20%20minute%20demo%20for%20CarSync.%20Please%20share%20available%20slots.";

export function AuthShowcase({
  title,
  body,
  primaryLabel,
  primaryTo,
  secondaryLabel,
  secondaryTo
}: AuthShowcaseProps) {
  return (
    <section className="auth-showcase">
      <div className="auth-showcase-copy">
        <p className="eyebrow">Built for used-car dealerships</p>
        <h1>{title}</h1>
        <p className="auth-showcase-body">{body}</p>

        <div className="auth-showcase-actions">
          <Link className="primary-button" to={primaryTo}>
            {primaryLabel}
          </Link>
          <Link className="ghost-button auth-ghost-button" to={secondaryTo}>
            {secondaryLabel}
          </Link>
        </div>
      </div>

      <div className="auth-highlight-grid">
        <article className="auth-highlight-card">
          <span className="eyebrow">Why CarSync</span>
          <h2>One system for every sales conversation</h2>
          <p>
            Stop juggling calls, WhatsApp chats, and spreadsheets. CarSync keeps leads,
            follow-ups, inventory, and bookings connected in one workflow.
          </p>
        </article>

        <article className="auth-metric-strip">
          <div>
            <strong>Lead</strong>
            <span>Capture every inquiry with customer details, source, and budget.</span>
          </div>
          <div>
            <strong>Follow-up</strong>
            <span>Schedule callbacks before prospects go cold.</span>
          </div>
          <div>
            <strong>Booking</strong>
            <span>Turn active interest into confirmed bookings with inventory status updates.</span>
          </div>
        </article>

        <article className="auth-demo-card" id="demo-request">
          <div>
            <span className="eyebrow">Demo request</span>
            <h2>See CarSync in a 15-minute walkthrough</h2>
            <p>
              We will show how your team can track leads, manage stock, and move faster from
              inquiry to booking.
            </p>
          </div>
          <a className="primary-button" href={demoRequestHref}>
            Request Demo
          </a>
        </article>
      </div>
    </section>
  );
}
