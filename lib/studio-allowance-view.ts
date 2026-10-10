import { z } from 'zod';

export const studioAllowanceViewSchema = z.object({
  state: z.enum(['simulation', 'unapproved', 'available', 'expired', 'exhausted', 'unavailable']),
  remainingRequests: z.number().int().min(0).max(100),
  maxRequests: z.number().int().min(1).max(100).nullable(),
  usedRequests: z.number().int().min(0).max(100).nullable(),
  expiresAt: z.string().datetime().nullable(),
}).strict().superRefine((value, ctx) => {
  const hasApproval = ['available', 'expired', 'exhausted'].includes(value.state);
  if (!hasApproval) {
    if (value.remainingRequests !== 0 || value.maxRequests !== null || value.usedRequests !== null || value.expiresAt !== null) ctx.addIssue({ code: 'custom', message: 'Invalid allowance view.' });
  } else if (value.maxRequests === null || value.usedRequests === null || value.expiresAt === null || value.usedRequests > value.maxRequests
    || (value.state === 'available' ? value.remainingRequests !== value.maxRequests - value.usedRequests || value.remainingRequests === 0 : value.remainingRequests !== 0)
    || (value.state === 'exhausted' && value.usedRequests !== value.maxRequests)) ctx.addIssue({ code: 'custom', message: 'Invalid allowance view.' });
});
export type StudioAllowanceView = z.infer<typeof studioAllowanceViewSchema>;
export const emptyStudioAllowance = (state: 'simulation' | 'unapproved' | 'unavailable'): StudioAllowanceView => ({
  state, remainingRequests: 0, maxRequests: null, usedRequests: null, expiresAt: null,
});
