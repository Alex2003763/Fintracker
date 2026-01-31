/**
 * Encryption utilities for securing data at rest in IndexedDB
 * Uses Web Crypto API (AES-GCM)
 */

const KEY_STORAGE_KEY = 'fintrack_encryption_key';
const SALT_STORAGE_KEY = 'fintrack_encryption_salt';

// Store the CryptoKey in memory after loading
let cachedKey: CryptoKey | null = null;

// Convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Convert Base64 to ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary_string = window.atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Check if the Web Crypto API is available
 * Note: On mobile browsers, crypto.subtle may not be available in insecure contexts (non-HTTPS)
 * or in some WebView scenarios
 */
export function isCryptoSupported(): boolean {
  return !!(window.crypto && window.crypto.subtle);
}

/**
 * Get or create the encryption key
 */
export async function getEncryptionKey(): Promise<CryptoKey> {
  if (cachedKey) return cachedKey;

  // Check if crypto is supported (may fail on mobile in insecure contexts)
  if (!isCryptoSupported()) {
    throw new Error('Web Crypto API not supported. Ensure you are using HTTPS or a secure context.');
  }

  // Try to load existing key from storage
  // Note: Storing key in localStorage is not perfect security (XSS vulnerable),
  // but protects against casual offline attacks/database inspection.
  const storedKeyJson = localStorage.getItem(KEY_STORAGE_KEY);

  if (storedKeyJson) {
    try {
      const keyData = JSON.parse(storedKeyJson);
      cachedKey = await window.crypto.subtle.importKey(
        'jwk',
        keyData,
        { name: 'AES-GCM', length: 256 },
        true, // extractable
        ['encrypt', 'decrypt']
      );
      return cachedKey;
    } catch (e) {
      console.warn('Failed to import stored encryption key, generating new one:', e);
      localStorage.removeItem(KEY_STORAGE_KEY);
    }
  }

  // Generate new key
  const key = await window.crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true, // extractable
    ['encrypt', 'decrypt']
  );

  // Export and save key
  const exportedKey = await window.crypto.subtle.exportKey('jwk', key);
  localStorage.setItem(KEY_STORAGE_KEY, JSON.stringify(exportedKey));
  
  cachedKey = key;
  return key;
}

/**
 * Encrypt string data
 * Returns plaintext if crypto is not supported (mobile fallback)
 */
export async function encryptData(data: string): Promise<{ cipherText: string; iv: string }> {
  // If crypto not supported, return data as-is with a marker
  if (!isCryptoSupported()) {
    return {
      cipherText: data,
      iv: '__NOCRYPTO__',
    };
  }

  const key = await getEncryptionKey();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encodedData = new TextEncoder().encode(data);

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    encodedData
  );

  return {
    cipherText: arrayBufferToBase64(encryptedBuffer),
    iv: arrayBufferToBase64(iv.buffer),
  };
}

/**
 * Decrypt string data
 * Returns plaintext if crypto is not supported or if data was stored without encryption
 */
export async function decryptData(cipherText: string, iv: string): Promise<string> {
  // If crypto not supported or data was stored without encryption, return as-is
  if (!isCryptoSupported() || iv === '__NOCRYPTO__') {
    return cipherText;
  }

  try {
    const key = await getEncryptionKey();
    const ivBuffer = base64ToArrayBuffer(iv);
    const encryptedBuffer = base64ToArrayBuffer(cipherText);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivBuffer,
      },
      key,
      encryptedBuffer
    );

    return new TextDecoder().decode(decryptedBuffer);
  } catch (error) {
    console.error('Decryption failed:', error);
    return cipherText; // Return original data instead of '[Encrypted Data]' to prevent data loss
  }
}

/**
 * Helper to encrypt specific object fields
 * Returns a new object with encrypted fields
 * If crypto is not supported, returns the object unchanged
 */
export async function encryptObjectFields<T extends object>(
  obj: T,
  fields: (keyof T)[]
): Promise<T> {
  const newObj = { ...obj };
  
  // If crypto not supported, return object unchanged
  if (!isCryptoSupported()) {
    return newObj;
  }
  
  for (const field of fields) {
    const value = newObj[field];
    if (typeof value === 'string' && value.length > 0) {
      // Skip if already encrypted
      if (value.startsWith('__ENC__:')) {
        continue;
      }
      
      const { cipherText, iv } = await encryptData(value);
      // @ts-ignore
      newObj[field] = `__ENC__:${iv}:${cipherText}`;
    }
  }
  
  return newObj;
}

/**
 * Helper to decrypt specific object fields
 * If crypto is not supported, returns the object unchanged
 */
export async function decryptObjectFields<T extends object>(
  obj: T,
  fields: (keyof T)[]
): Promise<T> {
  const newObj = { ...obj };
  
  // If crypto not supported, return object unchanged
  if (!isCryptoSupported()) {
    return newObj;
  }
  
  for (const field of fields) {
    const value = newObj[field];
    if (typeof value === 'string' && value.startsWith('__ENC__:')) {
      const parts = value.split(':');
      if (parts.length === 3) {
        const iv = parts[1];
        const cipherText = parts[2];
        try {
          // @ts-ignore
          newObj[field] = await decryptData(cipherText, iv);
        } catch (e) {
          console.warn(`Failed to decrypt field ${String(field)}`);
          // Keep original value if decryption fails
        }
      }
    }
  }
  
  return newObj;
}