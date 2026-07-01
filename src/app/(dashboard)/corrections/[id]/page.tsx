import React from 'react';
import prisma from '@/lib/prisma';
import CorrectionReviewForm from '@/components/forms/CorrectionReviewForm';
import { notFound } from 'next/navigation';

interface CorrectionReviewPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CorrectionReviewPage({ params }: CorrectionReviewPageProps) {
  const { id } = await params;

  const [request, accounts, parties] = await Promise.all([
    prisma.correctionRequest.findUnique({
      where: { id },
      include: {
        transaction: {
          include: {
            account: true,
            party: true
          }
        },
        requester: true,
      }
    }),
    prisma.account.findMany({ select: { id: true, name: true } }),
    prisma.party.findMany({ select: { id: true, name: true } })
  ]);

  if (!request) {
    notFound();
  }

  const plainRequest = {
    id: request.id,
    reason: request.reason,
    proposedChanges: request.proposedChanges,
    attachmentUrl: request.attachmentUrl,
    status: request.status,
    transaction: request.transaction ? {
      id: request.transaction.id,
      type: request.transaction.type,
      amount: Number(request.transaction.amount),
      paymentMode: request.transaction.paymentMode,
      description: request.transaction.description,
      referenceNumber: request.transaction.referenceNumber,
      account: { id: request.transaction.accountId, name: request.transaction.account.name },
      party: request.transaction.party ? { id: request.transaction.partyId, name: request.transaction.party.name } : null,
    } : null,
    requester: {
      name: request.requester.name,
      role: request.requester.role,
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold text-brand-900">Review Correction Request</h1>
        <p className="text-sm text-text-secondary mt-1">
          Perform a side-by-side ledger diff verification of the requested modifications.
        </p>
      </div>

      <CorrectionReviewForm 
        request={plainRequest as any} 
        accounts={accounts}
        parties={parties}
      />
    </div>
  );
}
