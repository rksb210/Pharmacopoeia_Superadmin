/**
 * PII Masking Utilities (Backend)
 *
 * Provides standard privacy masking for sensitive personal identifiable information:
 * - Email addresses: divyansh.singh@intileo.com -> d******h@intileo.com
 * - Phone numbers: +91 9876543210 -> +91 ******3210
 * - Generic strings / IDs: MED-2024-042 -> M******42
 */

export function maskEmail(email) {
  if (!email || typeof email !== 'string') return '';
  const trimmed = email.trim();
  const atIndex = trimmed.indexOf('@');
  if (atIndex <= 1) return trimmed;

  const local = trimmed.slice(0, atIndex);
  const domain = trimmed.slice(atIndex);

  if (local.length <= 2) {
    return `${local[0]}*${domain}`;
  }

  const firstChar = local[0];
  const lastChar = local[local.length - 1];
  const maskLen = Math.min(local.length - 2, 6);
  return `${firstChar}${'*'.repeat(maskLen)}${lastChar}${domain}`;
}

export function maskPhone(phone) {
  if (!phone || typeof phone !== 'string') return '';
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length < 4) return trimmed;
  const last4 = digits.slice(-4);
  const isIndian12 = digits.length === 12 && digits.startsWith('91');
  const hasPlus = trimmed.startsWith('+');
  let prefix = '';
  if (isIndian12 || hasPlus) {
    prefix = '+91 ';
  }
  return `${prefix}******${last4}`;
}

export function maskSensitiveIdentifier(str, visibleChars = 2) {
  if (!str || typeof str !== 'string') return '';
  const trimmed = str.trim();
  if (trimmed.length <= visibleChars * 2) return trimmed;

  const start = trimmed.slice(0, visibleChars);
  const end = trimmed.slice(-visibleChars);
  return `${start}******${end}`;
}
