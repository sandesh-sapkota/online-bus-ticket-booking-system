export function Spinner({ className = 'h-5 w-5 text-brand-600' }) {
  return <span className={`spinner ${className}`} role="status" aria-label="Loading" />;
}

export function PageLoader({ label = 'Loading…' }) {
  return (
    <div className="page flex items-center justify-center py-24">
      <div className="flex flex-col items-center gap-3 text-ink-500">
        <Spinner className="h-8 w-8 text-brand-600" />
        <p className="text-sm font-medium">{label}</p>
      </div>
    </div>
  );
}

export default Spinner;
