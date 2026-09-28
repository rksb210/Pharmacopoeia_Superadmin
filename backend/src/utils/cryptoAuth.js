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
  if (!publicKey) loadOrGenerateKeys();
  return publicKey;
}

export function decryptPassword(str) {
  if (!str || typeof str !== 'string') return str;

  let ciphertextBase64 = null;
  if (str.startsWith('ENC:')) {
    ciphertextBase64 = str.slice(4).trim();
  } else if (str.startsWith('RSA:')) {
    ciphertextBase64 = str.slice(4).trim();
  } else if (/^[A-Za-z0-9+/=]{340,344}$/.test(str.trim())) {
    ciphertextBase64 = str.trim();
  }

  if (!ciphertextBase64) {
    return str;
  }

  try {
    if (!privateKey) loadOrGenerateKeys();
    const buffer = Buffer.from(ciphertextBase64, 'base64');
    const decrypted = crypto.privateDecrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      buffer
    );
    return decrypted.toString('utf8');
  } catch (err) {
    console.error('[cryptoAuth] Decryption failed:', err.message);
    return str;
  }
}
