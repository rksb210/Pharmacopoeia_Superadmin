import test from 'node:test';
import assert from 'node:assert/strict';

import {
  USER_TYPES,
  ALLOWED_USER_TYPES,
  PRIVILEGED_USER_TYPES,
  normalizeUserType,
  isPrivilegedRole,
  VERIFICATION_STATUSES,
} from '../constants/userTypes.js';

import { verificationService } from '../services/verification.service.js';
import {
  validateInitiateSignup,
  validateSignup,
} from '../validators/auth.validator.js';

test('1. Server-Side Enum Whitelisting and Normalization', async (t) => {
  await t.test('allows valid standard roles', () => {
    assert.equal(normalizeUserType('STUDENT'), USER_TYPES.STUDENT);
    assert.equal(normalizeUserType('student'), USER_TYPES.STUDENT);
    assert.equal(normalizeUserType('INDUSTRY'), USER_TYPES.INDUSTRY);
    assert.equal(normalizeUserType('OTHERS'), USER_TYPES.OTHERS);
  });

  await t.test('normalizes aliases for UNIVERSITIES_COLLEGES', () => {
    assert.equal(normalizeUserType('UNIVERSITIES / COLLEGES'), USER_TYPES.UNIVERSITIES_COLLEGES);
    assert.equal(normalizeUserType('UNIVERSITIES_COLLEGES'), USER_TYPES.UNIVERSITIES_COLLEGES);
  });

  await t.test('allows valid privileged roles', () => {
    assert.equal(normalizeUserType('DOCTOR'), USER_TYPES.DOCTOR);
    assert.equal(normalizeUserType('doctor'), USER_TYPES.DOCTOR);
    assert.equal(normalizeUserType('PHARMACIST'), USER_TYPES.PHARMACIST);
    assert.equal(normalizeUserType('NURSE'), USER_TYPES.NURSE);
  });

  await t.test('strictly rejects non-whitelisted and malicious userType values', () => {
    assert.equal(normalizeUserType('SUPERADMIN'), null);
    assert.equal(normalizeUserType('ADMIN'), null);
    assert.equal(normalizeUserType('ROOT'), null);
    assert.equal(normalizeUserType('DOCTOR_SPECIAL'), null);
    assert.equal(normalizeUserType(''), null);
    assert.equal(normalizeUserType(null), null);
    assert.equal(normalizeUserType(undefined), null);
    assert.equal(normalizeUserType({}), null);
  });

  await t.test('identifies privileged professional roles accurately', () => {
    assert.equal(isPrivilegedRole('DOCTOR'), true);
    assert.equal(isPrivilegedRole('doctor'), true);
    assert.equal(isPrivilegedRole('PHARMACIST'), true);
    assert.equal(isPrivilegedRole('NURSE'), true);

    assert.equal(isPrivilegedRole('STUDENT'), false);
    assert.equal(isPrivilegedRole('INDUSTRY'), false);
    assert.equal(isPrivilegedRole('OTHERS'), false);
    assert.equal(isPrivilegedRole('SUPERADMIN'), false);
  });
});

