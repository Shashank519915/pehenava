'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';

function LoginForm() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setErrorMessage(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setErrorMessage('Invalid email or password.');
      } else {
        // Successful login: perform a full window reload to clear client cache 
        // and instantly re-render header/sidebar with correct role-based permissions.
        window.location.href = callbackUrl;
      }
    } catch (err: any) {
      setErrorMessage('Something went wrong. Please try again.');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white border border-border-brand/80 shadow-large rounded-[36px] p-6 sm:p-10 relative z-10">
      <div className="flex flex-col items-center mb-8">
        <svg className="w-12 h-12 text-brand-800 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        <span className="font-serif text-3xl font-bold tracking-tight text-brand-900 mb-1">PEHENAVA</span>
        <span className="text-text-secondary text-[10px] uppercase tracking-widest font-bold">Accounting Workspace</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wider" htmlFor="email">
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="e.g. admin@pehenava.in"
            className="w-full bg-background-app/50 border border-border-brand rounded-xl p-3.5 text-sm font-sans focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/20 transition-all focus-visible:outline-none"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider" htmlFor="password">
              Password
            </label>
            <Link href="/auth/forgot-password" className="text-xs text-accent hover:text-accent-dark transition-colors font-medium">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="••••••••••••"
              className="w-full bg-background-app/50 border border-border-brand rounded-xl p-3.5 pr-12 text-sm font-sans focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/20 transition-all focus-visible:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-text-muted hover:text-accent cursor-pointer select-none"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <div className="flex items-center">
          <input
            id="remember"
            name="remember"
            type="checkbox"
            className="w-4 h-4 text-accent border-border-brand rounded focus:ring-accent/20 accent-brand-800"
          />
          <label htmlFor="remember" className="ml-2 text-xs font-medium text-text-secondary cursor-pointer select-none">
            Remember me on this device
          </label>
        </div>

        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-xs font-medium rounded-xl p-3 flex items-center gap-2">
            <span className="text-sm">⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-brand-800 text-white rounded-full py-4 text-sm font-semibold hover:bg-accent disabled:opacity-50 transition-all active:scale-[0.97] duration-100 shadow-medium hover:-translate-y-0.5 active:translate-y-0 cursor-pointer focus-visible:ring-2 focus-visible:ring-accent/40"
        >
          {isPending ? 'Entering Workspace...' : 'Sign In'}
        </button>
      </form>

      <div className="mt-8 text-center border-t border-border-brand/40 pt-6">
        <Link href="/" className="text-xs text-text-muted hover:text-accent transition-colors font-medium">
          ← Back to marketing site
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background-app text-text-primary flex items-center justify-center px-6 py-12 relative overflow-hidden">
      {/* Decorative floral motif background element - animated */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none flex items-center justify-center">
        <svg className="w-[500px] h-[500px] text-brand-900 animate-[float_8s_ease-in-out_infinite]" fill="currentColor" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" />
          <path d="M50 0 C60 40, 90 50, 50 100 C10 50, 40 40, 50 0 Z" />
          <path d="M0 50 C40 60, 50 90, 100 50 C50 10, 40 40, 0 50 Z" />
        </svg>
      </div>

      <Suspense fallback={
        <div className="w-full max-w-md bg-white border border-border-brand/80 shadow-large rounded-[36px] p-6 sm:p-10 relative z-10 flex flex-col items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-800" />
          <span className="text-xs text-text-secondary mt-4 font-semibold">Loading login form...</span>
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  );
}


