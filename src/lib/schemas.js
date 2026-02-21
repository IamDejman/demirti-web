import { z } from 'zod';

const email = z.string().email().max(254).transform((v) => v.toLowerCase().trim());
const password = z.string().min(8).max(128);
const nonEmpty = z.string().min(1).max(1000);
const phone = z.string().min(6).max(30);
const optStr = z.string().max(2000).optional().or(z.literal(''));
const posInt = z.coerce.number().int().positive();
const safeId = z.coerce.number().int().positive();

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required').max(128),
  deviceInfo: z.any().optional(),
});

export const registerSchema = z.object({
  email,
  password,
  firstName: nonEmpty,
  lastName: nonEmpty,
  cohortId: posInt.optional(),
  referralCode: optStr,
  trackName: optStr,
});

export const forgotPasswordSchema = z.object({
  email,
});

export const resetPasswordSchema = z.object({
  email,
  otp: z.string().min(1).max(20),
  newPassword: password,
  confirmPassword: z.string().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: password,
  confirmPassword: z.string().optional(),
});

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1).optional(),
  newPassword: password,
  confirmPassword: z.string().optional(),
  });

export const chatMessageSchema = z.object({
  message: nonEmpty.transform((v) => v.trim()),
});

export const chatRoomSchema = z.object({
  type: z.enum(['dm', 'group']),
  email: email.optional(),
  otherUserId: posInt.optional(),
  name: optStr,
});

export const gradeSubmissionSchema = z.object({
  grade: z.coerce.number().min(0).max(100),
  feedback: optStr,
});

export const applicationSchema = z.object({
  firstName: nonEmpty,
  lastName: nonEmpty,
  email,
  phone,
  trackName: nonEmpty,
  paymentOption: z.string().default('paystack'),
  paymentReference: optStr.nullable(),
  amount: z.coerce.number().optional().nullable(),
  referralSource: optStr.nullable(),
  discountCode: optStr.nullable(),
});

export const trackConfigSchema = z.object({
  trackName: nonEmpty,
  coursePrice: z.coerce.number().int().min(0).optional(),
  scholarshipLimit: z.coerce.number().int().min(0).optional(),
  scholarshipDiscountPercentage: z.coerce.number().min(0).max(100).optional(),
  isActive: z.boolean().optional(),
});

export const adminCreateSchema = z.object({
  email,
  password,
  firstName: optStr,
  lastName: optStr,
});

export const portfolioProjectSchema = z.object({
  title: nonEmpty,
  description: optStr,
  projectUrl: z.string().url().optional().or(z.literal('')),
  imageUrl: z.string().url().optional().or(z.literal('')),
  tags: z.union([z.array(z.string()), z.string()]).optional(),
});

export const socialLinkSchema = z.object({
  platform: nonEmpty,
  url: z.string().url(),
});

export const announcementSchema = z.object({
  title: nonEmpty,
  content: nonEmpty,
  cohortId: posInt.optional().nullable(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
});

export const weekSchema = z.object({
  title: nonEmpty,
  description: optStr,
  weekNumber: posInt,
  isPublished: z.boolean().default(false),
});

export const assignmentSchema = z.object({
  title: nonEmpty,
  description: optStr,
  weekId: posInt,
  dueDate: z.string().optional(),
  maxScore: z.coerce.number().min(0).default(100),
  submissionType: z.enum(['text', 'url', 'file_upload', 'multiple']).default('text'),
});

export const idParam = safeId;

/**
 * Parse and validate a request body against a Zod schema.
 * Returns [data, null] on success or [null, NextResponse] on error.
 */
export async function validateBody(request, schema) {
  let body;
  try {
    body = await request.json();
  } catch {
    const { NextResponse } = await import('next/server');
    return [null, NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })];
  }
  const result = schema.safeParse(body);
  if (!result.success) {
    const { NextResponse } = await import('next/server');
    const issues = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
    return [null, NextResponse.json({ error: 'Validation error', details: issues }, { status: 400 })];
  }
  return [result.data, null];
}
