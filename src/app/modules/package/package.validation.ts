import { z } from 'zod';
import { BILLING_CYCLE, PACKAGE_STATUS } from './package.constant';

const createPackageZodSchema = z.object({
  body: z.object({
    title: z.string({ required_error: 'Plan title is required' }).min(1, 'Title cannot be empty'),
    price: z.number({ required_error: 'Price is required' }).min(0, 'Price must be non-negative'),
    currency: z.string().optional(),
    billingCycle: z.nativeEnum(BILLING_CYCLE, {
      required_error: 'Billing cycle is required (month or year)',
    }),
    features: z.array(z.string()).min(1, 'At least one feature must be provided'),
    isPopular: z.boolean().optional(),
  }),
});

const updatePackageZodSchema = z.object({
  body: z.object({
    title: z.string().optional(),
    price: z.number().min(0).optional(),
    currency: z.string().optional(),
    billingCycle: z.nativeEnum(BILLING_CYCLE).optional(),
    features: z.array(z.string()).optional(),
    status: z.nativeEnum(PACKAGE_STATUS).optional(),
    isPopular: z.boolean().optional(),
  }),
});

const checkoutSessionZodSchema = z.object({
  body: z.object({
    packageId: z.string({ required_error: 'Package ID is required' }),
    successUrl: z.string().url().optional(),
    cancelUrl: z.string().url().optional(),
  }),
});

const paymentIntentZodSchema = z.object({
  body: z.object({
    packageId: z.string({ required_error: 'Package ID is required' }),
  }),
});

const cancelSubscriptionZodSchema = z.object({
  body: z.object({
    subscriptionId: z.string().optional(),
  }),
});

export const PackageValidation = {
  createPackageZodSchema,
  updatePackageZodSchema,
  checkoutSessionZodSchema,
  paymentIntentZodSchema,
  cancelSubscriptionZodSchema,
};
