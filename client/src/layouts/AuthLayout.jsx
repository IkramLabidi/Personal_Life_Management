export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md animate-fade-up">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-deep font-display text-xl text-white shadow-soft">
            L
          </span>
          <h1 className="mt-3 font-display text-2xl text-deep">LifeOS</h1>
          <p className="text-sm text-charcoal/55">Your personal life management space</p>
        </div>
        <div className="card p-6 sm:p-7">
          <h2 className="font-display text-xl text-deep">{title}</h2>
          <p className="mt-1 text-sm text-charcoal/55">{subtitle}</p>
          <div className="mt-5">{children}</div>
        </div>
        {footer && <div className="mt-5 text-center text-sm text-charcoal/60">{footer}</div>}
      </div>
    </div>
  );
}
