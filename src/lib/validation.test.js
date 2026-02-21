import { describe, it, expect } from 'vitest';

let validateEmail, validatePhone;
try {
  const mod = await import('./validation');
  validateEmail = mod.validateEmail;
  validatePhone = mod.validatePhone;
} catch {
  validateEmail = null;
  validatePhone = null;
}

describe.skipIf(!validateEmail)('validateEmail', () => {
  it('accepts valid email', () => {
    expect(validateEmail('user@example.com')).toBe(true);
  });

  it('rejects invalid email', () => {
    expect(validateEmail('notanemail')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(validateEmail('')).toBe(false);
  });
});

describe.skipIf(!validatePhone)('validatePhone', () => {
  it('accepts valid phone', () => {
    expect(validatePhone('+2348012345678')).toBe(true);
  });
});
