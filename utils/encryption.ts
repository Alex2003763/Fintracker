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
 * Get or create the encryption key
 */
export async function getEncryptionKey(): Promise<CryptoKey> {
  if (cachedKey) return cachedKey;

  // Try to load existing key from storage
  // Note: Storing key in localStorage is not perfect security (XSS vulnerable),
  // but protects against casual offline attacks/database inspection.
  const storedKeyJson = localStorage.getItem(KEY_STORAGE_KEY);

  if (storedKeyJson) {
    const keyData = JSON.parse(storedKeyJson);
    cachedKey = await window.crypto.subtle.importKey(
      'jwk',
      keyData,
      { name: 'AES-GCM', length: 256 },
      true, // extractable
      ['encrypt', 'decrypt']
    );
    return cachedKey;
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
 */
export async function encryptData(data: string): Promise<{ cipherText: string; iv: string }> {
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
 */
export async function decryptData(cipherText: string, iv: string): Promise<string> {
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
    return '[Encrypted Data]';
  }
}

/**
 * Helper to encrypt specific object fields
 * Returns a new object with encrypted fields
 */
export async function encryptObjectFields<T extends object>(
  obj: T,
  fields: (keyof T)[]
): Promise<T> {
  const newObj = { ...obj };
  
  for (const field of fields) {
    const value = newObj[field];
    if (typeof value === 'string' && value.length > 0) {
      // We prepend a marker to identify encrypted data easily? 
      // Or we just store it as a specific structure?
      // For simplicity in this existing schema, we'll store JSON string: { c: cipher, i: iv }
      // This changes the type of the field effectively to string, but it was likely string already.
      // Ideally we should have separate columns, but schema is fixed.
      // We'll wrap it in a special format: "__ENC__:<iv>:<ciphertext>"
      
      const { cipherText, iv } = await encryptData(value);
      // @ts-ignore
      newObj[field] = `__ENC__:${iv}:${cipherText}`;
    }
  }
  
  return newObj;
}

/**
 * Helper to decrypt specific object fields
 */
export async function decryptObjectFields<T extends object>(
  obj: T,
  fields: (keyof T)[]
): Promise<T> {
  const newObj = { ...obj };
  
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
        }
      }
    }
  }
  
  return newObj;
}