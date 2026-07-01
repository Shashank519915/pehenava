export interface StorageProvider {
  /**
   * Uploads a file buffer directly from the server.
   * Returns the public URL of the uploaded file.
   */
  uploadFile(file: Buffer, fileName: string, mimeType: string): Promise<string>;

  /**
   * Generates a pre-signed URL for direct browser-to-storage uploader.
   * Returns the secure upload URL and the final public URL.
   */
  getPresignedUploadUrl(
    fileName: string,
    mimeType: string
  ): Promise<{ uploadUrl: string; publicUrl: string }>;

  /**
   * Deletes a file from storage.
   */
  deleteFile(fileKey: string): Promise<void>;
}
