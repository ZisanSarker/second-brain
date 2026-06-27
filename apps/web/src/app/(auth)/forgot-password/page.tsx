'use client';

import { useState } from 'react';
import Link from 'next/link';
import { authApi } from '@/lib/api/auth';
import { Brain, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen grid-bg flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center space-y-6 glass-panel rounded-2xl p-8">
          <div className="p-3 rounded-2xl bg-green-500/10 border border-green-500/20 inline-flex">
            <Brain className="w-8 h-8 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Check your email</h1>
          <p className="text-slate-400">
            If an account with {email} exists, we&apos;ve sent password reset instructions.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20">
              <Brain className="w-8 h-8 text-purple-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white">Reset your password</h1>
          <p className="text-slate-400 mt-2">
            Enter your email and we&apos;ll send you reset instructions
          </p>
        </div>

        <form onSubmit={handleSubmit} className="glass-panel rounded-2xl p-8 space-y-6">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
              placeholder="you@example.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          >
            {loading ? 'Sending...' : 'Send reset instructions'}
          </button>

          <p className="text-center text-sm text-slate-400">
            <Link
              href="/login"
              className="text-purple-400 hover:text-purple-300 transition-colors inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3 h-3" />
              Back to login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
