import { describe, it, expect } from 'vitest';
import { isValidUuid } from './validation';

describe('isValidUuid', () => {
  it.each([
    'd9428888-122b-4d0e-83c8-1e5348036f1b',
    '  D9428888-122B-4D0E-83C8-1E5348036F1B  ',
  ])('accepts a UUID, including normalized input: %s', (value) => {
    expect(isValidUuid(value)).toBe(true);
  });

  it.each(['', 'not-a-uuid', 'd9428888-122b-4d0e-83c8-1e5348036f1z', null, undefined, 123])(
    'rejects invalid input: %s', (value) => {
      expect(isValidUuid(value)).toBe(false);
    },
  );
});
