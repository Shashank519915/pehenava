import crypto from 'crypto';
import { StorageProvider } from '../types';

/**
 * TransloaditProvider
 *
 * Uses Transloadit as the upload processor. The Assembly Template must include
 * a /backblaze/store (or other) export Robot so that files end up in permanent
 * storage — NOT on Transloadit's 24-hour temp CDN.
 *
 * Required env vars:
 *   TRANSLOADIT_KEY          – Auth Key from the Transloadit dashboard
 *   TRANSLOADIT_SECRET       – Auth Secret from the Transloadit dashboard
 *   TRANSLOADIT_TEMPLATE_ID  – Template ID containing the export Robot
 *   NEXT_PUBLIC_B2_PUBLIC_URL – Base CDN URL for your B2 bucket
 *                               e.g. https://f005.backblazeb2.com/file/pehenava-attachments
 */
export class TransloaditProvider implements StorageProvider {
  private readonly authKey: string;
  private readonly authSecret: string;
  private readonly templateId: string;
  private readonly assemblyUrl = 'https://api2.transloadit.com/assemblies';

  constructor() {
    const key = process.env.TRANSLOADIT_KEY;
    const secret = process.env.TRANSLOADIT_SECRET;
    const templateId = process.env.TRANSLOADIT_TEMPLATE_ID;

    if (!key || !secret || !templateId) {
      throw new Error(
        'Transloadit provider is missing required env vars: ' +
          'TRANSLOADIT_KEY, TRANSLOADIT_SECRET, TRANSLOADIT_TEMPLATE_ID'
      );
    }

    this.authKey = key;
    this.authSecret = secret;
    this.templateId = templateId;
  }

  /** Build a signed params object (expires in 30 min) */
  private buildSignedParams(): { paramsString: string; signature: string } {
    const params = {
      auth: {
        key: this.authKey,
        // Give 30-minute window; enough for any upload
        expires: new Date(Date.now() + 30 * 60 * 1000)
          .toISOString()
          .replace('T', ' ')
          .slice(0, 19), // Transloadit expects "YYYY-MM-DD HH:MM:SS" UTC
      },
      template_id: this.templateId,
    };

    const paramsString = JSON.stringify(params);
    const signature = crypto
      .createHmac('sha1', this.authSecret)
      .update(Buffer.from(paramsString, 'utf-8'))
      .digest('hex');

    return { paramsString, signature };
  }

  /**
   * Polls the assembly until it reaches a terminal state.
   * Returns the assembly JSON.
   */
  private async pollAssembly(
    assemblySslUrl: string,
    timeoutMs = 120_000
  ): Promise<Record<string, unknown>> {
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 1500));

      const res = await fetch(assemblySslUrl);
      if (!res.ok) {
        throw new Error(`Transloadit poll failed: HTTP ${res.status}`);
      }

      const data = (await res.json()) as Record<string, unknown>;
      const ok = data.ok as string | undefined;

      if (ok === 'ASSEMBLY_COMPLETED') return data;
      if (ok === 'ASSEMBLY_ERRORED' || ok === 'REQUEST_ABORTED') {
        const errMsg = (data.error as string | undefined) || ok;
        throw new Error(`Transloadit assembly failed: ${errMsg}`);
      }
      // Otherwise keep polling (ASSEMBLY_EXECUTING, etc.)
    }

    throw new Error('Transloadit assembly timed out after 120 seconds.');
  }

  /**
   * Extracts the permanent B2 URL from the completed assembly.
   * The export step is expected to be named "export_to_b2".
   */
  private extractPublicUrl(assembly: Record<string, unknown>): string {
    const results = assembly.results as Record<string, unknown[]> | undefined;
    if (!results) throw new Error('Transloadit assembly has no results.');

    // Try the export_to_b2 step first, then fall back to any first result
    const exportStep =
      results['export_to_b2'] ??
      results['exported'] ??
      Object.values(results)[0];

    if (!exportStep || exportStep.length === 0) {
      throw new Error('Transloadit assembly export produced no results.');
    }

    const firstResult = exportStep[0] as Record<string, unknown>;
    const url = firstResult.url as string | undefined;
    if (!url) throw new Error('Transloadit result is missing a url field.');

    return url;
  }

  // ─── StorageProvider interface ──────────────────────────────────────────────

  /**
   * Server-side upload: reads the file buffer, posts to Transloadit,
   * waits for completion and returns the permanent B2 URL.
   */
  async uploadFile(
    file: Buffer,
    fileName: string,
    mimeType: string
  ): Promise<string> {
    const { paramsString, signature } = this.buildSignedParams();

    const formData = new FormData();
    formData.append('params', paramsString);
    formData.append('signature', signature);
    formData.append(
      'file',
      new Blob([new Uint8Array(file)], { type: mimeType }),
      fileName
    );

    const res = await fetch(this.assemblyUrl, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Transloadit assembly creation failed (${res.status}): ${text}`);
    }

    const initial = (await res.json()) as Record<string, unknown>;
    const assemblySslUrl = initial.assembly_ssl_url as string | undefined;
    if (!assemblySslUrl) {
      throw new Error('Transloadit did not return an assembly_ssl_url.');
    }

    const completed = await this.pollAssembly(assemblySslUrl);
    return this.extractPublicUrl(completed);
  }

  /**
   * Returns the signed params needed for a direct browser → Transloadit upload.
   * The "uploadUrl" is the Transloadit assemblies endpoint.
   * The "publicUrl" is a placeholder — the real URL is only known after the
   * assembly completes and is returned via polling on the client side.
   *
   * Note: this method is kept for interface compliance, but the TransactionForm
   * uses the /api/upload/transloadit-params endpoint which returns a richer
   * response including the assembly URL for polling.
   */
  async getPresignedUploadUrl(
    _fileName: string,
    _mimeType: string
  ): Promise<{ uploadUrl: string; publicUrl: string }> {
    const { paramsString, signature } = this.buildSignedParams();

    // Encode params+signature into the "upload URL" as query params so
    // the client knows what to POST. The client must handle the assembly
    // polling itself to get the real final URL.
    const uploadUrl =
      `${this.assemblyUrl}?` +
      `tl_params=${encodeURIComponent(paramsString)}&` +
      `tl_sig=${encodeURIComponent(signature)}`;

    return {
      uploadUrl,
      publicUrl: '', // unknown until assembly completes
    };
  }

  /**
   * Deleting from B2 via Transloadit is not supported out-of-the-box.
   * Files on B2 persist until you delete them via the B2 API directly.
   * For now this is a safe no-op.
   */
  async deleteFile(fileKey: string): Promise<void> {
    console.warn(
      '[TransloaditProvider] deleteFile is not implemented. ' +
        'To delete, use the Backblaze B2 API directly for key:',
      fileKey
    );
  }
}
