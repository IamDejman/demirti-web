import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger, reportError } from './logger';

describe('logger', () => {
  let consoleSpy;

  beforeEach(() => {
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('logger.info outputs message', () => {
    logger.info('test message');
    expect(consoleSpy.log).toHaveBeenCalledWith(expect.stringContaining('test message'));
  });

  it('logger.warn outputs message', () => {
    logger.warn('warning');
    expect(consoleSpy.warn).toHaveBeenCalledWith(expect.stringContaining('warning'));
  });

  it('logger.error outputs message', () => {
    logger.error('error');
    expect(consoleSpy.error).toHaveBeenCalledWith(expect.stringContaining('error'));
  });

  it('reportError does not leak PII in context', () => {
    reportError(new Error('fail'), { email: 'secret@test.com', token: 'abc' });
    const call = consoleSpy.error.mock.calls[0][0];
    expect(call).not.toContain('secret@test.com');
    expect(call).not.toContain('abc');
  });
});
