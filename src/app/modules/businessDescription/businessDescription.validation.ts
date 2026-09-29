import { z } from 'zod';

const upsertBusinessDescriptionZodSchema = z.object({
  body: z.object({
    description: z.string({ required_error: 'Description is required' }).trim().min(1),
  }),
});

export const BusinessDescriptionValidation = {
  upsertBusinessDescriptionZodSchema,
};