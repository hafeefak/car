type PageHeaderProps = {
  title: string;

  sideLabel?: string;
  sideValue?: string;
};

export function PageHeader({ title, sideLabel, sideValue }: PageHeaderProps) {
  return (
    <header className="page-header">
      <div>
      
        <h2>{title}</h2>
       
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
