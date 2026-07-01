import React from 'react';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Role } from '@prisma/client';
import { ShieldCheck, ChevronRight } from 'lucide-react';

interface CorrectionsQueuePageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
  }>;
}

export default async function CorrectionsQueuePage({ searchParams }: CorrectionsQueuePageProps) {
  const session = await auth();
  if (!session) {
    redirect('/auth/login');
  }

  const params = await searchParams;
  const page = Number(params.page || '1');
  const limit = Number(params.limit || '50');
  const skip = (page - 1) * limit;

  const role = session.user.role as Role;

  // Load all correction requests with target transactions and requesters
  const [requests, totalCount] = await Promise.all([
    prisma.correctionRequest.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        transaction: {
          include: {
            account: true,
            party: true
          }
        },
        requester: true,
        reviewer: true,
      }
    }),
    prisma.correctionRequest.count()
  ]);

  const pendingCount = requests.filter(r => r.status === 'PENDING').length;

  return (
    <div className="space-y-8">
      {/* Header with count banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-brand-900 tracking-tight">Corrections Queue</h1>
          <p className="text-sm text-text-secondary mt-1">
            Review, approve, or reject requested transaction modifications.
          </p>
        </div>
        {pendingCount > 0 && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-full px-4 py-1.5 text-xs font-semibold self-start sm:self-center flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span>{pendingCount} Pending Review</span>
          </div>
        )}
      </div>

      {/* Requests Table */}
      {/* Desktop Requests Table */}
      <div className="hidden md:block bg-white border border-border-brand/80 rounded-[24px] overflow-hidden shadow-soft stagger-item">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-surface-alt border-b border-border-brand/60 text-text-muted uppercase tracking-[0.15em] font-bold text-[9px]">
                <th className="py-4 px-6">Submitted</th>
                <th className="py-4 px-6">Requester</th>
                <th className="py-4 px-6">Original Transaction</th>
                <th className="py-4 px-6">Reason for correction</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-brand/40">
              {requests.length > 0 ? (
                requests.map((req, index) => {
                  return (
                    <tr 
                      key={req.id} 
                      className="hover:bg-brand-50/40 transition-colors duration-150 stagger-item"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <td className="py-4 px-6 text-text-secondary font-medium font-mono">
                        {new Date(req.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="py-4 px-6 font-semibold text-brand-900">
                        {req.requester.name}
                        <span className="text-[9px] text-text-muted font-mono block uppercase mt-0.5">
                          {req.requester.role}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-text-secondary font-medium">
                        <div className="font-semibold text-brand-900">
                          {req.transaction.party?.name || req.transaction.account.name}
                        </div>
                        <div className="text-[9px] text-text-muted font-mono mt-0.5">
                          {req.transaction.type} • ₹{Number(req.transaction.amount).toLocaleString('en-IN')}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-text-secondary max-w-xs truncate" title={req.reason}>
                        {req.reason}
                      </td>
                      <td className="py-4 px-6 font-semibold">
                        <span className={`px-2.5 py-1 rounded text-[9px] font-bold ${
                          req.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse ring-1 ring-amber-300' :
                          req.status === 'APPROVED' ? 'bg-green-50 text-green-700 border border-green-200' :
                          'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right font-bold text-sm">
                        {req.status === 'PENDING' && role === 'ADMIN' ? (
                          <Link
                            href={`/corrections/${req.id}`}
                            className="inline-block bg-brand-800 text-white rounded-full px-5 py-2 text-[10px] font-semibold hover:bg-accent active:scale-[0.96] transition-transform duration-100 cursor-pointer shadow-soft focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none"
                          >
                            Review Diff
                          </Link>
                        ) : (
                          <span className="text-text-muted text-[10px] font-medium">Reviewed by {req.reviewer?.name || 'System'}</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-text-muted">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <div className="text-xs font-semibold text-brand-900">All caught up!</div>
                      <div className="text-[10px] text-text-muted">No correction requests found in the history queue.</div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Timeline List View */}
      <div className="md:hidden divide-y divide-border-brand/40 bg-white border border-border-brand/85 rounded-[24px] overflow-hidden shadow-soft animate-in fade-in duration-300">
        {requests.length > 0 ? (
          requests.map((req, index) => {
            return (
              <div 
                key={req.id} 
                className="px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-brand-50/40 active:bg-brand-50/60 transition-colors"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-brand-900 truncate">
                    {req.transaction.party?.name || req.transaction.account.name}
                  </div>
                  <div className="text-[10px] text-text-secondary mt-1 flex items-center gap-1.5 flex-wrap font-medium">
                    <span className="font-semibold">{req.requester.name}</span>
                    <span className="text-text-muted font-normal">•</span>
                    <span>{req.transaction.type}</span>
                    <span className="text-text-muted font-normal">•</span>
                    <span className="font-mono text-brand-900">₹{Number(req.transaction.amount).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="text-[10px] text-text-muted mt-1 truncate">
                    Reason: {req.reason}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div>
                      <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-bold ${
                        req.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse ring-1 ring-amber-300' :
                        req.status === 'APPROVED' ? 'bg-green-50 text-green-700 border border-green-200' :
                        'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {req.status}
                      </span>
                    </div>
                    {req.status === 'PENDING' && role === 'ADMIN' ? (
                      <div className="mt-1.5">
                        <Link
                          href={`/corrections/${req.id}`}
                          className="inline-block bg-brand-800 text-white rounded-full px-3 py-1 text-[8px] font-semibold hover:bg-accent transition-colors shadow-soft"
                        >
                          Review Diff
                        </Link>
                      </div>
                    ) : (
                      <div className="text-[9px] text-text-muted font-medium mt-1">
                        Reviewed
                      </div>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-text-muted shrink-0" />
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-12 text-center text-text-muted">
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="text-xs font-semibold text-brand-900">All caught up!</div>
            </div>
          </div>
        )}
      </div>

      {/* Pagination controls */}
      {totalCount > limit && (
        <div className="flex justify-center items-center gap-4 mt-6 text-xs">
          <Link
            href={`/corrections?page=${page - 1}`}
            className={`flex items-center gap-1 text-brand-850 font-semibold hover:text-accent transition-colors ${page === 1 ? 'pointer-events-none opacity-40' : ''}`}
          >
            Previous
          </Link>
          <span className="font-mono text-text-secondary">
            Page {page} of {Math.ceil(totalCount / limit)}
          </span>
          <Link
            href={`/corrections?page=${page + 1}`}
            className={`flex items-center gap-1 text-brand-850 font-semibold hover:text-accent transition-colors ${page >= Math.ceil(totalCount / limit) ? 'pointer-events-none opacity-40' : ''}`}
          >
            Next
          </Link>
        </div>
      )}
    </div>
  );
}
