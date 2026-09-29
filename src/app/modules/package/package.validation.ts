import { z } from 'zod';

export const createPackageZodSchema = z.object({
  body: z.object({
  label: z
    .string({
      invalid_type_error: 'Label must be a string',
    })
    .min(1, 'Label cannot be empty'),
    productId: z.string({required_error: 'Product id is required'}),
    referenceId: z.string({required_error: 'Reference id is required'}),
    features:z.array(z.string()).min(1, 'At least one feature is required'),
    recommended: z.boolean({required_error: 'Recommended is required'}).optional(),
    price: z.number({required_error: 'Price is required'}),
    recurring: z.enum(['monthly', 'yearly', 'buisness'], {required_error: 'Recurring is required'}),
}),
});

const updatePackageZodSchema = z.object({
  body: z.object({
  label: z
    .string({
      invalid_type_error: 'Label must be a string',
    })
    .min(1, 'Label cannot be empty').optional(),
    productId: z.string({required_error: 'Product id is required'}).optional(),
    referenceId: z.string({required_error: 'Reference id is required'}).optional(),
    features:z.array(z.string()).min(1, 'At least one feature is required').optional(),
    recommended: z.boolean({required_error: 'Recommended is required'}).optional(),
    price: z.number({required_error: 'Price is required'}).optional(),
    recurring: z.enum(['monthly', 'yearly', 'buisness'], {required_error: 'Recurring is required'}).optional(),
}),
});

export const PackageValidation = {
  createPackageZodSchema,
  updatePackageZodSchema,
};
