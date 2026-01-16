import { User } from '../types';

/**
 * WebAuthn utility for client-side biometric authentication.
 * 
 * Note: In a true secure environment, WebAuthn requires a backend server to verify signatures.
 * Since this is a client-side PWA, we use the WebAuthn API primarily as a secure local gate
 * (verifying user presence/ownership via the OS authenticator) before unlocking locally stored secrets.
 */

// Helper to convert string to Uint8Array
const strToBin = (str: string): Uint8Array => {
  return Uint8Array.from(str, c => c.charCodeAt(0));
};

// Helper to convert Uint8Array to Base64URL string
const binToBase64Url = (bin: Uint8Array): string => {
  return btoa(String.fromCharCode(...bin))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

// Helper to generate a random challenge
const generateChallenge = (): Uint8Array => {
  const challenge = new Uint8Array(32);
  window.crypto.getRandomValues(challenge);
  return challenge;
};

// Check if WebAuthn is supported
export const isWebAuthnSupported = (): boolean => {
  return (
    window.crypto &&
    !!window.crypto.subtle &&
    !!window.PublicKeyCredential
  );
};

// Register a new credential (e.g., Touch ID)
export const registerWebAuthn = async (user: User): Promise<PublicKeyCredential | null> => {
  if (!isWebAuthnSupported()) throw new Error('WebAuthn not supported');

  const challenge = generateChallenge();
  const userId = strToBin(user.username); // Use username as ID for simplicity in this local context

  const publicKey: PublicKeyCredentialCreationOptions = {
    challenge: challenge.buffer as ArrayBuffer,
    rp: {
      name: 'FinTrack',
      id: window.location.hostname, // Must match the current domain
    },
    user: {
      id: userId.buffer as ArrayBuffer,
      name: user.username,
      displayName: user.username,
    },
    pubKeyCredParams: [
      { type: 'public-key', alg: -7 }, // ES256
      { type: 'public-key', alg: -257 }, // RS256
    ],
    timeout: 60000,
    attestation: 'none',
    authenticatorSelection: {
      authenticatorAttachment: 'platform', // Prefer platform authenticators (FaceID, TouchID)
      userVerification: 'required',
      requireResidentKey: false,
    },
  };

  try {
    const credential = await navigator.credentials.create({ publicKey });
    return credential as PublicKeyCredential;
  } catch (error) {
    console.error('WebAuthn registration failed:', error);
    throw error;
  }
};

// Authenticate via WebAuthn
export const authenticateWebAuthn = async (credentialId?: string): Promise<boolean> => {
  if (!isWebAuthnSupported()) return false;

  const challenge = generateChallenge();

  const publicKey: PublicKeyCredentialRequestOptions = {
    challenge: challenge.buffer as ArrayBuffer,
    timeout: 60000,
    userVerification: 'required',
    rpId: window.location.hostname,
  };

  if (credentialId) {
    publicKey.allowCredentials = [{
      id: strToBin(atob(credentialId.replace(/-/g, '+').replace(/_/g, '/'))).buffer as ArrayBuffer, // Decode Base64URL to Uint8Array/ArrayBuffer
      type: 'public-key',
     // transports: ['internal'],
    }];
  }

  try {
    const assertion = await navigator.credentials.get({ publicKey });
    // In a real backend scenario, we would send 'assertion' to the server for verification.
    // Here, the fact that the OS successfully authenticated the user (TouchID/FaceID) is our local gate.
    return !!assertion;
  } catch (error) {
    console.error('WebAuthn authentication failed:', error);
    return false;
  }
};

// Store the session key locally (encrypted logic would be better, but we rely on OS sandbox + biometric gate)
// WARN: This stores the sensitive key in localStorage, but relies on the app logic to only read it after auth.
// Ideally, use IndexedDB with granular control or rely on the password for full security.
export const saveBiometricSession = async (key: CryptoKey): Promise<void> => {
    // Export key to JWK
    const exportedKey = await window.crypto.subtle.exportKey('jwk', key);
    localStorage.setItem('fintrack_biometric_key', JSON.stringify(exportedKey));
};

export const getBiometricSession = async (): Promise<CryptoKey | null> => {
    const storedKey = localStorage.getItem('fintrack_biometric_key');
    if (!storedKey) return null;

    try {
        const jwk = JSON.parse(storedKey);
        // Import back to CryptoKey
        return await window.crypto.subtle.importKey(
            'jwk',
            jwk,
            'AES-GCM',
            true,
            ['encrypt', 'decrypt']
        );
    } catch (e) {
        console.error("Failed to restore biometric session key", e);
        return null;
    }
};

export const clearBiometricSession = () => {
    localStorage.removeItem('fintrack_biometric_key');
};