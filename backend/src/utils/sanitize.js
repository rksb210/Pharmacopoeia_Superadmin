/**
 * Data Sanitization & Output Encoding Utilities
 * Prevents Stored & Reflected Cross-Site Scripting (XSS) across all contexts
 */

const HTML_ENTITY_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#96;',
};

/**
 * Escapes characters that have special meaning in HTML contexts.
 * @param {string} str
 * @returns {string}
 */
export const escapeHtml = (str) => {
  if (typeof str !== 'string') return str;
  return str.replace(/[&<>"'`/]/g, (match) => HTML_ENTITY_MAP[match] || match);
};

/**
 * Validates APAAR ID format strictly against the 12-digit allow-list regex.
 * Format can be:
 * - 12 contiguous digits: ^\d{12}$ (e.g. "123456789012")
 * - 4-4-4 formatted: ^\d{4}-\d{4}-\d{4}$ (e.g. "1234-5678-9012")
 *
 * @param {string} rawApaar
 * @returns {{ isValid: boolean, cleanApaar: string|null, error: string|null }}
 */
export const validateApaarId = (rawApaar) => {
  if (!rawApaar || typeof rawApaar !== 'string') {
    return {
      isValid: false,
      cleanApaar: null,
      error: 'APAAR ID is required',
    };
  }

  const trimmed = rawApaar.trim();

  // Explicitly detect and reject HTML/script tags or angle brackets
  if (/[<>&"'/`\\]/.test(trimmed)) {
    return {
      isValid: false,
      cleanApaar: null,
      error: 'Invalid APAAR ID format. HTML tags and special characters are not permitted.',
    };
  }

  // Strip hyphens and spaces to check core 12-digit payload
  const digitsOnly = trimmed.replace(/[-\s]/g, '');

  if (!/^\d{12}$/.test(digitsOnly)) {
    return {
      isValid: false,
      cleanApaar: null,
      error: 'Invalid APAAR ID format. APAAR ID must be exactly 12 digits (e.g. 1234-5678-9012 or 123456789012).',
    };
  }

  // Reject dummy/repetitive sequences
  const blacklisted = [
    '000000000000',
    '111111111111',
    '222222222222',
    '333333333333',
    '444444444444',
    '555555555555',
    '666666666666',
    '777777777777',
    '888888888888',
    '999999999999',
    '123456789012', // Known dummy test sequence
  ];

  if (blacklisted.includes(digitsOnly)) {
    return {
      isValid: false,
      cleanApaar: null,
      error: 'Invalid APAAR ID format. Generic or dummy test sequences are rejected.',
    };
  }

  // Return canonical formatted 12-digit APAAR (XXXX-XXXX-XXXX)
  const canonical = `${digitsOnly.slice(0, 4)}-${digitsOnly.slice(4, 8)}-${digitsOnly.slice(8, 12)}`;

  return {
    isValid: true,
    digits: digitsOnly,
    cleanApaar: canonical,
    error: null,
  };
};

/**
 * Sanitizes an object of dynamic fields by trimming and HTML-escaping string values.
 * @param {Object} fields
 * @returns {Object}
 */
export const sanitizeDynamicFields = (fields = {}) => {
  if (!fields || typeof fields !== 'object' || Array.isArray(fields)) return {};

  const sanitized = {};
  for (const [key, value] of Object.entries(fields)) {
    if (typeof value === 'string') {
      sanitized[key] = escapeHtml(value.trim());
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};
