import { describe, it, expect } from 'vitest';
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  chatMessageSchema,
  chatRoomSchema,
  gradeSubmissionSchema,
  applicationSchema,
  trackConfigSchema,
  adminCreateSchema,
  portfolioProjectSchema,
  socialLinkSchema,
  announcementSchema,
  weekSchema,
  assignmentSchema,
} from './schemas';

describe('loginSchema', () => {
  it('accepts valid input', () => {
    const result = loginSchema.safeParse({ email: 'User@Test.COM', password: 'pass1234' });
    expect(result.success).toBe(true);
    expect(result.data.email).toBe('user@test.com');
  });

  it('rejects missing email', () => {
    const result = loginSchema.safeParse({ password: 'pass1234' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email', () => {
    const result = loginSchema.safeParse({ email: 'notanemail', password: 'pass1234' });
    expect(result.success).toBe(false);
  });

  it('rejects empty password', () => {
    const result = loginSchema.safeParse({ email: 'a@b.com', password: '' });
    expect(result.success).toBe(false);
  });
});

describe('registerSchema', () => {
  it('accepts valid input', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      password: 'StrongP@ss1',
      firstName: 'Jane',
      lastName: 'Doe',
    });
    expect(result.success).toBe(true);
  });

  it('rejects short password', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      password: 'short',
      firstName: 'Jane',
      lastName: 'Doe',
    });
    expect(result.success).toBe(false);
  });

  it('normalizes email to lowercase', () => {
    const result = registerSchema.safeParse({
      email: 'Admin@Test.COM',
      password: 'ValidPass1',
      firstName: 'A',
      lastName: 'B',
    });
    expect(result.success).toBe(true);
    expect(result.data.email).toBe('admin@test.com');
  });
});

describe('forgotPasswordSchema', () => {
  it('accepts valid email', () => {
    const result = forgotPasswordSchema.safeParse({ email: 'a@b.com' });
    expect(result.success).toBe(true);
  });

  it('rejects missing email', () => {
    const result = forgotPasswordSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('resetPasswordSchema', () => {
  it('accepts valid input', () => {
    const result = resetPasswordSchema.safeParse({
      email: 'a@b.com',
      otp: '123456',
      newPassword: 'NewPassword1',
    });
    expect(result.success).toBe(true);
  });

  it('rejects short new password', () => {
    const result = resetPasswordSchema.safeParse({
      email: 'a@b.com',
      otp: '123456',
      newPassword: 'short',
    });
    expect(result.success).toBe(false);
  });
});

describe('changePasswordSchema', () => {
  it('accepts valid input', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'OldPass1',
      newPassword: 'NewPass12',
    });
    expect(result.success).toBe(true);
  });
});

describe('chatMessageSchema', () => {
  it('trims and accepts valid message', () => {
    const result = chatMessageSchema.safeParse({ message: '  Hello world  ' });
    expect(result.success).toBe(true);
    expect(result.data.message).toBe('Hello world');
  });

  it('rejects empty message', () => {
    const result = chatMessageSchema.safeParse({ message: '' });
    expect(result.success).toBe(false);
  });
});

describe('chatRoomSchema', () => {
  it('accepts DM with email', () => {
    const result = chatRoomSchema.safeParse({ type: 'dm', email: 'x@y.com' });
    expect(result.success).toBe(true);
  });

  it('accepts DM with userId', () => {
    const result = chatRoomSchema.safeParse({ type: 'dm', otherUserId: 5 });
    expect(result.success).toBe(true);
  });

  it('rejects invalid type', () => {
    const result = chatRoomSchema.safeParse({ type: 'channel' });
    expect(result.success).toBe(false);
  });
});

describe('gradeSubmissionSchema', () => {
  it('accepts valid grade', () => {
    const result = gradeSubmissionSchema.safeParse({ grade: 85 });
    expect(result.success).toBe(true);
  });

  it('rejects grade over 100', () => {
    const result = gradeSubmissionSchema.safeParse({ grade: 150 });
    expect(result.success).toBe(false);
  });

  it('rejects negative grade', () => {
    const result = gradeSubmissionSchema.safeParse({ grade: -5 });
    expect(result.success).toBe(false);
  });

  it('coerces string grade', () => {
    const result = gradeSubmissionSchema.safeParse({ grade: '75' });
    expect(result.success).toBe(true);
    expect(result.data.grade).toBe(75);
  });
});

describe('applicationSchema', () => {
  it('accepts valid application', () => {
    const result = applicationSchema.safeParse({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '+2348012345678',
      trackName: 'Frontend Development',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing required fields', () => {
    const result = applicationSchema.safeParse({ firstName: 'John' });
    expect(result.success).toBe(false);
  });
});

describe('trackConfigSchema', () => {
  it('accepts valid config', () => {
    const result = trackConfigSchema.safeParse({
      trackName: 'Frontend',
      coursePrice: 150000,
      scholarshipLimit: 10,
      scholarshipDiscountPercentage: 50,
      isActive: true,
    });
    expect(result.success).toBe(true);
  });

  it('rejects discount > 100', () => {
    const result = trackConfigSchema.safeParse({
      trackName: 'Frontend',
      scholarshipDiscountPercentage: 150,
    });
    expect(result.success).toBe(false);
  });
});

describe('adminCreateSchema', () => {
  it('accepts valid admin', () => {
    const result = adminCreateSchema.safeParse({
      email: 'admin@test.com',
      password: 'AdminPass1',
    });
    expect(result.success).toBe(true);
  });
});

describe('portfolioProjectSchema', () => {
  it('accepts valid project', () => {
    const result = portfolioProjectSchema.safeParse({
      title: 'My Project',
      projectUrl: 'https://example.com',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid URL', () => {
    const result = portfolioProjectSchema.safeParse({
      title: 'My Project',
      projectUrl: 'not-a-url',
    });
    expect(result.success).toBe(false);
  });
});

describe('socialLinkSchema', () => {
  it('accepts valid link', () => {
    const result = socialLinkSchema.safeParse({
      platform: 'GitHub',
      url: 'https://github.com/user',
    });
    expect(result.success).toBe(true);
  });
});

describe('announcementSchema', () => {
  it('accepts valid announcement', () => {
    const result = announcementSchema.safeParse({
      title: 'New Feature',
      content: 'We launched something cool',
    });
    expect(result.success).toBe(true);
    expect(result.data.priority).toBe('normal');
  });

  it('accepts custom priority', () => {
    const result = announcementSchema.safeParse({
      title: 'Urgent',
      content: 'Read now',
      priority: 'urgent',
    });
    expect(result.success).toBe(true);
  });
});

describe('weekSchema', () => {
  it('accepts valid week', () => {
    const result = weekSchema.safeParse({
      title: 'Week 1',
      weekNumber: 1,
    });
    expect(result.success).toBe(true);
  });
});

describe('assignmentSchema', () => {
  it('accepts valid assignment', () => {
    const result = assignmentSchema.safeParse({
      title: 'Build a TODO app',
      weekId: 1,
    });
    expect(result.success).toBe(true);
    expect(result.data.maxScore).toBe(100);
  });
});
