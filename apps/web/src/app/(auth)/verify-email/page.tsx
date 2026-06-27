'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { authApi } from '@/lib/api/auth';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid or missing verification token.');
      return;
    }

    authApi
      .verifyEmail(token)
      .then(() => {
        setStatus('success');
        setMessage('Your email has been verified successfully.');
      })
      .catch((err) => {
        setStatus('error');
        setMessage(
          err.response?.data?.message || 'Failed to verify email. The link may have expired.',
        );
      });
  }, [token]);

  return (
    <div className="min-h-screen grid-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center space-y-6 glass-panel rounded-2xl p-8">
        {status === 'loading' && (
          <>
            <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 inline-flex">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Verifying your email</h1>
            <p className="text-muted-foreground">
              Please wait while we verify your email address...
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="p-3 rounded-2xl bg-success/10 border border-success/20 inline-flex">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Email verified</h1>
            <p className="text-muted-foreground">{message}</p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-foreground font-medium transition-all"
            >
              Sign in
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="p-3 rounded-2xl bg-destructive/10 border border-destructive/20 inline-flex">
              <AlertCircle className="w-8 h-8 text-destructive-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Verification failed</h1>
            <p className="text-muted-foreground">{message}</p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-primary hover:text-primary transition-colors"
            >
              Back to login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailForm />
    </Suspense>
  );
}
