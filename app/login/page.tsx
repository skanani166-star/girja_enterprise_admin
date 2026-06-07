'use client';

import { FormEvent, Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Zap, Loader2 } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Login failed');
        return;
      }

      const from = searchParams.get('from') || '/';
      router.push(from);
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-500 rounded-xl mb-4">
            <Zap size={22} className="text-white" fill="white" />
          </div>
          <h1 className="font-display text-2xl text-white tracking-wider">GIRJA ENTERPRISE</h1>
          <p className="text-gray-600 text-xs uppercase tracking-widest mt-1">Admin Panel</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-[#111] border border-white/5 rounded-2xl p-6 space-y-4"
        >
          <div>
            <label htmlFor="username" className="block text-gray-400 text-xs uppercase tracking-wide mb-1.5">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
              className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-orange-500/50 transition-colors"
              placeholder="Enter username"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-gray-400 text-xs uppercase tracking-wide mb-1.5">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-orange-500/50 transition-colors"
              placeholder="Enter password"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-lg transition-all uppercase tracking-wide"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <Loader2 size={24} className="text-orange-500 animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
