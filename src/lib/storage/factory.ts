import { StorageProvider } from './types';
import { CloudflareR2Provider } from './providers/r2';
import { LocalDiskProvider } from './providers/local';
import { TransloaditProvider } from './providers/transloadit';

let providerInstance: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (providerInstance) {
    return providerInstance;
  }

  const selectedProvider = process.env.STORAGE_PROVIDER || 'LOCAL';

  if (selectedProvider === 'R2') {
    providerInstance = new CloudflareR2Provider();
  } else if (selectedProvider === 'TRANSLOADIT') {
    providerInstance = new TransloaditProvider();
  } else {
    providerInstance = new LocalDiskProvider();
  }

  return providerInstance;
}
