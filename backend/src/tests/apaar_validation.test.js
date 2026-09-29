import test from 'node:test';
import assert from 'node:assert/strict';

import {
  escapeHtml,
  validateApaarId,
  sanitizeDynamicFields,
} from '../utils/sanitize.js';

import { verificationService } from '../services/verification.service.js';
import {
  validateInitiateSignup,
  validateSignup,
} from '../validators/auth.validator.js';
import {
  validateCreateSubscriber,
  validateUpdateSubscriber,
} from '../validators/subscriber.validator.js';

test('1. Core APAAR ID Format & Injection Validation (validateApaarId)', async (t) => {
  await t.test('strictly rejects HTML and script injections (Stored/Reflected XSS vectors)', () => {
    const maliciousPayloads = [
      '<h1>sadsadsa</h1>',
      '<script>alert(1)</script>',
      '"><img src=x onerror=alert(1)>',
      '<svg/onload=alert(document.cookie)>',
      'javascript:alert(1)',
      '1234<script>5678</script>9012',
      '9876" onmouseover="alert(1)"',
      "9876' OR '1'='1",
      '`curl evil.com`',
    ];

    for (const payload of maliciousPayloads) {
      const res = validateApaarId(payload);
      assert.equal(res.isValid, false, `Should reject payload: ${payload}`);
      assert.match(res.error, /HTML tags|Invalid APAAR ID format/i);
    }
  });

  await t.test('accepts valid 12-digit contiguous numbers and formats to canonical XXXX-XXXX-XXXX', () => {
    const res = validateApaarId('987654321098');
    assert.equal(res.isValid, true);
    assert.equal(res.cleanApaar, '9876-5432-1098');
    assert.equal(res.digits, '987654321098');
    assert.equal(res.error, null);
  });

  await t.test('accepts valid hyphenated 12-digit APAAR ID', () => {
    const res = validateApaarId('9876-5432-1098');
    assert.equal(res.isValid, true);
    assert.equal(res.cleanApaar, '9876-5432-1098');
    assert.equal(res.digits, '987654321098');
  });

  await t.test('accepts valid space-separated 12-digit APAAR ID', () => {
    const res = validateApaarId('9876 5432 1098');
    assert.equal(res.isValid, true);
    assert.equal(res.cleanApaar, '9876-5432-1098');
    assert.equal(res.digits, '987654321098');
  });

  await t.test('rejects numbers with incorrect lengths', () => {
    const invalidLengths = ['123', '12345678901', '1234567890123', ''];
    for (const id of invalidLengths) {
      const res = validateApaarId(id);
      assert.equal(res.isValid, false, `Should reject length for: ${id}`);
    }
  });

  await t.test('rejects repetitive and dummy test sequences', () => {
    const dummyIds = [
      '000000000000',
      '111111111111',
      '999999999999',
      '123456789012',
      '0000-0000-0000',
    ];
    for (const dummy of dummyIds) {
      const res = validateApaarId(dummy);
      assert.equal(res.isValid, false, `Should reject dummy APAAR: ${dummy}`);
      assert.match(res.error, /dummy|generic/i);
    }
  });

  await t.test('rejects non-string or missing inputs', () => {
    assert.equal(validateApaarId(null).isValid, false);
    assert.equal(validateApaarId(undefined).isValid, false);
    assert.equal(validateApaarId(123456789012).isValid, false);
    assert.equal(validateApaarId({}).isValid, false);
  });
});

test('2. HTML Sanitization & Dynamic Fields Output Encoding (escapeHtml & sanitizeDynamicFields)', async (t) => {
  await t.test('escapeHtml encodes special HTML characters to prevent XSS', () => {
    const raw = '<script>alert("XSS & \'attack\' / test`")</script>';
    const escaped = escapeHtml(raw);
    assert.equal(escaped.includes('<script>'), false);
    assert.equal(escaped.includes('</script>'), false);
    assert.equal(escaped.includes('&lt;script&gt;'), true);
    assert.equal(escaped.includes('&amp;'), true);
    assert.equal(escaped.includes('&quot;'), true);
    assert.equal(escaped.includes('&#x27;'), true);
    assert.equal(escaped.includes('&#x2F;'), true);
    assert.equal(escaped.includes('&#96;'), true);
  });

  await t.test('sanitizeDynamicFields recursively sanitizes and trims string fields', () => {
    const payload = {
      apaarId: ' 9876-5432-1098 ',
      institution: '  <b>AIIMS</b> New Delhi  ',
      notes: '<script>alert(1)</script>',
      semester: 4,
      isHosteller: true,
    };

    const sanitized = sanitizeDynamicFields(payload);
    assert.equal(sanitized.apaarId, '9876-5432-1098');
    assert.equal(sanitized.institution, '&lt;b&gt;AIIMS&lt;&#x2F;b&gt; New Delhi');
    assert.equal(sanitized.notes, '&lt;script&gt;alert(1)&lt;&#x2F;script&gt;');
    assert.equal(sanitized.semester, 4);
    assert.equal(sanitized.isHosteller, true);
  });
});

test('3. Authoritative APAAR / Edu-Account Verification Service', async (t) => {
  await t.test('valid 12-digit APAAR ID passes authoritative verification', async () => {
    const res = await verificationService.verifyCredentials('STUDENT', {
      apaarId: '9876-5432-1098',
    });

    assert.equal(res.verified, true);
    assert.equal(res.status, 'VERIFIED');
    assert.match(res.authoritativeSource, /Automated Permanent Academic Account Registry/i);
    assert.equal(res.registrationNo, '9876-5432-1098');
    assert.notEqual(res.verifiedAt, null);
  });

  await t.test('HTML injection in APAAR ID fails verification and is rejected', async () => {
    const res = await verificationService.verifyCredentials('STUDENT', {
      apaarId: '<h1>sadsadsa</h1>',
    });

    assert.equal(res.verified, false);
    assert.equal(res.status, 'REJECTED');
    assert.equal(res.verifiedAt, null);
    assert.match(res.remarks, /Invalid APAAR ID format/i);
  });
});

