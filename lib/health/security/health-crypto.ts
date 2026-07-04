export interface EncryptedData {
  ciphertext: string;
  iv: string;
  tag: string;
  salt: string;
}

export interface CryptoKeyPair {
  encryptionKey: CryptoKey;
  salt: Uint8Array;
}

const ALGO = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12;
const TAG_LENGTH = 128;
const SALT_LENGTH = 16;
const ITERATIONS = 100000;

export class HealthCrypto {
  async deriveKey(biometricToken: string, pin: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const combined = biometricToken + pin + 'MTAA_HEALTH_DERIVE';
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(combined),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );
    const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
      keyMaterial,
      { name: ALGO, length: KEY_LENGTH },
      false,
      ['encrypt', 'decrypt']
    );
  }

  async deriveKeyFromPin(pin: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(pin + 'MTAA_HEALTH_PIN'),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
      keyMaterial,
      { name: ALGO, length: KEY_LENGTH },
      false,
      ['encrypt', 'decrypt']
    );
  }

  async encrypt(data: object, key: CryptoKey): Promise<EncryptedData> {
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const encoder = new TextEncoder();
    const plaintext = encoder.encode(JSON.stringify(data));
    const encrypted = await crypto.subtle.encrypt(
      { name: ALGO, iv, tagLength: TAG_LENGTH },
      key,
      plaintext
    );
    const combined = new Uint8Array(encrypted);
    const ciphertext = combined.slice(0, combined.byteLength - TAG_LENGTH / 8);
    const tag = combined.slice(combined.byteLength - TAG_LENGTH / 8);
    return {
      ciphertext: arrayBufferToBase64(ciphertext.buffer),
      iv: arrayBufferToBase64(iv.buffer),
      tag: arrayBufferToBase64(tag.buffer),
      salt: arrayBufferToBase64(crypto.getRandomValues(new Uint8Array(SALT_LENGTH)).buffer),
    };
  }

  async decrypt(encrypted: EncryptedData, key: CryptoKey): Promise<object> {
    const iv = base64ToArrayBuffer(encrypted.iv);
    const ciphertext = base64ToArrayBuffer(encrypted.ciphertext);
    const tag = base64ToArrayBuffer(encrypted.tag);
    const combined = new Uint8Array(ciphertext.byteLength + tag.byteLength);
    combined.set(new Uint8Array(ciphertext), 0);
    combined.set(new Uint8Array(tag), ciphertext.byteLength);
    const decrypted = await crypto.subtle.decrypt(
      { name: ALGO, iv: new Uint8Array(iv), tagLength: TAG_LENGTH },
      key,
      combined
    );
    const decoder = new TextDecoder();
    return JSON.parse(decoder.decode(decrypted));
  }

  async generateChecksum(data: object): Promise<string> {
    const encoder = new TextEncoder();
    const buf = await crypto.subtle.digest('SHA-256', encoder.encode(JSON.stringify(data)));
    return arrayBufferToBase64(buf);
  }

  async verifyChecksum(data: object, checksum: string): Promise<boolean> {
    const computed = await this.generateChecksum(data);
    return computed === checksum;
  }

  async verifySignature(data: string, signature: string, publicKeyPem: string): Promise<boolean> {
    try {
      const publicKey = await importRsaPublicKey(publicKeyPem);
      const encoder = new TextEncoder();
      const sigBuf = base64ToArrayBuffer(signature);
      return await crypto.subtle.verify(
        'RSASSA-PKCS1-v1_5',
        publicKey,
        sigBuf,
        encoder.encode(data)
      );
    } catch {
      return false;
    }
  }
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function importRsaPublicKey(pem: string): Promise<CryptoKey> {
  const base64 = pem.replace(/-----BEGIN PUBLIC KEY-----/, '')
    .replace(/-----END PUBLIC KEY-----/, '')
    .replace(/\s/g, '');
  const binary = base64ToArrayBuffer(base64);
  return crypto.subtle.importKey(
    'spki',
    binary,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify']
  );
}

export const healthCrypto = new HealthCrypto();
