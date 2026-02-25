import { describe, it, expect } from 'vitest';
import {
  base32Encode,
  base32Decode,
  generateTotpSecret,
  generateTotp,
  verifyTotp,
  generateTotpUri,
} from './mfa';

describe('base32 encode/decode', () => {
  it('roundtrips arbitrary bytes', () => {
    const buf = Buffer.from([0x48, 0x65, 0x6c, 0x6c, 0x6f]); // "Hello"
    const encoded = base32Encode(buf);
    const decoded = base32Decode(encoded);
    expect(Buffer.compare(decoded, buf)).toBe(0);
  });

  it('roundtrips a 20-byte secret', () => {
    const buf = Buffer.alloc(20);
    for (let i = 0; i < 20; i++) buf[i] = i * 13;
    const encoded = base32Encode(buf);
    const decoded = base32Decode(encoded);
    expect(Buffer.compare(decoded, buf)).toBe(0);
  });

  it('rejects invalid base32 characters', () => {
    expect(() => base32Decode('INVALID!CHAR')).toThrow('Invalid base32 character');
  });

  it('handles padding-stripped strings', () => {
    const encoded = base32Encode(Buffer.from([0xff]));
    const decoded = base32Decode(encoded);
    expect(decoded[0]).toBe(0xff);
  });
});

describe('generateTotpSecret', () => {
  it('returns a 32-char base32 string (20 bytes)', () => {
    const secret = generateTotpSecret();
    expect(typeof secret).toBe('string');
    expect(secret.length).toBe(32);
    // All characters should be valid base32
    expect(/^[A-Z2-7]+$/.test(secret)).toBe(true);
  });

  it('generates unique secrets', () => {
    const a = generateTotpSecret();
    const b = generateTotpSecret();
    expect(a).not.toBe(b);
  });
});

describe('generateTotp / verifyTotp', () => {
  const secret = generateTotpSecret();

  it('generates a 6-digit code', () => {
    const code = generateTotp(secret);
    expect(code).toMatch(/^\d{6}$/);
  });

  it('verifies a freshly generated code', () => {
    const code = generateTotp(secret);
    expect(verifyTotp(secret, code)).toBe(true);
  });

  it('rejects a wrong code', () => {
    expect(verifyTotp(secret, '000000')).toBe(false);
    expect(verifyTotp(secret, '999999')).toBe(false);
  });

  it('rejects null, undefined, and wrong-length codes', () => {
    expect(verifyTotp(secret, null)).toBe(false);
    expect(verifyTotp(secret, undefined)).toBe(false);
    expect(verifyTotp(secret, '12345')).toBe(false);
    expect(verifyTotp(secret, '1234567')).toBe(false);
    expect(verifyTotp(secret, '')).toBe(false);
  });

  it('accepts code from adjacent time step (±30s)', () => {
    // Code from 30 seconds ago should still verify (window = ±1)
    const pastCode = generateTotp(secret, Date.now() - 30_000);
    expect(verifyTotp(secret, pastCode)).toBe(true);

    const futureCode = generateTotp(secret, Date.now() + 30_000);
    expect(verifyTotp(secret, futureCode)).toBe(true);
  });

  it('rejects code from too-far time step (±90s)', () => {
    const farPast = generateTotp(secret, Date.now() - 90_000);
    expect(verifyTotp(secret, farPast)).toBe(false);

    const farFuture = generateTotp(secret, Date.now() + 90_000);
    expect(verifyTotp(secret, farFuture)).toBe(false);
  });

  it('produces deterministic codes for the same secret and time', () => {
    const t = 1700000000000;
    const code1 = generateTotp(secret, t);
    const code2 = generateTotp(secret, t);
    expect(code1).toBe(code2);
  });
});

describe('generateTotpUri', () => {
  it('produces a valid otpauth URI', () => {
    const secret = 'JBSWY3DPEHPK3PXP';
    const uri = generateTotpUri(secret, 'user@example.com');
    expect(uri).toMatch(/^otpauth:\/\/totp\//);
    expect(uri).toContain(`secret=${secret}`);
    expect(uri).toContain('issuer=CVERSE%20Admin');
    expect(uri).toContain('user%40example.com');
    expect(uri).toContain('algorithm=SHA1');
    expect(uri).toContain('digits=6');
    expect(uri).toContain('period=30');
  });

  it('uses custom issuer when provided', () => {
    const uri = generateTotpUri('JBSWY3DPEHPK3PXP', 'a@b.com', 'MyApp');
    expect(uri).toContain('issuer=MyApp');
    expect(uri).toContain('MyApp:');
  });
});
