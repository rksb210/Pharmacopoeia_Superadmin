/**
 * User Type Constants & Whitelist
 * Enforces server-side enum validation and privileged role classification.
 */

export const USER_TYPES = Object.freeze({
  STUDENT: 'STUDENT',
  DOCTOR: 'DOCTOR',
  PHARMACIST: 'PHARMACIST',
  NURSE: 'NURSE',
  INDUSTRY: 'INDUSTRY',
  UNIVERSITIES_COLLEGES: 'UNIVERSITIES_COLLEGES',
  OTHERS: 'OTHERS',
});

export const ALLOWED_USER_TYPES = Object.freeze(Object.values(USER_TYPES));

// Privileged healthcare professional roles requiring authoritative verification
export const PRIVILEGED_USER_TYPES = Object.freeze([
  USER_TYPES.DOCTOR,
  USER_TYPES.PHARMACIST,
  USER_TYPES.NURSE,
]);

export const VERIFICATION_STATUSES = Object.freeze({
  UNVERIFIED: 'UNVERIFIED',
  PENDING: 'PENDING',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
});

/**
 * Normalizes input user type and handles legacy/display variants.
 * @param {string} rawType
 * @returns {string|null} Normalized user type code or null if invalid
 */
export const normalizeUserType = (rawType) => {
  if (!rawType || typeof rawType !== 'string') return null;

  const normalized = rawType.toUpperCase().trim();
  if (normalized === 'UNIVERSITIES / COLLEGES' || normalized === 'UNIVERSITIES_COLLEGES') {
    return USER_TYPES.UNIVERSITIES_COLLEGES;
  }

  if (ALLOWED_USER_TYPES.includes(normalized)) {
    return normalized;
  }

  return null;
};

/**
 * Checks if a given user type is a privileged professional healthcare role.
 * @param {string} userType
 * @returns {boolean}
 */
export const isPrivilegedRole = (userType) => {
  const normalized = normalizeUserType(userType);
  return Boolean(normalized && PRIVILEGED_USER_TYPES.includes(normalized));
};
