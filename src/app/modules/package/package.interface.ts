import { Model, Types } from 'mongoose';
import { BILLING_CYCLE, PACKAGE_STATUS, SUBSCRIPTION_STATUS } from './package.constant';

export interface IPackage {
  _id?: Types.ObjectId;
  title: string;
  price: number;
  currency?: string;
  billingCycle: BILLING_CYCLE;
  features: string[];
  stripeProductId?: string;
  stripePriceId?: string;
  status?: PACKAGE_STATUS;
  isPopular?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type PackageModel = Model<IPackage>;

export interface ISubscription {
  _id?: Types.ObjectId;
  userId: Types.ObjectId;
  packageId: Types.ObjectId;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripePaymentIntentId?: string;
  amount: number;
  status: SUBSCRIPTION_STATUS;
  startDate?: Date;
  endDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export type SubscriptionModel = Model<ISubscription>;
