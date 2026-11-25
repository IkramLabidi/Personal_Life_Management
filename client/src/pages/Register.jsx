import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import AuthLayout from '../layouts/AuthLayout.jsx';
import { Field, TextInput, ErrorBanner } from '../components/ui/FormControls.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { apiErrorMessage } from '../services/api.js';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.email || !form.password) {
      setError('Please fill in all fields.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      await register(form.name, form.email, form.password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Everything you track is private to you."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-deep hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <ErrorBanner message={error} />
        <Field label="Name">
          <TextInput value={form.name} onChange={set('name')} placeholder="Your name" autoComplete="name" />
        </Field>
        <Field label="Email">
          <TextInput
            type="email"
            value={form.email}
            onChange={set('email')}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Password">
            <TextInput
              type="password"
              value={form.password}
              onChange={set('password')}
              placeholder="At least 6 characters"
              autoComplete="new-password"
            />
          </Field>
          <Field label="Confirm password">
            <TextInput
              type="password"
              value={form.confirm}
              onChange={set('confirm')}
              placeholder="Repeat password"
              autoComplete="new-password"
            />
          </Field>
        </div>
        <button type="submit" className="btn-primary w-full" disabled={busy}>
          <UserPlus size={16} />
          {busy ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthLayout>
  );
}
