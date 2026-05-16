type PageHeaderProps = {
  title: string;
  subtitle?: string;

  sideLabel?: string;
  sideValue?: string;
};

export function PageHeader({ title, subtitle, sideLabel, sideValue }: PageHeaderProps) {
  return (
    <header className="page-header">
      <div>
        <h2>{title}</h2>
        {subtitle ? <p className="lead-copy">{subtitle}</p> : null}
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
