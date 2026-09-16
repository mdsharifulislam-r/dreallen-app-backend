import { z } from 'zod';
import { SUPPORT_STATUS } from './support.constant';

const createSupportZodSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Full name is required' }).min(1, 'Full name cannot be empty'),
    email: z.string({ required_error: 'Email is required' }).email('Invalid email address'),
    subject: z.string({ required_error: 'Subject is required' }).min(1, 'Subject cannot be empty'),
    feedback: z.string({ required_error: 'Feedback is required' }).min(1, 'Feedback cannot be empty'),
  }),
});

const updateSupportStatusZodSchema = z.object({
  body: z.object({
    status: z.nativeEnum(SUPPORT_STATUS, {
      required_error: 'Status is required',
      invalid_type_error: 'Invalid status value',
    }),
  }),
});

export const SupportValidation = {
  createSupportZodSchema,
  updateSupportStatusZodSchema,
};
