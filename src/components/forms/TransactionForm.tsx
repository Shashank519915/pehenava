'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TransactionType, PaymentMode } from '@prisma/client';
import { createTransactionAction } from '@/server/transactionActions';

const transactionSchema = z.object({
  type: z.nativeEnum(TransactionType),
  date: z.string().min(1, 'Date is required'),
  amount: z.number().positive('Amount must be positive'),
  paymentMode: z.nativeEnum(PaymentMode),
  accountId: z.string().min(1, 'Target account ledger is required'),
  partyId: z.string().optional().nullable(),
  description: z.string().min(3, 'Description must be at least 3 characters').max(500),
  referenceNumber: z.string().optional().nullable(),
  isCreditTransaction: z.boolean(),
  newPartyName: z.string().optional(),
  newPartyPhone: z.string().optional(),
  newPartyEmail: z.string().optional(),
  newPartyAddress: z.string().optional(),
  newPartyGstin: z.string().optional(),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

interface TransactionFormProps {
  accounts: { id: string; name: string; type: string; code?: string | null }[];
  parties: { id: string; name: string; type: string; phone?: string | null; email?: string | null; address?: string | null; gstin?: string | null }[];
}

export default function TransactionForm({ accounts, parties }: TransactionFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      isCreditTransaction: false,
    }
  });

  const selectedType = watch('type');
  const showPartySelector = ['SALE', 'PURCHASE', 'RECEIPT', 'PAYMENT'].includes(selectedType);

  // Filter accounts by transaction type to make the selection intuitive
  const filteredAccounts = accounts.filter(acc => {
    if (selectedType === 'SALE') return acc.name === 'Sales A/c';
    if (selectedType === 'PURCHASE') return acc.name === 'Purchases A/c';
    if (selectedType === 'EXPENSE') return acc.type === 'EXPENSE';
    if (selectedType === 'INCOME') return acc.type === 'REVENUE';
    return true; // Allow all for Receipts/Payments
  });

  // Filter parties by type
  const filteredParties = parties.filter(p => {
    if (selectedType === 'SALE' || selectedType === 'RECEIPT') return p.type === 'CUSTOMER';
    if (selectedType === 'PURCHASE' || selectedType === 'PAYMENT') return p.type === 'SUPPLIER';
    return false;
  });

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [uploadedAttachment, setUploadedAttachment] = useState<{ url: string; fileName: string; fileSize: number; mimeType: string } | null>(null);

  const watchedType = watch('type');
  const watchedAmount = watch('amount') || 0;
  const watchedPaymentMode = watch('paymentMode') || 'CASH';
  const watchedAccountId = watch('accountId');
  const watchedPartyId = watch('partyId');
  const watchedIsCredit = watch('isCreditTransaction') || false;
  const watchedNewPartyName = watch('newPartyName') || '';

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        handleSubmit(onSubmit)();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        router.push('/transactions');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [watchedType, watchedAmount, watchedAccountId, watchedPartyId, watchedIsCredit, watchedNewPartyName, watchedPaymentMode, uploadedAttachment]);

  /**
   * Uploads a file via the configured storage provider.
   *
   * When STORAGE_PROVIDER=TRANSLOADIT (on the server), the form:
   *   1. Fetches signed params from /api/upload/transloadit-params
   *   2. POSTs the file as FormData directly to Transloadit
   *   3. Polls the returned assembly_ssl_url until the Assembly completes
   *   4. Extracts the permanent B2 CDN URL from the assembly results
   *
   * Otherwise falls back to the local /api/upload/local endpoint.
   *
   * The runtime value of NEXT_PUBLIC_STORAGE_PROVIDER is read from the env.
   * We expose it as a public env var so the client can branch without an
   * extra round-trip.
   */
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(null);
    setError(null);

    try {
      const isTransloadit = process.env.NEXT_PUBLIC_STORAGE_PROVIDER === 'TRANSLOADIT';

      if (isTransloadit) {
        // ── Transloadit path ──────────────────────────────────────────────
        setUploadProgress('Preparing upload...');

        // 1. Fetch signed params from our secure server endpoint
        const sigRes = await fetch('/api/upload/transloadit-params', { method: 'POST' });
        if (!sigRes.ok) {
          const body = await sigRes.json().catch(() => ({}));
          throw new Error(body.error || 'Failed to get upload credentials.');
        }
        const { params, signature, assembly_url } = await sigRes.json() as {
          params: string;
          signature: string;
          assembly_url: string;
        };

        // 2. POST file directly to Transloadit from the browser
        setUploadProgress('Uploading to Transloadit...');
        const formData = new FormData();
        formData.append('params', params);
        formData.append('signature', signature);
        formData.append('file', file, file.name);

        const uploadRes = await fetch(assembly_url, {
          method: 'POST',
          body: formData,
          // Do NOT set Content-Type – browser must set multipart/form-data with boundary
        });
        if (!uploadRes.ok) {
          const text = await uploadRes.text();
          throw new Error(`Transloadit upload failed (${uploadRes.status}): ${text}`);
        }

        const initial = await uploadRes.json() as Record<string, unknown>;
        const assemblySslUrl = initial.assembly_ssl_url as string | undefined;
        if (!assemblySslUrl) {
          throw new Error('Transloadit did not return an assembly_ssl_url.');
        }

        // 3. Poll until Assembly completes (typically 2–5 s for pass-through)
        setUploadProgress('Processing...');
        const deadline = Date.now() + 120_000;
        let completed: Record<string, unknown> | null = null;

        while (Date.now() < deadline) {
          await new Promise((r) => setTimeout(r, 1500));
          const pollRes = await fetch(assemblySslUrl);
          if (!pollRes.ok) throw new Error(`Assembly poll error: HTTP ${pollRes.status}`);

          const data = await pollRes.json() as Record<string, unknown>;
          const ok = data.ok as string | undefined;

          if (ok === 'ASSEMBLY_COMPLETED') { completed = data; break; }
          if (ok === 'ASSEMBLY_ERRORED' || ok === 'REQUEST_ABORTED') {
            throw new Error(`Transloadit processing failed: ${data.error ?? ok}`);
          }
        }

        if (!completed) throw new Error('Transloadit assembly timed out.');

        // 4. Extract permanent B2 URL from results
        const results = completed.results as Record<string, Array<Record<string, unknown>>> | undefined;
        if (!results) throw new Error('Transloadit assembly has no results.');

        const exportStep =
          results['export_to_b2'] ??
          results['exported'] ??
          Object.values(results)[0];

        if (!exportStep?.length) throw new Error('Transloadit export produced no results.');
        const fileUrl = exportStep[0].url as string | undefined;
        if (!fileUrl) throw new Error('Transloadit result is missing a url field.');

        setUploadedAttachment({
          url: fileUrl,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
        });
      } else {
        // ── Local fallback path ───────────────────────────────────────────
        setUploadProgress('Uploading...');
        const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const res = await fetch(`/api/upload/local?key=${encodeURIComponent(fileName)}`, {
          method: 'PUT',
          body: file,
        });

        if (!res.ok) throw new Error('Upload failed.');

        setUploadedAttachment({
          url: `/uploads/${fileName}`,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to upload attachment.';
      setError(message);
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

  const getJournalPreview = () => {
    if (!watchedType || watchedAmount <= 0) return [];

    const cashAcc = accounts.find(a => a.name.includes('Cash') || a.id.includes('cash') || a.code === 'ACC-CASH');
    const bankAcc = accounts.find(a => a.name.includes('Bank') || a.id.includes('bank') || a.code === 'ACC-BANK');
    const upiAcc = accounts.find(a => a.name.includes('UPI') || a.id.includes('upi') || a.code === 'ACC-UPI');

    const cashId = cashAcc?.id || 'cash-id';
    const bankId = bankAcc?.id || 'bank-id';
    const upiId = upiAcc?.id || 'upi-id';

    let partyName = 'Party Account';
    if (watchedPartyId === 'CREATE_NEW') {
      partyName = watchedNewPartyName || 'New Party (On-the-fly)';
    } else if (watchedPartyId) {
      partyName = parties.find(p => p.id === watchedPartyId)?.name || 'Party Account';
    }

    let assetAccountName = cashAcc?.name || 'Cash Desk';
    if (watchedPaymentMode === 'BANK') {
      assetAccountName = bankAcc?.name || 'Bank Account';
    } else if (watchedPaymentMode === 'UPI') {
      assetAccountName = upiAcc?.name || 'UPI QR Account';
    }

    const destName = accounts.find(a => a.id === watchedAccountId)?.name || 'Target Account';

    const lines: { name: string; debit: number; credit: number }[] = [];

    switch (watchedType) {
      case 'SALE':
        lines.push({
          name: watchedIsCredit ? partyName : assetAccountName,
          debit: watchedAmount,
          credit: 0,
        });
        lines.push({
          name: destName,
          debit: 0,
          credit: watchedAmount,
        });
        break;
      case 'PURCHASE':
        lines.push({
          name: destName,
          debit: watchedAmount,
          credit: 0,
        });
        lines.push({
          name: watchedIsCredit ? partyName : assetAccountName,
          debit: 0,
          credit: watchedAmount,
        });
        break;
      case 'EXPENSE':
        lines.push({
          name: destName,
          debit: watchedAmount,
          credit: 0,
        });
        lines.push({
          name: assetAccountName,
          debit: 0,
          credit: watchedAmount,
        });
        break;
      case 'INCOME':
        lines.push({
          name: assetAccountName,
          debit: watchedAmount,
          credit: 0,
        });
        lines.push({
          name: destName,
          debit: 0,
          credit: watchedAmount,
        });
        break;
      case 'RECEIPT':
        lines.push({
          name: assetAccountName,
          debit: watchedAmount,
          credit: 0,
        });
        lines.push({
          name: partyName,
          debit: 0,
          credit: watchedAmount,
        });
        break;
      case 'PAYMENT':
        lines.push({
          name: partyName,
          debit: watchedAmount,
          credit: 0,
        });
        lines.push({
          name: assetAccountName,
          debit: 0,
          credit: watchedAmount,
        });
        break;
      case 'CONTRA':
        lines.push({
          name: destName,
          debit: watchedAmount,
          credit: 0,
        });
        lines.push({
          name: assetAccountName,
          debit: 0,
          credit: watchedAmount,
        });
        break;
    }

    return lines;
  };

  const onSubmit = async (values: TransactionFormValues) => {
    setIsPending(true);
    setError(null);
    try {
      const isCreateNew = values.partyId === 'CREATE_NEW';
      await createTransactionAction({
        type: values.type,
        date: new Date(values.date),
        amount: values.amount,
        paymentMode: values.paymentMode,
        accountId: values.accountId,
        partyId: values.partyId || null,
        description: values.description,
        referenceNumber: values.referenceNumber || null,
        isCreditTransaction: values.isCreditTransaction,
        newParty: isCreateNew ? {
          name: values.newPartyName || 'Unnamed Party',
          phone: values.newPartyPhone || null,
          email: values.newPartyEmail || null,
          address: values.newPartyAddress || null,
          gstin: values.newPartyGstin || null,
        } : null,
        attachment: uploadedAttachment,
      });
      router.push('/transactions');
    } catch (err: any) {
      setError(err?.message || 'Failed to save transaction.');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl bg-white border border-border-brand/80 rounded-[32px] p-6 sm:p-8 shadow-soft">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Transaction Type */}
        <div>
          <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
            Transaction Type
          </label>
          <select
            {...register('type')}
            className="w-full bg-background-app/50 border border-border-brand rounded-xl p-3 text-sm focus:outline-none focus:border-accent"
          >
            <option value="">Select Type</option>
            <option value="SALE">Sale</option>
            <option value="PURCHASE">Purchase</option>
            <option value="EXPENSE">Expense</option>
            <option value="INCOME">Income</option>
            <option value="RECEIPT">Customer Receipt</option>
            <option value="PAYMENT">Supplier Payment</option>
          </select>
          {errors.type && <span className="text-red-500 text-xs mt-1 block">{errors.type.message}</span>}
        </div>

        {/* Date */}
        <div>
          <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
            Transaction Date
          </label>
          <input
            type="date"
            {...register('date')}
            className="w-full bg-background-app/50 border border-border-brand rounded-xl p-3 text-sm focus:outline-none focus:border-accent"
          />
          {errors.date && <span className="text-red-500 text-xs mt-1 block">{errors.date.message}</span>}
        </div>

        {/* Account selection */}
        <div>
          <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
            Ledger Account
          </label>
          <select
            {...register('accountId')}
            className="w-full bg-background-app/50 border border-border-brand rounded-xl p-3 text-sm focus:outline-none focus:border-accent"
          >
            <option value="">Select Account</option>
            {filteredAccounts.map(acc => (
              <option key={acc.id} value={acc.id}>{acc.name}</option>
            ))}
          </select>
          {errors.accountId && <span className="text-red-500 text-xs mt-1 block">{errors.accountId.message}</span>}
        </div>

        {/* Amount */}
        <div>
          <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
            Transaction Amount (₹)
          </label>
          <input
            type="number"
            step="0.01"
            placeholder="0.00"
            {...register('amount', { valueAsNumber: true })}
            className="w-full bg-background-app/50 border border-border-brand rounded-xl p-3 text-sm focus:outline-none focus:border-accent"
          />
          {errors.amount && <span className="text-red-500 text-xs mt-1 block">{errors.amount.message}</span>}
        </div>

        {/* Payment Mode */}
        <div>
          <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
            Payment Mode
          </label>
          <select
            {...register('paymentMode')}
            className="w-full bg-background-app/50 border border-border-brand rounded-xl p-3 text-sm focus:outline-none focus:border-accent"
          >
            <option value="CASH">Cash</option>
            <option value="BANK">Bank Transfer / Cheque</option>
            <option value="UPI">UPI / QR Code</option>
          </select>
          {errors.paymentMode && <span className="text-red-500 text-xs mt-1 block">{errors.paymentMode.message}</span>}
        </div>

        {/* Reference number */}
        <div>
          <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
            Reference Number (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Cheque No., UPI Ref No."
            {...register('referenceNumber')}
            className="w-full bg-background-app/50 border border-border-brand rounded-xl p-3 text-sm focus:outline-none focus:border-accent"
          />
        </div>

        {/* Conditional Party Selector */}
        {showPartySelector && (
          <div className="sm:col-span-2 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                Associated Party (Customer / Supplier)
              </label>
              <select
                {...register('partyId')}
                className="w-full bg-background-app/50 border border-border-brand rounded-xl p-3 text-sm focus:outline-none focus:border-accent"
              >
                <option value="">Select Party</option>
                <option value="CREATE_NEW" className="text-accent font-semibold">+ Create New Party on-the-fly...</option>
                {filteredParties.map(p => (
                  <option key={p.id} value={p.id}>{p.name} {p.phone ? `(${p.phone})` : ''}</option>
                ))}
              </select>
            </div>

            {/* Inline New Party Fields */}
            {watch('partyId') === 'CREATE_NEW' && (
              <div className="bg-brand-50/20 border border-border-brand/60 rounded-2xl p-4 sm:p-6 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                <h4 className="font-serif font-semibold text-brand-900 text-sm">New Party Registration</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-semibold text-text-secondary uppercase tracking-wider mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      {...register('newPartyName')}
                      className="w-full bg-white border border-border-brand/80 rounded-xl p-2.5 text-xs focus:outline-none focus:border-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-text-secondary uppercase tracking-wider mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 9876543210"
                      {...register('newPartyPhone')}
                      className="w-full bg-white border border-border-brand/80 rounded-xl p-2.5 text-xs focus:outline-none focus:border-accent"
                    />
                    {watch('newPartyPhone') && filteredParties.find(p => p.phone === watch('newPartyPhone')) && (
                      <span className="text-[10px] text-amber-700 font-medium mt-1 block">
                        ⚠️ Phone belongs to existing party: {filteredParties.find(p => p.phone === watch('newPartyPhone'))?.name}
                      </span>
                    )}
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-text-secondary uppercase tracking-wider mb-1">
                      GSTIN (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 07AAAAA1111A1Z1"
                      {...register('newPartyGstin')}
                      className="w-full bg-white border border-border-brand/80 rounded-xl p-2.5 text-xs focus:outline-none focus:border-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-text-secondary uppercase tracking-wider mb-1">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. name@email.com"
                      {...register('newPartyEmail')}
                      className="w-full bg-white border border-border-brand/80 rounded-xl p-2.5 text-xs focus:outline-none focus:border-accent"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-semibold text-text-secondary uppercase tracking-wider mb-1">
                      Physical Address (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. DLF Phase 3, Gurgaon"
                      {...register('newPartyAddress')}
                      className="w-full bg-white border border-border-brand/80 rounded-xl p-2.5 text-xs focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Is Credit Transaction Checkbox */}
        {['SALE', 'PURCHASE'].includes(selectedType) && (
          <div className="flex items-center gap-2 pt-8">
            <input
              type="checkbox"
              id="isCreditTransaction"
              {...register('isCreditTransaction')}
              className="w-4 h-4 rounded border-border-brand text-brand-800 focus:ring-accent"
            />
            <label htmlFor="isCreditTransaction" className="text-xs font-semibold text-text-secondary cursor-pointer">
              Record as Credit Transaction (Posts to Outstanding Dues)
            </label>
          </div>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
          Description
        </label>
        <textarea
          rows={2}
          placeholder="Enter detailed description of item sales or payment details..."
          {...register('description')}
          className="w-full bg-background-app/50 border border-border-brand rounded-xl p-3 text-sm focus:outline-none focus:border-accent"
        />
        {errors.description && <span className="text-red-500 text-xs mt-1 block">{errors.description.message}</span>}
      </div>

      {/* File Attachment Uploader */}
      <div className="bg-brand-50/10 border border-dashed border-border-brand rounded-2xl p-4 flex flex-col items-center justify-center gap-2">
        <label className={`block text-xs font-semibold text-text-secondary uppercase tracking-wider text-center ${uploading ? 'cursor-wait' : 'cursor-pointer'}`}>
          <span className="text-brand-800 hover:text-accent font-semibold">
            {uploading ? (uploadProgress || 'Uploading...') : 'Attach Voucher / Receipt (Optional)'}
          </span>
          <input
            type="file"
            accept="application/pdf,image/png,image/jpeg,image/webp"
            onChange={handleFileUpload}
            disabled={uploading || isPending}
            className="hidden"
          />
        </label>

        {/* Upload progress pulse */}
        {uploading && (
          <div className="w-full max-w-[200px] bg-brand-100 rounded-full h-1 overflow-hidden mt-1">
            <div className="h-full bg-accent rounded-full animate-pulse" style={{ width: '60%' }} />
          </div>
        )}

        {!uploading && uploadedAttachment ? (
          <div className="text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1.5 font-medium mt-1">
            <span>✓ {uploadedAttachment.fileName} ({Math.round(uploadedAttachment.fileSize / 1024)} KB)</span>
            <button
              type="button"
              onClick={() => setUploadedAttachment(null)}
              className="ml-1 text-emerald-500 hover:text-red-500 transition-colors font-bold leading-none cursor-pointer"
              aria-label="Remove attachment"
            >
              ×
            </button>
          </div>
        ) : !uploading ? (
          <p className="text-[10px] text-text-muted text-center">Click to attach PDF, PNG or JPG voucher</p>
        ) : null}
      </div>

      {/* Balanced Journal Preview Panel */}
      {getJournalPreview().length > 0 && (
        <div className="bg-surface-alt border border-border-brand/80 rounded-2xl p-4 space-y-3 animate-in fade-in duration-300">
          <h4 className="font-serif font-semibold text-brand-900 text-xs uppercase tracking-wider">Double-Entry Posting Preview</h4>
          <div className="border border-border-brand/40 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-brand-50/30 text-text-secondary border-b border-border-brand/40 font-medium">
                  <th className="p-3">Ledger Account</th>
                  <th className="p-3 text-right">Debit (₹)</th>
                  <th className="p-3 text-right">Credit (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-brand/30 bg-white">
                {getJournalPreview().map((line, idx) => (
                  <tr key={idx} className="hover:bg-brand-50/10">
                    <td className="p-3 font-medium text-brand-900">{line.name}</td>
                    <td className="p-3 text-right font-semibold text-emerald-700">{line.debit > 0 ? line.debit.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '—'}</td>
                    <td className="p-3 text-right font-semibold text-brand-900">{line.credit > 0 ? line.credit.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-between items-center text-[10px] text-text-muted font-mono bg-brand-50/20 px-3 py-1.5 rounded-lg">
            <span>Balanced Preview Status: OK</span>
            <span>Ctrl + Enter to Quick Post</span>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-xs font-medium rounded-xl p-3 flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Submit Actions */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={isPending || uploading}
          className="rounded-full bg-brand-800 text-white px-8 py-3 text-sm font-semibold hover:bg-accent disabled:opacity-50 transition-all active:scale-[0.97] duration-100 shadow-soft cursor-pointer"
        >
          {isPending ? 'Saving Transaction...' : 'Post Transaction'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-full border border-brand-300 text-brand-900 px-8 py-3 text-sm font-semibold hover:bg-brand-50 transition-all active:scale-[0.97] duration-100 cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
