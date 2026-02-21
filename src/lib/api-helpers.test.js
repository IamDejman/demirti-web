import { describe, it, expect } from 'vitest';
import { getClientIp, apiSuccess, apiError } from './api-helpers';

function mockRequest(headers = {}) {
  return {
    headers: {
      get(key) {
        return headers[key.toLowerCase()] ?? null;
      },
    },
  };
}

describe('getClientIp', () => {
  it('extracts first IP from x-forwarded-for', () => {
    const req = mockRequest({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8' });
    expect(getClientIp(req)).toBe('1.2.3.4');
  });

  it('returns single IP', () => {
    const req = mockRequest({ 'x-forwarded-for': '10.0.0.1' });
    expect(getClientIp(req)).toBe('10.0.0.1');
  });

  it('returns "unknown" when header is missing', () => {
    const req = mockRequest({});
    expect(getClientIp(req)).toBe('unknown');
  });

  it('returns "unknown" when header is empty', () => {
    const req = mockRequest({ 'x-forwarded-for': '' });
    expect(getClientIp(req)).toBe('unknown');
  });
});

describe('apiSuccess', () => {
  it('returns 200 JSON by default', async () => {
    const res = apiSuccess({ ok: true });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it('accepts custom status', async () => {
    const res = apiSuccess({ created: true }, 201);
    expect(res.status).toBe(201);
  });
});

describe('apiError', () => {
  it('returns error with status 400 by default', async () => {
    const res = apiError('Bad request');
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Bad request');
  });

  it('accepts custom status and extra fields', async () => {
    const res = apiError('Not found', 404, { code: 'NOT_FOUND' });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe('Not found');
    expect(body.code).toBe('NOT_FOUND');
  });
});
