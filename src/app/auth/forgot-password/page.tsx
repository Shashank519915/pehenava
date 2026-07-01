'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);

    setTimeout(() => {
      setIsPending(false);
      setIsSubmitted(true);
      toast.success('Password reset link has been dispatched to your email.');
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-background-app text-text-primary flex items-center justify-center px-6 py-12 relative overflow-hidden">
      {/* Decorative floral motif background element */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none flex items-center justify-center">
        <svg className="w-[500px] h-[500px] text-brand-900 animate-[float_8s_ease-in-out_infinite]" fill="currentColor" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" />
          <path d="M50 0 C60 40, 90 50, 50 100 C10 50, 40 40, 50 0 Z" />
          <path d="M0 50 C40 60, 50 90, 100 50 C50 10, 40 40, 0 50 Z" />
        </svg>
      </div>

      <div className="w-full max-w-md bg-white border border-border-brand/80 shadow-large rounded-[36px] p-6 sm:p-10 relative z-10">
        <div className="flex flex-col items-center mb-8">
          <span className="font-serif text-3xl font-bold tracking-tight text-brand-900 mb-1">PEHENAVA</span>
          <span className="text-text-secondary text-[10px] uppercase tracking-widest font-bold">Reset Password Request</span>
        </div>

        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <p className="text-xs text-text-secondary text-center leading-relaxed">
              Provide your registered workspace email. If an account matches, a recovery link will be sent.
            </p>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wider" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. employee@pehenava.in"
                className="w-full bg-background-app/50 border border-border-brand rounded-xl p-3.5 text-sm font-sans focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/20 transition-all focus-visible:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-brand-800 text-white rounded-full py-4 text-sm font-semibold hover:bg-accent disabled:opacity-50 transition-all active:scale-[0.97] duration-100 shadow-medium hover:-translate-y-0.5 active:translate-y-0 cursor-pointer focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              {isPending ? 'Processing Request...' : 'Send Recovery Link'}
            </button>
          </form>
        ) : (
          <div className="space-y-6 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-xl font-bold">
              ✓
            </div>
            <h2 className="font-serif text-lg font-bold text-brand-900">Email Dispatched Successfully</h2>
            <p className="text-xs text-text-secondary leading-relaxed">
              We have dispatched instructions to <span className="font-semibold text-brand-900">{email}</span>. Please check your inbox and spam folder.
            </p>
          </div>
        )}

        <div className="mt-8 text-center border-t border-border-brand/40 pt-6">
          <Link href="/auth/login" className="text-xs text-text-muted hover:text-accent transition-colors font-medium">
            ← Return to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
