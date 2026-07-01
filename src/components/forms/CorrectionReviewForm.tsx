'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { reviewCorrectionRequest } from '@/server/correctionActions';

interface CorrectionReviewFormProps {
  request: {
    id: string;
    reason: string;
    proposedChanges: any;
    attachmentUrl?: string | null;
    status: string;
    transaction: {
      id: string;
      type: string;
      amount: number;
      paymentMode: string;
      description: string;
      referenceNumber: string | null;
      account: { id: string; name: string };
      party: { id: string; name: string } | null;
    };
    requester: { name: string; role: string };
  };
  accounts: { id: string; name: string }[];
  parties: { id: string; name: string }[];
}

export default function CorrectionReviewForm({ request, accounts, parties }: CorrectionReviewFormProps) {
  const router = useRouter();
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const proposed = request.proposedChanges || {};
  const tx = request.transaction;

  // Build list of differences
  const diffFields = Object.keys(proposed).map(key => {
    let originalVal = (tx as any)[key];
    let proposedVal = proposed[key];

    let name = key.charAt(0).toUpperCase() + key.slice(1);
    if (key === 'accountId') {
      name = 'Ledger Account';
      originalVal = accounts.find(a => a.id === tx.account.id)?.name || tx.account.name;
      proposedVal = accounts.find(a => a.id === proposedVal)?.name || proposedVal;
    }
    else if (key === 'partyId') {
      name = 'Associated Party';
      const partyObj = tx.party;
      originalVal = partyObj ? (parties.find(p => p.id === partyObj.id)?.name || partyObj.name) : '—';
      proposedVal = parties.find(p => p.id === proposedVal)?.name || proposedVal || '—';
    }
    else if (key === 'paymentMode') name = 'Payment Mode';
    else if (key === 'referenceNumber') name = 'Reference Number';

    return {
      field: name,
      original: originalVal?.toString() || '—',
      proposed: proposedVal?.toString() || '—',
    };
  });

  const handleAction = async (action: 'APPROVE' | 'REJECT') => {
    if (action === 'REJECT' && !showRejectForm) {
      setShowRejectForm(true);
      return;
    }

    if (action === 'REJECT' && rejectionReason.length < 5) {
      setError('Please state a rejection reason of at least 5 characters.');
      return;
    }

    setIsPending(true);
    setError(null);
    try {
      await reviewCorrectionRequest({
        requestId: request.id,
        action,
        rejectionReason: action === 'REJECT' ? rejectionReason : undefined,
      });
      router.push('/corrections');
    } catch (err: any) {
      setError(err?.message || 'Failed to review request.');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="bg-brand-50/30 border border-border-brand/80 rounded-2xl p-6 shadow-soft">
        <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Request Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <div className="text-xs text-text-muted">Requested By</div>
            <div className="font-semibold text-brand-900 mt-1">{request.requester.name} ({request.requester.role})</div>
          </div>
          <div>
            <div className="text-xs text-text-muted">Reason Stated</div>
            <div className="font-medium text-text-secondary mt-1 italic">&ldquo;{request.reason}&rdquo;</div>
          </div>
        </div>
      </div>

      {/* Side by side Diff Comparison */}
      <div className="bg-white border border-border-brand/80 rounded-2xl shadow-soft overflow-hidden">
        <div className="px-6 py-4 border-b border-border-brand/60 bg-surface-alt font-serif font-bold text-brand-900 text-base">
          Side-by-Side Modifications Diff
        </div>

        <div className="divide-y divide-border-brand/40">
          {diffFields.map((diff, idx) => (
            <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 items-center">
              <div className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                {diff.field}
              </div>
              <div className="bg-red-50/50 border border-red-100 rounded-xl p-3 text-red-800 text-xs font-mono">
                <span className="text-[10px] uppercase font-bold text-red-500 block mb-1">Original</span>
                {diff.original}
              </div>
              <div className="bg-green-50/50 border border-green-100 rounded-xl p-3 text-green-800 text-xs font-mono">
                <span className="text-[10px] uppercase font-bold text-green-500 block mb-1">Proposed Corrected</span>
                {diff.proposed}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Supporting Attachment Preview */}
      {request.attachmentUrl && (
        <div className="bg-white border border-border-brand/80 rounded-2xl shadow-soft p-6 space-y-4 animate-in fade-in duration-300">
          <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Supporting Document / Voucher</h3>
          <div className="border border-border-brand/40 rounded-xl p-4 bg-brand-50/10 flex flex-col items-center justify-center gap-3">
            {request.attachmentUrl.match(/\.(jpg|jpeg|png|webp|gif)$/i) ? (
              <img
                src={request.attachmentUrl}
                alt="Supporting Voucher"
                className="max-h-[300px] rounded-lg shadow-sm border border-border-brand/60 object-contain"
              />
            ) : (
              <div className="text-center space-y-2">
                <span className="text-2xl">📄</span>
                <p className="text-xs font-medium text-brand-900">Document Attachment</p>
              </div>
            )}
            <a
              href={request.attachmentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-brand-850 hover:text-accent underline"
            >
              Open / Download Attachment Document
            </a>
          </div>
        </div>
      )}

      {showRejectForm && (
        <div className="bg-white border border-border-brand/85 rounded-2xl p-6 space-y-4 animate-in slide-in-from-bottom-5 duration-200">
          <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider">
            Rejection Reason (Required)
          </label>
          <textarea
            rows={3}
            placeholder="Explain why this correction request is being rejected..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            className="w-full bg-background-app/50 border border-border-brand rounded-xl p-3 text-sm focus:outline-none focus:border-accent"
          />
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-xs font-medium rounded-xl p-3 flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Review Actions */}
      <div className="flex gap-4">
        <button
          onClick={() => handleAction('APPROVE')}
          disabled={isPending}
          className="rounded-full bg-emerald-700 text-white px-8 py-3 text-sm font-semibold hover:bg-emerald-800 disabled:opacity-50 transition-colors shadow-soft cursor-pointer"
        >
          Approve Correction
        </button>
        <button
          onClick={() => handleAction('REJECT')}
          disabled={isPending}
          className="rounded-full bg-red-700 text-white px-8 py-3 text-sm font-semibold hover:bg-red-800 disabled:opacity-50 transition-colors shadow-soft cursor-pointer"
        >
          {showRejectForm ? 'Confirm Rejection' : 'Reject Correction'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-full border border-brand-300 text-brand-900 px-8 py-3 text-sm font-semibold hover:bg-brand-50 transition-colors cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
