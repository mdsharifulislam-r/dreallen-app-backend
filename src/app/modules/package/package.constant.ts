export enum BILLING_CYCLE {
  MONTH = 'month',
  YEAR = 'year',
}

export enum PACKAGE_STATUS {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum SUBSCRIPTION_STATUS {
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  PENDING = 'PENDING',
}

export const packageSearchableFields = ['title', 'features'];
