import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import config from '../../../config';
import stripe from '../../../config/stripe';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { PackageService } from './package.service';

const createPackage = catchAsync(async (req: Request, res: Response) => {
  const result = await PackageService.createPackageInDB(req.body);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Package created successfully',
    data: result,
  });
});

const getAllPackages = catchAsync(async (req: Request, res: Response) => {
  const result = await PackageService.getAllPackagesFromDB(req.query as Record<string, any>);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Packages retrieved successfully',
    pagination: result.pagination,
    data: result.data,
  });
});

const getPackageById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await PackageService.getPackageByIdFromDB(id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Package details retrieved successfully',
    data: result,
  });
});

const updatePackage = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await PackageService.updatePackageInDB(id, req.body);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Package updated successfully',
    data: result,
  });
});

const deletePackage = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await PackageService.deletePackageInDB(id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Package deleted successfully',
    data: result,
  });
});

const createCheckoutSession = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { packageId, successUrl, cancelUrl } = req.body;

  const result = await PackageService.createCheckoutSessionInDB(
    userId,
    packageId,
    successUrl,
    cancelUrl
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Stripe checkout session created successfully',
    data: result,
  });
});

const createPaymentIntent = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { packageId } = req.body;

  const result = await PackageService.createPaymentIntentInDB(userId, packageId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Stripe payment intent created successfully',
    data: result,
  });
});

const handleStripeWebhook = catchAsync(async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];
  let event = req.body;

  if (sig && config.stripe.webhook_secret) {
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        config.stripe.webhook_secret as string
      );
    } catch (err: any) {
      return res.status(StatusCodes.BAD_REQUEST).send(`Webhook Error: ${err.message}`);
    }
  }

  await PackageService.handleStripeWebhook(event);

  res.status(StatusCodes.OK).json({ received: true });
});

const getMySubscription = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const result = await PackageService.getMySubscriptionFromDB(userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Subscription info retrieved successfully',
    data: result,
  });
});

const cancelSubscription = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { subscriptionId } = req.body;
  const result = await PackageService.cancelSubscriptionInDB(userId, subscriptionId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Subscription cancelled successfully',
    data: result,
  });
});

export const PackageController = {
  createPackage,
  getAllPackages,
  getPackageById,
  updatePackage,
  deletePackage,
  createCheckoutSession,
  createPaymentIntent,
  handleStripeWebhook,
  getMySubscription,
  cancelSubscription,
};
