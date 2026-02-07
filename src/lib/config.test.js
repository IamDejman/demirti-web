import { describe, it, expect } from 'vitest';
import { DEFAULT_SPONSORED_COHORT, APPLICATION_DEFAULTS } from './config';

describe('config', () => {
  it('exports DEFAULT_SPONSORED_COHORT', () => {
    expect(DEFAULT_SPONSORED_COHORT).toBeDefined();
    expect(typeof DEFAULT_SPONSORED_COHORT).toBe('string');
    expect(DEFAULT_SPONSORED_COHORT.length).toBeGreaterThan(0);
  });

  it('exports APPLICATION_DEFAULTS with expected structure', () => {
    expect(APPLICATION_DEFAULTS).toHaveProperty('coursePrice');
    expect(APPLICATION_DEFAULTS).toHaveProperty('discountPercentage');
    expect(APPLICATION_DEFAULTS).toHaveProperty('scholarshipLimit');
    expect(APPLICATION_DEFAULTS.coursePrice).toBe(150000);
    expect(APPLICATION_DEFAULTS.discountPercentage).toBe(50);
  });
});
