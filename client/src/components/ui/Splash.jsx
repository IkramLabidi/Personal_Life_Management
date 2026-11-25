export default function Splash() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ivory">
      <div className="flex flex-col items-center gap-3 animate-fade-in">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-deep text-white font-display text-2xl">
          L
        </div>
        <p className="text-sm text-charcoal/55">Loading LifeOS…</p>
      </div>
    </div>
  );
}
