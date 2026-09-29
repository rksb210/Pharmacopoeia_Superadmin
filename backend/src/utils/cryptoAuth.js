import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const KEYS_DIR = path.join(__dirname, '../config/keys');
const PRIVATE_KEY_PATH = path.join(KEYS_DIR, 'rsa_private.pem');
const PUBLIC_KEY_PATH = path.join(KEYS_DIR, 'rsa_public.pem');

let privateKey = null;
let publicKey = null;

function loadOrGenerateKeys() {
  try {
    // 1. Check environment variables first (ideal for PM2 clusters and Docker)
    if (process.env.RSA_PRIVATE_KEY && process.env.RSA_PUBLIC_KEY) {
      privateKey = process.env.RSA_PRIVATE_KEY.replace(/\\n/g, '\n');
      publicKey = process.env.RSA_PUBLIC_KEY.replace(/\\n/g, '\n');
      return;
    }

    // 2. Check disk files
    if (fs.existsSync(PRIVATE_KEY_PATH) && fs.existsSync(PUBLIC_KEY_PATH)) {
      privateKey = fs.readFileSync(PRIVATE_KEY_PATH, 'utf8');
      publicKey = fs.readFileSync(PUBLIC_KEY_PATH, 'utf8');
      return;
    }

    if (!fs.existsSync(KEYS_DIR)) {
      fs.mkdirSync(KEYS_DIR, { recursive: true });
    }

    const keypair = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });

    privateKey = keypair.privateKey;
    publicKey = keypair.publicKey;

    fs.writeFileSync(PRIVATE_KEY_PATH, privateKey, { mode: 0o600 });
    fs.writeFileSync(PUBLIC_KEY_PATH, publicKey, { mode: 0o644 });
    console.log('[cryptoAuth] Generated fresh RSA 2048 keypair in config/keys');
  } catch (err) {
    console.error('[cryptoAuth] Key initialization warning:', err.message);
  }
}

loadOrGenerateKeys();

export function getPublicKey() {
  // In cluster mode or after disk writes, ensure latest key is loaded
  if (!publicKey || !privateKey) {
    loadOrGenerateKeys();
  }
  return publicKey;
}

export function decryptPassword(str) {
  if (!str || typeof str !== 'string') return str;

  let ciphertextBase64 = null;
  if (str.startsWith('ENC:')) {
    ciphertextBase64 = str.slice(4).trim();
  } else if (str.startsWith('RSA:')) {
    ciphertextBase64 = str.slice(4).trim();
  } else if (/^[A-Za-z0-9+/=\s]{340,360}$/.test(str.trim())) {
    ciphertextBase64 = str.trim();
  }

  if (!ciphertextBase64) {
    return str;
  }

  try {
    // Reload keys if missing
    if (!privateKey) {
      loadOrGenerateKeys();
    }

    if (!privateKey) {
      console.error('[cryptoAuth] Private key not loaded, cannot decrypt password');
      return str;
    }

    // Normalize base64: replace spaces with + in case of URL decoding issues
    const normalizedB64 = ciphertextBase64.replace(/ /g, '+');
    const buffer = Buffer.from(normalizedB64, 'base64');

    // Attempt decryption with SHA-256 OAEP first (preferred)
    try {
      const decrypted = crypto.privateDecrypt(
        {
          key: privateKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha256',
        },
        buffer
      );
      return decrypted.toString('utf8');
    } catch (sha256Err) {
      // Fallback: try SHA-1 OAEP (common default in many client-side crypto libraries like WebCrypto / forge)
      try {
        const decryptedSha1 = crypto.privateDecrypt(
          {
            key: privateKey,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: 'sha1',
          },
          buffer
        );
        return decryptedSha1.toString('utf8');
      } catch (sha1Err) {
        // Log both errors for debugging
        console.error(
          `[cryptoAuth] Decryption failed with both SHA-256 (${sha256Err.message}) and SHA-1 (${sha1Err.message}). Check RSA keypair alignment between client and server.`
        );
        return str;
      }
    }
  } catch (err) {
    console.error('[cryptoAuth] Decryption unexpected error:', err.message);
    return str;
  }
}
