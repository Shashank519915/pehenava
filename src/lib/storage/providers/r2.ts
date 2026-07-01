import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { StorageProvider } from '../types';

export class CloudflareR2Provider implements StorageProvider {
  private s3Client: S3Client;
  private bucketName: string;
  private publicUrl: string;

  constructor() {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    this.bucketName = process.env.R2_BUCKET_NAME || '';
    this.publicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || '';

    // R2 endpoint format: https://<account_id>.r2.cloudflarestorage.com
    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: accessKeyId || '',
        secretAccessKey: secretAccessKey || '',
      },
    });
  }

  async uploadFile(file: Buffer, fileName: string, mimeType: string): Promise<string> {
    const key = `${Date.now()}-${fileName}`;
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: file,
      ContentType: mimeType,
    });

    await this.s3Client.send(command);
    return `${this.publicUrl}/${key}`;
  }

  async getPresignedUploadUrl(
    fileName: string,
    mimeType: string
  ): Promise<{ uploadUrl: string; publicUrl: string }> {
    const key = `${Date.now()}-${fileName}`;
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: mimeType,
    });

    // Link expires in 600 seconds (10 minutes)
    const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 600 });
    const publicUrl = `${this.publicUrl}/${key}`;

    return { uploadUrl, publicUrl };
  }

  async deleteFile(fileKey: string): Promise<void> {
    // Extract key from full URL if needed
    const key = fileKey.replace(`${this.publicUrl}/`, '');
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    await this.s3Client.send(command);
  }
}
