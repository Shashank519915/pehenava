import { StorageProvider } from '../types';
import fs from 'fs/promises';
import path from 'path';

export class LocalDiskProvider implements StorageProvider {
  private uploadDir: string;
  private publicUrl: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'public', 'uploads');
    this.publicUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/uploads`;
  }

  private async ensureDir() {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(file: Buffer, fileName: string, mimeType: string): Promise<string> {
    await this.ensureDir();
    const key = `${Date.now()}-${fileName}`;
    const filePath = path.join(this.uploadDir, key);
    
    await fs.writeFile(filePath, file);
    return `${this.publicUrl}/${key}`;
  }

  async getPresignedUploadUrl(
    fileName: string,
    mimeType: string
  ): Promise<{ uploadUrl: string; publicUrl: string }> {
    // For local fallback, we route uploads through a local Next.js api endpoint `/api/upload/local`
    const key = `${Date.now()}-${fileName}`;
    const uploadUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/upload/local?key=${key}`;
    const publicUrl = `${this.publicUrl}/${key}`;

    return { uploadUrl, publicUrl };
  }

  async deleteFile(fileKey: string): Promise<void> {
    const key = fileKey.replace(`${this.publicUrl}/`, '');
    const filePath = path.join(this.uploadDir, key);
    try {
      await fs.unlink(filePath);
    } catch {
      // Ignore if file doesn't exist
    }
  }
}
