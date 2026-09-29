import { z } from "zod";

const createSubsciptionZodSchema = z.object({
  body: z.object({
    receipt: z.string({
      required_error: 'Receipt is required',
    }),
  }),
});

const cancelSubscriptionZodSchema = z.object({
  body: z.object({
    userId: z.string({
      required_error: 'User ID is required',
    }),
  }),
});

const changeSubscriptionPackageZodSchema = z.object({
  body: z.object({
    userId: z.string({
      required_error: 'User ID is required',
    }),    
    packageId: z.string({
      required_error: 'Package ID is required',
    }),
  }),
});

export const SubscriptionValidation = {
  createSubsciptionZodSchema,
  cancelSubscriptionZodSchema,
  changeSubscriptionPackageZodSchema
};