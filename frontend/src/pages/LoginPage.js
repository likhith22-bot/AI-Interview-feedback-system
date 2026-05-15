import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard', { replace: true });
    } catch {
      setError('Invalid email or password.');
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-white mb-2">Welcome back</h1>
      <p className="text-slate-400 mb-8">Sign in to continue your interview practice.</p>
      <form onSubmit={submit} className="space-y-4 bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <div>
          <label className="block text-sm text-slate-400 mb-1">Email</label>
          <input
            className="w-full rounded-lg bg-ink-950 border border-slate-700 px-3 py-2 focus:ring-2 focus:ring-accent focus:border-transparent outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
            autoComplete="email"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Password</label>
          <input
            className="w-full rounded-lg bg-ink-950 border border-slate-700 px-3 py-2 focus:ring-2 focus:ring-accent focus:border-transparent outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
            autoComplete="current-password"
          />
        </div>
        <button
          type="submit"
          className="w-full py-2.5 rounded-lg bg-accent text-ink-950 font-semibold hover:bg-sky-300 transition"
        >
          Sign in
        </button>
      </form>
      <p className="mt-6 text-center text-slate-400 text-sm">
        No account?{' '}
        <Link to="/register" className="text-accent hover:underline">
          Register
        </Link>
      </p>
    </div>
  );
}
