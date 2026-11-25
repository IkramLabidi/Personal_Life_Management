import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-pale/70 text-deep">
        <Compass size={26} />
      </span>
      <h1 className="font-display text-2xl text-deep">Page not found</h1>
      <p className="max-w-sm text-sm text-charcoal/60">
        The page you were looking for does not exist or has moved.
      </p>
      <Link to="/" className="btn-primary mt-2">
        Back to dashboard
      </Link>
    </div>
  );
}
