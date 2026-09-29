import { Model } from 'mongoose';

export type IPackage = {
  productId: string;
  referenceId: string;
  label: string;
  status: 'active' | 'delete';
  features: string[];
  recommended?: boolean;
  price: number;
  recurring:"monthly"|"yearly"|"buisness"
};

export type PackageModel = Model<IPackage>;
