import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import crypto from 'crypto';

/**
 * POST /api/upload/transloadit-params
 *
 * Returns signed Transloadit assembly params for a direct browser → Transloadit upload.
 * The secret never leaves this server. The client uses the returned params + signature
 * to POST a FormData directly to the Transloadit assemblies endpoint, then polls
 * the returned assembly_ssl_url until completion to get the final B2 file URL.
 *
 * Only authenticated users may call this endpoint.
 */
export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const authKey = process.env.TRANSLOADIT_KEY;
  const authSecret = process.env.TRANSLOADIT_SECRET;
  const templateId = process.env.TRANSLOADIT_TEMPLATE_ID;

  if (!authKey || !authSecret || !templateId) {
    return NextResponse.json(
      { error: 'Transloadit is not configured on this server.' },
      { status: 503 }
    );
  }

  // Expires in 30 minutes – plenty of time for the upload to start
  const expires = new Date(Date.now() + 30 * 60 * 1000)
    .toISOString()
    .replace('T', ' ')
    .slice(0, 19); // "YYYY-MM-DD HH:MM:SS" UTC

  const params = {
    auth: { key: authKey, expires },
    template_id: templateId,
  };

  const paramsString = JSON.stringify(params);

  const signature = crypto
    .createHmac('sha1', authSecret)
    .update(Buffer.from(paramsString, 'utf-8'))
    .digest('hex');

  return NextResponse.json({
    params: paramsString,
    signature,
    assembly_url: 'https://api2.transloadit.com/assemblies',
  });
}
