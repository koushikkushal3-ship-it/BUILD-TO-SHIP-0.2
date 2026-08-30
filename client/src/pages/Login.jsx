import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { signInWithPassword, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: signInError } = await signInWithPassword(email, password);
    setLoading(false);
    if (signInError) return setError(signInError.message);
    navigate('/dashboard');
  }

  return (
    <main className="mx-auto flex max-w-md flex-col px-6 py-20">
      <h1 className="font-display text-2xl font-semibold text-slate-100">Log in</h1>

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
          placeholder="Password"
          className="input-field"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="animate-shake text-sm font-medium text-red-600">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Logging in…' : 'Log in'}
        </button>
      </form>

      <p className="mt-6 text-sm text-slate-400">
        No account?{' '}
        <Link to="/register" className="text-amber-400 hover:underline">
          Register
        </Link>
      </p>
    </main>
  );
}