test('2. Authoritative Healthcare Professional Verification Service', async (t) => {
  await t.test('valid doctor credentials pass authoritative verification', async () => {
    const res = await verificationService.verifyCredentials('DOCTOR', {
      registrationNo: 'MCI-2023-89102',
      stateCouncil: 'Delhi Medical Council',
    });

    assert.equal(res.verified, true);
    assert.equal(res.status, VERIFICATION_STATUSES.VERIFIED);
    assert.equal(res.registrationNo, 'MCI-2023-89102');
    assert.match(res.authoritativeSource, /National Medical Commission/i);
    assert.ok(res.verifiedAt instanceof Date);
  });

  await t.test('fake or placeholder registration numbers are rejected', async () => {
    const placeholders = ['0000', '1234', 'FAKE', 'TEST', 'DUMMY'];
    for (const badReg of placeholders) {
      const res = await verificationService.verifyCredentials('DOCTOR', {
        registrationNo: badReg,
        stateCouncil: 'Delhi Medical Council',
      });

      assert.equal(res.verified, false, `Expected ${badReg} to fail verification`);
      assert.equal(res.status, VERIFICATION_STATUSES.REJECTED);
      assert.match(res.remarks, /Invalid registration number format/i);
    }
  });

  await t.test('missing registration number or council is rejected', async () => {
    const resMissingReg = await verificationService.verifyCredentials('DOCTOR', {
      stateCouncil: 'Delhi Medical Council',
    });
    assert.equal(resMissingReg.verified, false);
    assert.equal(resMissingReg.status, VERIFICATION_STATUSES.REJECTED);

    const resMissingCouncil = await verificationService.verifyCredentials('DOCTOR', {
      registrationNo: 'MCI-2023-89102',
    });
    assert.equal(resMissingCouncil.verified, false);
    assert.equal(resMissingCouncil.status, VERIFICATION_STATUSES.REJECTED);
  });

  await t.test('pharmacist and nurse authoritative verification check', async () => {
    const pharmRes = await verificationService.verifyCredentials('PHARMACIST', {
      registrationNo: 'PCI-DL-9841',
      stateCouncil: 'Delhi Pharmacy Council',
    });
    assert.equal(pharmRes.verified, true);
    assert.match(pharmRes.authoritativeSource, /Pharmacy Council of India/i);

    const nurseRes = await verificationService.verifyCredentials('NURSE', {
      registrationNo: 'INC-RN-4819',
      stateCouncil: 'Indian Nursing Council',
    });
    assert.equal(nurseRes.verified, true);
    assert.match(nurseRes.authoritativeSource, /Indian Nursing Council/i);
  });

  await t.test('non-privileged categories return unverified status', async () => {
    const res = await verificationService.verifyCredentials('INDUSTRY', {});
    assert.equal(res.verified, false);
    assert.equal(res.status, VERIFICATION_STATUSES.UNVERIFIED);
  });
});

test('3. Validator Guard Rails (Initiate Signup & Final Signup)', async (t) => {
  const createMockRes = () => {
    const res = {};
    res.statusCode = 200;
    res.body = null;
    res.status = (code) => {
      res.statusCode = code;
      return res;
    };
    res.json = (data) => {
      res.body = data;
      return res;
    };
    return res;
  };

  await t.test('validateInitiateSignup rejects invalid userType', () => {
    const req = { body: { userType: 'HACKER_ADMIN' } };
    const res = createMockRes();
    let nextCalled = false;

    validateInitiateSignup(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 400);
    assert.match(res.body.errors[0], /Invalid account category/i);
  });

  await t.test('validateInitiateSignup enforces required credentials for privileged roles', () => {
    const req = { body: { userType: 'DOCTOR', dynamicFields: {} } };
    const res = createMockRes();
    let nextCalled = false;

    validateInitiateSignup(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 400);
    assert.ok(res.body.errors.some((e) => e.includes('Registration Number is mandatory')));
    assert.ok(res.body.errors.some((e) => e.includes('State Council')));
  });

  await t.test('validateInitiateSignup succeeds for valid student intake', () => {
    const req = { body: { userType: 'STUDENT', dynamicFields: { apaarId: '9876-5432-1098' } } };
    const res = createMockRes();
    let nextCalled = false;

    validateInitiateSignup(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, true);
    assert.equal(req.body.userType, 'STUDENT');
  });

  await t.test('validateSignup blocks direct privileged role assignment without session token', () => {
    const req = {
      body: {
        name: 'John Doe',
        email: 'doctor@example.com',
        username: 'drjohn',
        password: 'Password123!',
        userType: 'DOCTOR', // Attempting direct unverified privileged signup
      },
      headers: {},
      cookies: {},
    };
    const res = createMockRes();
    let nextCalled = false;

    validateSignup(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 400);
    assert.ok(res.body.errors.some((e) => e.includes('Self-registration for privileged role')));
  });

  await t.test('validateSignup extracts session token and proceeds when valid', () => {
    const req = {
      body: {
        name: 'John Doe',
        email: 'student@example.com',
        username: 'johnstudent',
        password: 'Password123!',
        signupSessionToken: 'abcdef1234567890abcdef1234567890',
      },
      headers: {},
      cookies: {},
    };
    const res = createMockRes();
    let nextCalled = false;

    validateSignup(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, true);
    assert.equal(req.signupSessionToken, 'abcdef1234567890abcdef1234567890');
  });
});

