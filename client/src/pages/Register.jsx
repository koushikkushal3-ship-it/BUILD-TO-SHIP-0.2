import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register() {
  const { signUpWithPassword, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { data, error: signUpError } = await signUpWithPassword(email, password);
    setLoading(false);
    if (signUpError) return setError(signUpError.message);

    // Supabase returns a session immediately when email confirmation is disabled;
    // otherwise the user needs to confirm via email first.
    if (data.session) navigate('/profile-setup');
    else setSent(true);
  }

  if (sent) {
    return (
      <main className="mx-auto max-w-md px-6 py-20 text-center">
        <h1 className="font-display text-2xl font-semibold text-slate-100">Check your email</h1>
        <p className="mt-3 text-slate-400">We sent a confirmation link to {email}.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-md flex-col px-6 py-20">
      <h1 className="font-display text-2xl font-semibold text-slate-100">Create your account</h1>

      <button onClick={signInWithGoogle} className="btn-secondary mt-6 w-full">
        Continue with Google
      </button>

      <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wide text-slate-500">
        <div className="h-px flex-1 bg-charcoal-700" /> or <div className="h-px flex-1 bg-charcoal-700" />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="email"
          required
          placeholder="Email"
          className="input-field"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          required
          minLength={6}
          placeholder="Password (min 6 characters)"
          className="input-field"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="animate-shake text-sm font-medium text-red-600">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-sm text-slate-400">
        Already have an account?{' '}
        <Link to="/login" className="text-amber-400 hover:underline">
          Log in
        </Link>
      </p>
    </main>
  );
}
