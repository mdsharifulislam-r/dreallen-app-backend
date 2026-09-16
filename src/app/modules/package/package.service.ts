import { StatusCodes } from 'http-status-codes';
import config from '../../../config';
import stripe from '../../../config/stripe';
import ApiError from '../../../errors/ApiError';
import QueryBuilder from '../../builder/QueryBuilder';
import { BILLING_CYCLE, PACKAGE_STATUS, SUBSCRIPTION_STATUS, packageSearchableFields } from './package.constant';
import { IPackage } from './package.interface';
import { Package, Subscription } from './package.model';

const createPackageInDB = async (payload: IPackage): Promise<IPackage> => {
  if (config.stripe.secret_key && (!payload.stripeProductId || !payload.stripePriceId)) {
    try {
      const product = await stripe.products.create({
        name: payload.title,
        description: payload.features.join(', '),
      });

      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(payload.price * 100),
        currency: payload.currency || 'usd',
        recurring: {
          interval: payload.billingCycle === BILLING_CYCLE.YEAR ? 'year' : 'month',
        },
      });

      payload.stripeProductId = product.id;
      payload.stripePriceId = price.id;
    } catch (error) {
      console.warn('Stripe integration warning during package creation:', error);
    }
  }

  const result = await Package.create(payload);
  return result;
};

const getAllPackagesFromDB = async (query: Record<string, any>) => {
  const packageQuery = new QueryBuilder(Package.find(), query)
    .search(packageSearchableFields)
    .filter()
    .sort()
    .paginate()
    .fields();

  const data = await packageQuery.modelQuery;
  const pagination = await packageQuery.getPaginationInfo();

  return {
    pagination,
    data,
  };
};

const getPackageByIdFromDB = async (id: string): Promise<IPackage> => {
  const result = await Package.findById(id);
  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Package not found');
  }
  return result;
};

const updatePackageInDB = async (id: string, payload: Partial<IPackage>): Promise<IPackage> => {
  const result = await Package.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Package not found');
  }
  return result;
};

const deletePackageInDB = async (id: string): Promise<IPackage> => {
  const result = await Package.findByIdAndDelete(id);
  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Package not found');
  }
  return result;
};

const createCheckoutSessionInDB = async (
  userId: string,
  packageId: string,
  successUrl?: string,
  cancelUrl?: string
) => {
  const pkg = await Package.findById(packageId);
  if (!pkg) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Package not found');
  }

  let priceId = pkg.stripePriceId;

  if (!priceId && config.stripe.secret_key) {
    const price = await stripe.prices.create({
      currency: pkg.currency || 'usd',
      unit_amount: Math.round(pkg.price * 100),
      recurring: {
        interval: pkg.billingCycle === BILLING_CYCLE.YEAR ? 'year' : 'month',
      },
      product_data: {
        name: pkg.title,
      },
    });
    priceId = price.id;
    pkg.stripePriceId = priceId;
    await pkg.save();
  }

  if (!priceId) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Stripe price configuration is missing for this package');
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'subscription',
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    metadata: {
      userId,
      packageId,
    },
    success_url:
      successUrl ||
      `${config.front_end_app_url || 'http://localhost:3000'}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:
      cancelUrl || `${config.front_end_app_url || 'http://localhost:3000'}/payment-cancel`,
  });

  return {
    url: session.url,
    sessionId: session.id,
  };
};

const createPaymentIntentInDB = async (userId: string, packageId: string) => {
  const pkg = await Package.findById(packageId);
  if (!pkg) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Package not found');
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(pkg.price * 100),
    currency: pkg.currency || 'usd',
    metadata: {
      userId,
      packageId,
    },
    automatic_payment_methods: {
      enabled: true,
    },
  });

  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    amount: pkg.price,
    currency: pkg.currency || 'usd',
  };
};

const handleStripeWebhook = async (event: any) => {
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.metadata?.userId;
    const packageId = session.metadata?.packageId;

    if (userId && packageId) {
      const pkg = await Package.findById(packageId);
      const startDate = new Date();
      const endDate = new Date();
      if (pkg?.billingCycle === BILLING_CYCLE.YEAR) {
        endDate.setFullYear(endDate.getFullYear() + 1);
      } else {
        endDate.setMonth(endDate.getMonth() + 1);
      }

      await Subscription.create({
        userId,
        packageId,
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: session.subscription as string,
        amount: (session.amount_total || 0) / 100,
        status: SUBSCRIPTION_STATUS.ACTIVE,
        startDate,
        endDate,
      });
    }
  } else if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const userId = paymentIntent.metadata?.userId;
    const packageId = paymentIntent.metadata?.packageId;

    if (userId && packageId) {
      const pkg = await Package.findById(packageId);
      const startDate = new Date();
      const endDate = new Date();
      if (pkg?.billingCycle === BILLING_CYCLE.YEAR) {
        endDate.setFullYear(endDate.getFullYear() + 1);
      } else {
        endDate.setMonth(endDate.getMonth() + 1);
      }

      await Subscription.create({
        userId,
        packageId,
        stripePaymentIntentId: paymentIntent.id,
        amount: (paymentIntent.amount || 0) / 100,
        status: SUBSCRIPTION_STATUS.ACTIVE,
        startDate,
        endDate,
      });
    }
  }
};

const getMySubscriptionFromDB = async (userId: string) => {
  const subscription = await Subscription.findOne({
    userId,
    status: SUBSCRIPTION_STATUS.ACTIVE,
  })
    .populate('packageId')
    .sort({ createdAt: -1 });

  return subscription;
};

const cancelSubscriptionInDB = async (userId: string, subscriptionId?: string) => {
  let subscription;

  if (subscriptionId) {
    subscription = await Subscription.findOne({ _id: subscriptionId, userId });
  } else {
    subscription = await Subscription.findOne({
      userId,
      status: SUBSCRIPTION_STATUS.ACTIVE,
    }).sort({ createdAt: -1 });
  }

  if (!subscription) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Active subscription not found');
  }

  if (subscription.stripeSubscriptionId && config.stripe.secret_key) {
    try {
      await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
    } catch (error) {
      console.warn('Stripe subscription cancel notice:', error);
    }
  }

  subscription.status = SUBSCRIPTION_STATUS.CANCELLED;
  await subscription.save();

  return subscription;
};

export const PackageService = {
  createPackageInDB,
  getAllPackagesFromDB,
  getPackageByIdFromDB,
  updatePackageInDB,
  deletePackageInDB,
  createCheckoutSessionInDB,
  createPaymentIntentInDB,
  handleStripeWebhook,
  getMySubscriptionFromDB,
  cancelSubscriptionInDB,
};
