import { createHmac } from 'crypto';

/**
 * Computes a secure HMAC SHA-256 hash of a stringified object for tamper detection audit records.
 */
export function computeSHA256(data: any): string {
  const serialized = typeof data === 'string' ? data : JSON.stringify(data);
  const secret = process.env.AUDIT_HMAC_SECRET || 'pehenava-audit-hmac-secret-default-key';
  return createHmac('sha256', secret).update(serialized).digest('hex');
}
