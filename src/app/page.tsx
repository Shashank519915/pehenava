"use client";

import Link from "next/link";

import React, { useState } from "react";

export default function Home() {
  const [contactSubmitted, setContactSubmitted] = useState(false);
  return (
    <div className="min-h-screen bg-background-app text-text-primary flex flex-col selection:bg-accent/20 selection:text-accent-dark">
      {/* Navigation Header */}
      <header className="border-b border-border-brand/60 px-6 py-4 sm:px-12 backdrop-blur-md sticky top-0 bg-background-app/80 z-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Floral Circular Emblem (SVG) */}
          <svg className="w-9 h-9 text-brand-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            <path d="M2 12h20" />
          </svg>
          <span className="font-serif text-2xl font-bold tracking-wide text-brand-900">PEHENAVA</span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-text-secondary">
          <a href="#story" className="hover:text-accent transition-colors">Our Story</a>
          <a href="#features" className="hover:text-accent transition-colors">Features</a>
          <a href="#workflow" className="hover:text-accent transition-colors">Workflow</a>
          <a href="#faq" className="hover:text-accent transition-colors">FAQ</a>
        </nav>
        <div>
          <Link
            href="/auth/login"
            className="rounded-full border border-brand-800 text-brand-800 px-6 py-2 text-sm font-medium hover:bg-brand-800 hover:text-white transition-all duration-200"
          >
            Sign In
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* 1. HERO SECTION */}
        <section className="relative px-6 py-20 sm:px-12 md:py-32 flex flex-col items-center text-center overflow-hidden border-b border-border-brand/40 bg-gradient-to-b from-brand-50/50 to-transparent">
          {/* Subtle Decorative Floral Background element */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center">
            <svg className="w-[600px] h-[600px] text-brand-900" fill="currentColor" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" />
              <path d="M50 0 C60 40, 90 50, 50 100 C10 50, 40 40, 50 0 Z" />
              <path d="M0 50 C40 60, 50 90, 100 50 C50 10, 40 40, 0 50 Z" />
            </svg>
          </div>

          <div className="max-w-4xl relative z-10">
            <span className="text-accent font-medium tracking-widest text-xs uppercase block mb-4">
              Bespoke Financial Craftsmanship
            </span>
            <h1 className="font-display text-5xl sm:text-7xl font-bold tracking-tight text-brand-900 leading-[1.1] mb-6">
              Where Couture Meets <br />
              <span className="font-serif italic text-accent font-medium">Balanced Ledgers</span>
            </h1>
            <p className="font-sans text-text-secondary text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-8">
              A luxury accounting workspace tailored exclusively for premium Indian ethnic wear showrooms. Built to manage Cash, Bank, and UPI books with double-entry integrity.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/auth/login"
                className="w-full sm:w-auto rounded-full bg-brand-800 text-white px-8 py-4 text-base font-medium shadow-medium hover:bg-accent transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0"
              >
                Enter Workspace
              </Link>
              <a
                href="#features"
                className="w-full sm:w-auto rounded-full border border-brand-300 text-brand-900 px-8 py-4 text-base font-medium hover:bg-brand-100/50 transition-colors"
              >
                Explore Features
              </a>
            </div>
          </div>

          {/* Premium UI Mockup (CSS Crafted) */}
          <div className="mt-16 w-full max-w-5xl rounded-2xl bg-white border border-border-brand shadow-large p-4 sm:p-6 text-left relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-border-brand/60 pb-4 mb-6">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-400"></span>
                <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
                <span className="w-3 h-3 rounded-full bg-green-400"></span>
                <span className="ml-4 text-xs text-text-muted font-mono select-none">pehenava.app/dashboard</span>
              </div>
              <div className="text-xs font-serif bg-brand-100/60 px-3 py-1 rounded-full text-brand-800">
                FY 2025-26 (Active)
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border border-border-brand/60 bg-brand-50/20 rounded-xl p-6 shadow-soft">
                <div className="text-xs text-text-secondary uppercase tracking-wider mb-2">Today&apos;s Sales</div>
                <div className="font-serif text-3xl font-bold text-brand-900">₹2,85,400.00</div>
                <div className="text-xs text-green-600 mt-2">↑ 14% vs yesterday</div>
              </div>
              <div className="border border-border-brand/60 bg-brand-50/20 rounded-xl p-6 shadow-soft">
                <div className="text-xs text-text-secondary uppercase tracking-wider mb-2">Bank Balance</div>
                <div className="font-serif text-3xl font-bold text-brand-900">₹24,50,000.00</div>
                <div className="text-xs text-text-muted mt-2">Reconciled 1 hr ago</div>
              </div>
              <div className="border border-border-brand/60 bg-brand-50/20 rounded-xl p-6 shadow-soft">
                <div className="text-xs text-text-secondary uppercase tracking-wider mb-2">UPI Books</div>
                <div className="font-serif text-3xl font-bold text-brand-900">₹7,40,000.00</div>
                <div className="text-xs text-accent mt-2">3 pending settlements</div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. BRAND STORY */}
        <section id="story" className="px-6 py-20 sm:px-12 bg-white border-b border-border-brand/40">
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-accent font-semibold tracking-wider text-xs uppercase block mb-3">Our Heritage</span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-brand-900 leading-snug mb-6">
                Designed for the Showrooms of Jaipur, Banaras, &amp; Beyond
              </h2>
              <p className="text-text-secondary text-base leading-relaxed mb-4">
                Generic accounting software is cold, clinical, and built for manufacturing plants. It fails to capture the warmth, high-ticket transactions, and payment realities of a luxury ethnic wear showroom.
              </p>
              <p className="text-text-secondary text-base leading-relaxed">
                Pehenava Accounting was born out of a desire to create a system that mirrors the beauty of your fabrics. Every invoice, balance ledger, and payment flow is designed with the same care and precision as a hand-woven Banarasi silk saree.
              </p>
            </div>
            <div className="bg-brand-50/40 border border-border-brand rounded-2xl p-8 relative">
              <div className="absolute top-4 right-4 text-brand-200">
                <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.748-9.762 9-10.361l.427.82c-4.007.82-6.182 3.633-6.182 7.429h5.738v9.503h-9v-.001zm-14 0v-7.391c0-5.704 3.748-9.762 9-10.361l.427.82c-4.007.82-6.182 3.633-6.182 7.429h5.738v9.503h-9z" />
                </svg>
              </div>
              <p className="font-serif italic text-lg text-brand-900 mb-6 relative z-10 leading-relaxed">
                &ldquo;Before Pehenava, year-end audits were a nightmare of paper slips and matching Cash/UPI books. Now, our CA logs in directly, prints print-optimized Day Books, and files in minutes.&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-200 flex items-center justify-center font-bold text-brand-800">
                  KS
                </div>
                <div>
                  <div className="text-sm font-semibold text-brand-900">Karan Singhania</div>
                  <div className="text-xs text-text-muted">Owner, Pehenava Heritage</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. WHY PEHENAVA ACCOUNTING */}
        <section className="px-6 py-20 sm:px-12 border-b border-border-brand/40 bg-gradient-to-b from-transparent to-brand-50/20">
          <div className="max-w-6xl mx-auto text-center mb-16">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-brand-900">
              Why Showrooms Choose Pehenava
            </h2>
            <p className="text-text-secondary text-base mt-4 max-w-xl mx-auto">
              A system engineered for high-value sales, cash registries, and real-time reconciliation.
            </p>
          </div>

          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="border border-border-brand/60 bg-white rounded-2xl p-8 hover:shadow-medium transition-all duration-300">
              <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center text-accent mb-6">
                <span className="font-bold">₹</span>
              </div>
              <h3 className="font-serif text-xl font-bold text-brand-900 mb-3">Indian Number System</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Ledgers are formatted in Lakhs and Crores (e.g. ₹10,25,000) by default. Zero cognitive load translating values to local banking reports.
              </p>
            </div>

            <div className="border border-border-brand/60 bg-white rounded-2xl p-8 hover:shadow-medium transition-all duration-300">
              <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center text-accent mb-6">
                <span className="font-bold">🔒</span>
              </div>
              <h3 className="font-serif text-xl font-bold text-brand-900 mb-3">Locked Financial Years</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Prevents accidental back-dated transaction modifications once a year is closed by your CA. Strict separation of year books.
              </p>
            </div>

            <div className="border border-border-brand/60 bg-white rounded-2xl p-8 hover:shadow-medium transition-all duration-300">
              <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center text-accent mb-6">
                <span className="font-bold">📜</span>
              </div>
              <h3 className="font-serif text-xl font-bold text-brand-900 mb-3">Correction Request Workflows</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Employees cannot edit posted entries. Erroneous transactions require a formal correction request with reasons, subject to Admin approval.
              </p>
            </div>
          </div>
        </section>

        {/* 4. FEATURES OVERVIEW */}
        <section id="features" className="px-6 py-20 sm:px-12 bg-white border-b border-border-brand/40">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <span className="text-accent font-semibold tracking-wider text-xs uppercase block mb-3">Capabilities</span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-brand-900">Tailored Showroom Ledger Management</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="flex gap-6">
                <div className="text-accent font-serif text-2xl font-bold">01</div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-brand-900 mb-2">Cash, Bank, and UPI Book Isolation</h3>
                  <p className="text-text-secondary text-sm leading-relaxed">
                    Filter transaction entries by mode instantly. Run dedicated books for Cash desk logs, Bank transfers, and UPI merchant settlements without manual tallying.
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="text-accent font-serif text-2xl font-bold">02</div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-brand-900 mb-2">Double-Entry Journal Balancing</h3>
                  <p className="text-text-secondary text-sm leading-relaxed">
                    Every Sale, Purchase, Payment, or Expense auto-generates balanced debits and credits. The ledger refuses to save unbalanced inputs, maintaining accounting integrity.
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="text-accent font-serif text-2xl font-bold">03</div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-brand-900 mb-2">CA-Ready Reports Export</h3>
                  <p className="text-text-secondary text-sm leading-relaxed">
                    Download Day Books, Trial Balance sheets, Ledgers, and Customer Outstanding reports directly into Excel, CSV, or print-optimized PDF documents.
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="text-accent font-serif text-2xl font-bold">04</div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-brand-900 mb-2">Append-Only Cryptographic Audit Log</h3>
                  <p className="text-text-secondary text-sm leading-relaxed">
                    Every state-mutating action is signed, timestamped, and stored with an immutable hash. Full traceability of user login activities and transaction history.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. ACCOUNTING WORKFLOW */}
        <section id="workflow" className="px-6 py-20 sm:px-12 border-b border-border-brand/40 bg-brand-50/10">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <span className="text-accent font-semibold tracking-wider text-xs uppercase block mb-3">The Ledger Journey</span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-brand-900">How Transactions Flow</h2>
            </div>

            <div className="relative grid grid-cols-1 md:grid-cols-4 gap-8">
              {/* Connecting line */}
              <div className="hidden md:block absolute top-12 left-10 right-10 h-0.5 bg-border-brand/60 z-0"></div>

              <div className="relative z-10 text-center flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-white border-2 border-accent flex items-center justify-center font-serif font-bold text-brand-900 text-lg shadow-soft">
                  1
                </div>
                <h4 className="font-serif font-bold text-brand-900 text-base mt-4 mb-2">Record entry</h4>
                <p className="text-text-secondary text-xs leading-relaxed max-w-[200px]">
                  Employee logs sale/receipt and selects payment mode.
                </p>
              </div>

              <div className="relative z-10 text-center flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-white border-2 border-accent flex items-center justify-center font-serif font-bold text-brand-900 text-lg shadow-soft">
                  2
                </div>
                <h4 className="font-serif font-bold text-brand-900 text-base mt-4 mb-2">Auto Post</h4>
                <p className="text-text-secondary text-xs leading-relaxed max-w-[200px]">
                  System performs double-entry validation and updates ledger.
                </p>
              </div>

              <div className="relative z-10 text-center flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-white border-2 border-accent flex items-center justify-center font-serif font-bold text-brand-900 text-lg shadow-soft">
                  3
                </div>
                <h4 className="font-serif font-bold text-brand-900 text-base mt-4 mb-2">Audit Lock</h4>
                <p className="text-text-secondary text-xs leading-relaxed max-w-[200px]">
                  Cryptographic hash is computed and stored in the append-only logs.
                </p>
              </div>

              <div className="relative z-10 text-center flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-white border-2 border-accent flex items-center justify-center font-serif font-bold text-brand-900 text-lg shadow-soft">
                  4
                </div>
                <h4 className="font-serif font-bold text-brand-900 text-base mt-4 mb-2">CA Export</h4>
                <p className="text-text-secondary text-xs leading-relaxed max-w-[200px]">
                  CA pulls reports, outstanding balances, and verifies closing sums.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 6. FAQ */}
        <section id="faq" className="px-6 py-20 sm:px-12 bg-white border-b border-border-brand/40">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-brand-900">Frequently Asked Questions</h2>
              <p className="text-text-secondary text-sm mt-3">Answers to common operational and technical questions.</p>
            </div>

            <div className="space-y-6">
              <div className="border-b border-border-brand/60 pb-6">
                <h3 className="font-serif font-bold text-brand-900 text-lg mb-2">Can we change transaction values after saving?</h3>
                <p className="text-text-secondary text-sm leading-relaxed">
                  Only if the transaction belongs to an open Financial Year. Once saved, it cannot be silently edited. Users must submit a correction request detailing reasons, which goes through Admin approval.
                </p>
              </div>

              <div className="border-b border-border-brand/60 pb-6">
                <h3 className="font-serif font-bold text-brand-900 text-lg mb-2">How does financial year isolation work?</h3>
                <p className="text-text-secondary text-sm leading-relaxed">
                  Transactions are bound strictly to specific Financial Years. Switching the active year on the dashboard filters out all other data, preventing ledger leaks.
                </p>
              </div>

              <div className="border-b border-border-brand/60 pb-6">
                <h3 className="font-serif font-bold text-brand-900 text-lg mb-2">Where are our attachments stored?</h3>
                <p className="text-text-secondary text-sm leading-relaxed">
                  All transaction attachments are stored securely in Cloudflare R2 using fully encrypted, private S3 buckets.
                </p>
              </div>

              <div className="border-b border-border-brand/60 pb-6">
                <h3 className="font-serif font-bold text-brand-900 text-lg mb-2">What happens when we close a Financial Year?</h3>
                <p className="text-text-secondary text-sm leading-relaxed">
                  The closing balances of all ledger accounts are calculated and locked. No new entries, edits, or deletions are permitted on that year&apos;s data without administrator overrides.
                </p>
              </div>

              <div className="border-b border-border-brand/60 pb-6">
                <h3 className="font-serif font-bold text-brand-900 text-lg mb-2">Is the ledger double-entry compliant?</h3>
                <p className="text-text-secondary text-sm leading-relaxed">
                  Yes, every transaction logs balanced debit/credit records into the system journal automatically.
                </p>
              </div>

              <div className="border-b border-border-brand/60 pb-6">
                <h3 className="font-serif font-bold text-brand-900 text-lg mb-2">Can we restrict access to sensitive reports?</h3>
                <p className="text-text-secondary text-sm leading-relaxed">
                  Yes. Employee and Maintainer roles are restricted from viewing Profit &amp; Loss statements, Trial Balances, or Audit Logs.
                </p>
              </div>

              <div className="border-b border-border-brand/60 pb-6">
                <h3 className="font-serif font-bold text-brand-900 text-lg mb-2">How can our CA review the transactions?</h3>
                <p className="text-text-secondary text-sm leading-relaxed">
                  CAs are assigned the Read-Only role, allowing them to view and export reports, outstanding lists, and day books without modifying any historical data.
                </p>
              </div>

              <div className="border-b border-border-brand/60 pb-6">
                <h3 className="font-serif font-bold text-brand-900 text-lg mb-2">Can we run this offline or locally?</h3>
                <p className="text-text-secondary text-sm leading-relaxed">
                  Yes, Docker Compose configuration is fully packaged to spin up local instances with a containerized PostgreSQL database.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 7. CONTACT & SIMPLE FORM */}
        <section className="px-6 py-20 sm:px-12 bg-gradient-to-b from-white to-brand-50/30">
          <div className="max-w-md mx-auto border border-border-brand/60 bg-white shadow-soft rounded-2xl p-8">
            <h3 className="font-serif font-bold text-brand-900 text-2xl text-center mb-2">Request Consultation</h3>
            <p className="text-text-secondary text-xs text-center mb-6">
              Tailoring custom deployments for premium showroom networks.
            </p>
            {!contactSubmitted ? (
              <form 
                className="space-y-4" 
                onSubmit={(e) => {
                  e.preventDefault();
                  setContactSubmitted(true);
                }}
              >
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Showroom Name</label>
                  <input type="text" placeholder="e.g. Pehenava Heritage" className="w-full bg-background-app/50 border border-border-brand rounded-lg p-3 text-sm focus:outline-none focus:border-accent" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Contact Email</label>
                  <input type="email" placeholder="e.g. owner@pehenava.in" className="w-full bg-background-app/50 border border-border-brand rounded-lg p-3 text-sm focus:outline-none focus:border-accent" required />
                </div>
                <button type="submit" className="w-full bg-brand-800 text-white rounded-full py-3 text-sm font-semibold hover:bg-accent transition-colors shadow-soft cursor-pointer">
                  Submit Request
                </button>
              </form>
            ) : (
              <div className="text-center space-y-4 py-4">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-lg font-bold">
                  ✓
                </div>
                <h4 className="font-serif font-bold text-brand-900 text-lg">Consultation Requested</h4>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Thank you! We will get in touch with you at the email address provided.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* 8. FOOTER */}
      <footer className="border-t border-border-brand/60 bg-white px-6 py-12 sm:px-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-brand-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <span className="font-serif text-lg font-bold tracking-wider text-brand-900">PEHENAVA</span>
          </div>
          <div className="flex gap-8 text-xs text-text-secondary">
            <a href="#story" className="hover:text-accent">Story</a>
            <a href="#features" className="hover:text-accent">Features</a>
            <a href="#workflow" className="hover:text-accent">Workflow</a>
            <a href="#faq" className="hover:text-accent">FAQ</a>
          </div>
          <div className="text-xs text-text-muted">
            &copy; {new Date().getFullYear()} Pehenava Accounting. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
