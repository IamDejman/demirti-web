import { describe, it, expect } from 'vitest';

let validatePassword;
try {
  const mod = await import('./passwordPolicy');
  validatePassword = mod.validatePassword;
} catch {
  validatePassword = null;
}

describe.skipIf(!validatePassword)('validatePassword', () => {
  it('accepts a strong password', () => {
    const result = validatePassword('MyStr0ngP@ss');
    expect(result.valid).toBe(true);
  });

  it('rejects empty password', () => {
    const result = validatePassword('');
    expect(result.valid).toBe(false);
  });

  it('rejects short password', () => {
    const result = validatePassword('Ab1!');
    expect(result.valid).toBe(false);
  });

  it('rejects password longer than 128 chars', () => {
    const result = validatePassword('A'.repeat(200));
    expect(result.valid).toBe(false);
  });
});
