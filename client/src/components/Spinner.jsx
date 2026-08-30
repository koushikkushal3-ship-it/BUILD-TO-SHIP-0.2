export default function Spinner({ label }) {
  return (
    <div className="flex h-full min-h-[40vh] flex-col items-center justify-center gap-3 text-slate-400">
      <div className="spinner" />
      {label && <p className="text-sm">{label}</p>}
    </div>
  );
}
