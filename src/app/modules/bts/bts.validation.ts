import { z } from 'zod';

const createBtsZodSchema = z.object({
    body: z.object({
        title: z.string({ required_error: 'Title is required' }).min(1, 'Title cannot be empty'),
        description: z.string({ required_error: 'Description is required' }).min(1, 'Description cannot be empty'),
    }),
});

const updateBtsZodSchema = z.object({
    body: z.object({
        title: z.string().optional(),
        description: z.string().optional(),
    }),
});

export const BtsValidations = {
    createBtsZodSchema,
    updateBtsZodSchema,
};
