type PageHeaderProps = {
  title: string;
  subtitle: string;
  sideLabel?: string;
  sideValue?: string;
};

export function PageHeader({ title, subtitle, sideLabel, sideValue }: PageHeaderProps) {
  return (
    <header className="page-header">
      <div>
        <p className="eyebrow">CarSync CRM</p>
        <h2>{title}</h2>
        <p className="lead-copy">{subtitle}</p>
      </div>

      {sideLabel && sideValue ? (
        <div className="metric-pill">
          <span>{sideLabel}</span>
          <strong>{sideValue}</strong>
        </div>
      ) : null}
    </header>
  );
}