test('4. Burp Suite Parameter Tampering Simulation & Privilege Escalation Defense', async (t) => {
  const createMockRes = () => {
    const res = {};
    res.statusCode = 200;
    res.body = null;
    res.cookies = {};
    res.status = (code) => {
      res.statusCode = code;
      return res;
    };
    res.json = (data) => {
      res.body = data;
      return res;
    };
    res.cookie = (name, val, opts) => {
      res.cookies[name] = { val, opts };
      return res;
    };
    return res;
  };

  await t.test('detects Burp Suite tampering (modifying STUDENT to Doctor) and blocks with HTTP 403', async () => {
    // Import SignupSession, auditService & signup controller
    const { signup } = await import('../controllers/auth.controller.js');
    const { SignupSession } = await import('../models/signupSession.model.js');
    const { auditService } = await import('../services/audit.service.js');

    const originalAuditLog = auditService.log;
    const auditLogs = [];
    auditService.log = async (req, entry) => {
      auditLogs.push(entry);
    };

    // Mock findOne on SignupSession to return an active student session
    const originalFindOne = SignupSession.findOne;
    SignupSession.findOne = () => ({
      sessionToken: 'valid_student_session_token_12345',
      userType: 'STUDENT',
      dynamicFields: { apaarId: 'EDU-9999' },
      isVerified: false,
      verificationStatus: 'UNVERIFIED',
      verificationDetails: {},
      isUsed: false,
      expiresAt: new Date(Date.now() + 100000),
      save: async () => {},
    });

    try {
      // Attacker sends request with signupSessionToken for STUDENT,
      // but tampers payload to "userType": "Doctor"
      const req = {
        body: {
          name: 'Attacker Test',
          email: 'attacker@example.com',
          username: 'attacker',
          password: 'Password123!',
          userType: 'Doctor', // TAMPERED VALUE IN BURP SUITE
          signupSessionToken: 'valid_student_session_token_12345',
        },
        headers: {},
        cookies: {},
        ip: '192.168.1.100',
        socket: {},
      };

      const res = createMockRes();
      let nextError = null;

      await signup(req, res, (err) => {
        nextError = err;
      });

      assert.equal(nextError, null);
      assert.equal(res.statusCode, 403);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /Parameter tampering detected/i);

      // Verify security alert audit log was emitted
      const tamperAlert = auditLogs.find((l) => l.action === 'SECURITY_ALERT_PARAMETER_TAMPERING');
      assert.ok(tamperAlert, 'Expected SECURITY_ALERT_PARAMETER_TAMPERING audit log');
      assert.equal(tamperAlert.status, 'WARNING');
      assert.match(tamperAlert.details, /Doctor/);
    } finally {
      SignupSession.findOne = originalFindOne;
      auditService.log = originalAuditLog;
    }
  });

  await t.test('blocks direct signup attempting to self-assign DOCTOR without session', async () => {
    const { signup } = await import('../controllers/auth.controller.js');
    const { auditService } = await import('../services/audit.service.js');

    const originalAuditLog = auditService.log;
    const auditLogs = [];
    auditService.log = async (req, entry) => {
      auditLogs.push(entry);
    };

    try {
      const req = {
        body: {
          name: 'Direct Attacker',
          email: 'attacker2@example.com',
          username: 'attacker2',
          password: 'Password123!',
          userType: 'DOCTOR', // Trying direct unverified privileged signup
        },
        headers: {},
        cookies: {},
        ip: '192.168.1.101',
        socket: {},
      };

      const res = createMockRes();
      let nextError = null;

      await signup(req, res, (err) => {
        nextError = err;
      });

      assert.equal(nextError, null);
      assert.equal(res.statusCode, 403);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /cannot be self-assigned without authoritative council verification/i);

      const bypassAlert = auditLogs.find((l) => l.action === 'SECURITY_ALERT_PRIVILEGE_BYPASS');
      assert.ok(bypassAlert, 'Expected SECURITY_ALERT_PRIVILEGE_BYPASS audit log');
    } finally {
      auditService.log = originalAuditLog;
    }
  });
});

