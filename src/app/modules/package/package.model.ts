import { Schema, model } from 'mongoose';
import { BILLING_CYCLE, PACKAGE_STATUS, SUBSCRIPTION_STATUS } from './package.constant';
import { IPackage, ISubscription, PackageModel, SubscriptionModel } from './package.interface';

const packageSchema = new Schema<IPackage, PackageModel>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'usd',
      lowercase: true,
    },
    billingCycle: {
      type: String,
      enum: Object.values(BILLING_CYCLE),
      required: true,
    },
    features: {
      type: [String],
      required: true,
      default: [],
    },
    stripeProductId: {
      type: String,
    },
    stripePriceId: {
      type: String,
    },
    status: {
      type: String,
      enum: Object.values(PACKAGE_STATUS),
      default: PACKAGE_STATUS.ACTIVE,
    },
    isPopular: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const subscriptionSchema = new Schema<ISubscription, SubscriptionModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    packageId: {
      type: Schema.Types.ObjectId,
      ref: 'Package',
      required: true,
    },
    stripeCustomerId: {
      type: String,
    },
    stripeSubscriptionId: {
      type: String,
    },
    stripePaymentIntentId: {
      type: String,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(SUBSCRIPTION_STATUS),
      default: SUBSCRIPTION_STATUS.PENDING,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const Package = model<IPackage, PackageModel>('Package', packageSchema);
export const Subscription = model<ISubscription, SubscriptionModel>('Subscription', subscriptionSchema);