test('4. Auth Validator Endpoint Gateways (HTTP 400 Enforcement)', async (t) => {
  const createMockReqRes = (body) => {
    const req = { body };
    let responseStatus = null;
    let responseJson = null;
    const res = {
      status: (code) => {
        responseStatus = code;
        return res;
      },
      json: (data) => {
        responseJson = data;
        return res;
      },
    };
    let nextCalled = false;
    const next = () => {
      nextCalled = true;
    };
    return { req, res, next, getResult: () => ({ responseStatus, responseJson, nextCalled }) };
  };

  await t.test('validateInitiateSignup rejects <h1>sadsadsa</h1> injection in student apaarId with HTTP 400', () => {
    const { req, res, next, getResult } = createMockReqRes({
      name: 'Test Student',
      email: 'student@example.com',
      username: 'teststudent',
      userType: 'STUDENT',
      dynamicFields: {
        apaarId: '<h1>sadsadsa</h1>',
      },
    });

    validateInitiateSignup(req, res, next);
    const { responseStatus, responseJson, nextCalled } = getResult();

    assert.equal(nextCalled, false);
    assert.equal(responseStatus, 400);
    assert.equal(responseJson.success, false);
    const combinedErrors = [responseJson.message, ...(responseJson.errors || [])].join(' ');
    assert.match(combinedErrors, /HTML tags and special characters are not permitted|Invalid APAAR ID/i);
  });

  await t.test('validateInitiateSignup accepts valid 12-digit apaarId', () => {
    const { req, res, next, getResult } = createMockReqRes({
      name: 'Test Student',
      email: 'student@example.com',
      username: 'teststudent',
      userType: 'STUDENT',
      dynamicFields: {
        apaarId: '9876-5432-1098',
      },
    });

    validateInitiateSignup(req, res, next);
    const { responseStatus, nextCalled } = getResult();

    assert.equal(nextCalled, true);
    assert.equal(responseStatus, null);
  });

  await t.test('validateSignup rejects <h1>sadsadsa</h1> injection with HTTP 400', () => {
    const { req, res, next, getResult } = createMockReqRes({
      name: 'Test Student',
      email: 'student@example.com',
      username: 'teststudent',
      password: 'StrongPassword123!',
      userType: 'STUDENT',
      dynamicFields: {
        apaarId: '<h1>sadsadsa</h1>',
      },
    });

    validateSignup(req, res, next);
    const { responseStatus, responseJson, nextCalled } = getResult();

    assert.equal(nextCalled, false);
    assert.equal(responseStatus, 400);
    assert.equal(responseJson.success, false);
    const combinedErrors = [responseJson.message, ...(responseJson.errors || [])].join(' ');
    assert.match(combinedErrors, /HTML tags and special characters are not permitted|Invalid APAAR ID/i);
  });

  await t.test('validateSignup accepts valid 12-digit apaarId', () => {
    const { req, res, next, getResult } = createMockReqRes({
      name: 'Test Student',
      email: 'student@example.com',
      username: 'teststudent',
      password: 'StrongPassword123!',
      userType: 'STUDENT',
      dynamicFields: {
        apaarId: '9876-5432-1098',
      },
    });

    validateSignup(req, res, next);
    const { responseStatus, nextCalled } = getResult();

    assert.equal(nextCalled, true);
    assert.equal(responseStatus, null);
  });
});

test('5. Subscriber Validator Endpoint Gateways (Admin Panel HTTP 400 Enforcement)', async (t) => {
  const createMockReqRes = (body) => {
    const req = { body, params: { id: '60c72b2f9b1d8b2bad000001' } };
    let responseStatus = null;
    let responseJson = null;
    const res = {
      status: (code) => {
        responseStatus = code;
        return res;
      },
      json: (data) => {
        responseJson = data;
        return res;
      },
    };
    let nextCalled = false;
    const next = () => {
      nextCalled = true;
    };
    return { req, res, next, getResult: () => ({ responseStatus, responseJson, nextCalled }) };
  };

  await t.test('validateCreateSubscriber rejects HTML in student apaarId with HTTP 400', () => {
    const { req, res, next, getResult } = createMockReqRes({
      name: 'Test Student',
      email: 'student@example.com',
      username: 'teststudent',
      password: 'Password123!',
      userType: 'STUDENT',
      dynamicFields: {
        apaarId: '<script>alert(1)</script>',
      },
    });

    validateCreateSubscriber(req, res, next);
    const { responseStatus, responseJson, nextCalled } = getResult();

    assert.equal(nextCalled, false);
    assert.equal(responseStatus, 400);
    const combinedErrors = [responseJson.message, ...(responseJson.errors || [])].join(' ');
    assert.match(combinedErrors, /HTML tags and special characters are not permitted|Invalid APAAR ID/i);
  });

  await t.test('validateUpdateSubscriber rejects HTML in apaarId with HTTP 400', () => {
    const { req, res, next, getResult } = createMockReqRes({
      userType: 'STUDENT',
      dynamicFields: {
        apaarId: '"><img src=x onerror=alert(1)>',
      },
    });

    validateUpdateSubscriber(req, res, next);
    const { responseStatus, responseJson, nextCalled } = getResult();

    assert.equal(nextCalled, false);
    assert.equal(responseStatus, 400);
    const combinedErrors = [responseJson.message, ...(responseJson.errors || [])].join(' ');
    assert.match(combinedErrors, /HTML tags and special characters are not permitted|Invalid APAAR ID/i);
  });
});
