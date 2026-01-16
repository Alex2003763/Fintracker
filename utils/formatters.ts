
export const formatCurrency = (amount: number): string => {
  return amount.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });
};

export const parseQuickAddInput = (input: string): { description: string, amount: number } | null => {
    // Regex to find the last number in the string, which could be an integer or a decimal.
    const match = input.match(/(.*)\s+(\d+(\.\d{1,2})?)$/);
    if (match) {
        const description = match[1].trim();
        const amount = parseFloat(match[2]);
        if (description && !isNaN(amount) && amount > 0) {
            return { description, amount };
        }
    }
    return null;
};

// --- Crypto Utils ---

// Helper to convert ArrayBuffer to Base64
const bufferToBase64 = (buffer: ArrayBuffer | Uint8Array) => {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return btoa(String.fromCharCode(...bytes));
};

// Helper to convert Base64 to ArrayBuffer
const base64ToBuffer = (base64: string) => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

// Generate a random salt
export const generateSalt = () => {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  return bufferToBase64(salt);
};

// Derive a key from a password and salt using PBKDF2
const getPasswordKey = (password: string) => {
    const enc = new TextEncoder();
    return window.crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
};

export const deriveKey = async (password: string, salt: string) => {
    const passwordKey = await getPasswordKey(password);
    const saltBuffer = base64ToBuffer(salt);
    return window.crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: saltBuffer,
            iterations: 100000,
            hash: 'SHA-256'
        },
        passwordKey,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );
};

// Encrypt data with AES-GCM
export const encryptData = async (data: string, key: CryptoKey) => {
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();
    const encodedData = enc.encode(data);
    const ciphertext = await window.crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv: iv
        },
        key,
        encodedData
    );
    return {
        iv: bufferToBase64(iv),
        ciphertext: bufferToBase64(ciphertext)
    };
};

// Decrypt data with AES-GCM
export const decryptData = async (encrypted: { iv: string; ciphertext: string }, key: CryptoKey) => {
    const ivBuffer = base64ToBuffer(encrypted.iv);
    const ciphertextBuffer = base64ToBuffer(encrypted.ciphertext);
    try {
        const decrypted = await window.crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv: ivBuffer
            },
            key,
            ciphertextBuffer
        );
        const dec = new TextDecoder();
        return dec.decode(decrypted);
    } catch (e) {
        console.error("Decryption failed", e);
        return null; // Indicates a failure, likely wrong password
    }
};
