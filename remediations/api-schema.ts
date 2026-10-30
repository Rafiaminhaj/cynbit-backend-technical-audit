// remediations/api-schema.ts
// Robust Type-Safe Schema Validation & RFC 7807 Error Handling

import { z } from 'zod';

export const ContactInquirySchema = z.object({
  fullName: z
    .string()
    .min(2, { message: 'Full name must contain at least 2 characters.' })
    .max(100, { message: 'Full name cannot exceed 100 characters.' })
    .regex(/^[a-zA-Z\s.'-]+$/, { message: 'Name contains invalid characters.' }),
  
  email: z
    .string()
    .email({ message: 'A valid email address is required.' })
    .toLowerCase()
    .trim(),
  
  company: z
    .string()
    .min(1, { message: 'Company name is required.' })
    .max(120),
  
  industry: z
    .string()
    .min(2, { message: 'Industry selection is required.' }),
  
  message: z
    .string()
    .max(2000, { message: 'Message cannot exceed 2000 characters.' })
    .optional()
});

export type ContactInquiryInput = z.infer<typeof ContactInquirySchema>;

// Standardized RFC 7807 Problem Details Handler
export function formatValidationErrorResponse(error: z.ZodError) {
  const invalidParams = error.errors.map(err => ({
    name: err.path.join('.'),
    reason: err.message
  }));

  return {
    type: 'https://cynbit.in/errors/validation-failed',
    title: 'Unprocessable Entity',
    status: 422,
    detail: 'The submitted request payload failed validation constraints.',
    invalidParams
  };
}
