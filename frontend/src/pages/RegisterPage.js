import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await register(name, email, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const msg =
        err.response?.status === 409
          ? 'That email is already registered.'
          : 'Could not register. Check inputs (password min 6 chars).';
      setError(msg);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-white mb-2">Create account</h1>
      <p className="text-slate-400 mb-2">Sign up to save your profile, upload your resume, and get personalized mock interview questions.</p>
      <p className="text-slate-500 mb-8 text-sm">
        Use a valid email and a secure password. After registering, you’ll be taken to your dashboard where you can upload a PDF resume and begin practicing.
      </p>
      <form onSubmit={submit} className="space-y-4 bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <div>
          <label className="block text-sm text-slate-400 mb-1">Name</label>
          <input
            className="w-full rounded-lg bg-ink-950 border border-slate-700 px-3 py-2 focus:ring-2 focus:ring-accent outline-none"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={120}
          />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Email</label>
          <input
            className="w-full rounded-lg bg-ink-950 border border-slate-700 px-3 py-2 focus:ring-2 focus:ring-accent outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
          />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Password (min 6)</label>
          <input
            className="w-full rounded-lg bg-ink-950 border border-slate-700 px-3 py-2 focus:ring-2 focus:ring-accent outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
            minLength={6}
          />
        </div>
        <button
          type="submit"
          className="w-full py-2.5 rounded-lg bg-accent text-ink-950 font-semibold hover:bg-sky-300 transition"
        >
          Register
        </button>
      </form>
      <p className="mt-6 text-center text-slate-400 text-sm">
        Already have an account?{' '}
        <Link to="/login" className="text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
