'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Mail, ArrowRight, ShieldCheck, Car, AlertCircle, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const qEmail = searchParams.get('email');
    const qPass = searchParams.get('password');
    if (qEmail) setEmail(qEmail);
    if (qPass) setPassword(qPass);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Authentication failed');
      } else {
        router.push(data.user?.role === 'ADMIN' ? '/admin' : '/map');
        router.refresh();
      }
    } catch {
      setError('Unable to connect to authentication server');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="max-w-md mx-auto my-8 p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
      <div className="text-center mb-6">
        <div className="inline-flex p-2.5 bg-indigo-600 text-white rounded-xl mb-3 shadow-md">
          <Car className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-white">Sign In to ParkWise</h1>
        <p className="text-xs text-slate-400 mt-1">Smart parking reservation & decision platform</p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
          <div className="relative">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full bg-slate-800 text-slate-100 text-xs px-3 py-2.5 pl-9 rounded-lg border border-slate-700 focus:outline-none focus:border-indigo-500"
            />
            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
          <div className="relative">
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-800 text-slate-100 text-xs px-3 py-2.5 pl-9 rounded-lg border border-slate-700 focus:outline-none focus:border-indigo-500"
            />
            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow transition flex items-center justify-center space-x-1.5"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Signing In...</span>
            </>
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Quick Demo Logins Section */}
      <div className="mt-6 pt-5 border-t border-slate-800">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5 text-center">
          One-Click Demo Accounts
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => handleQuickFill('admin@parkwise.com', 'Admin@123')}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-left"
          >
            <div className="font-semibold text-rose-400 text-[11px]">System Admin</div>
            <div className="text-[10px] text-slate-400 truncate">admin@parkwise.com</div>
          </button>

          <button
            type="button"
            onClick={() => handleQuickFill('john.doe@example.com', 'Password@123')}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-left"
          >
            <div className="font-semibold text-indigo-400 text-[11px]">Customer (John)</div>
            <div className="text-[10px] text-slate-400 truncate">john.doe@example.com</div>
          </button>

          <button
            type="button"
            onClick={() => handleQuickFill('sarah.connor@example.com', 'Password@123')}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-left"
          >
            <div className="font-semibold text-emerald-400 text-[11px]">Priority 1 (Sarah)</div>
            <div className="text-[10px] text-slate-400 truncate">Accessibility Bay</div>
          </button>

          <button
            type="button"
            onClick={() => handleQuickFill('david.miller@example.com', 'Password@123')}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-left"
          >
            <div className="font-semibold text-amber-400 text-[11px]">Faculty (David)</div>
            <div className="text-[10px] text-slate-400 truncate">Priority Member</div>
          </button>
        </div>
      </div>

      <div className="mt-5 text-center text-xs text-slate-400">
        Don't have an account yet?{' '}
        <a href="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold">
          Register now (+100 Bonus Pts)
        </a>
      </div>
    </div>
  );
}
