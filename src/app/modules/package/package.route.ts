import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { PackageController } from './package.controller';
import { PackageValidation } from './package.validation';

const router = express.Router();

router.post(
  '/',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.USER),
  validateRequest(PackageValidation.createPackageZodSchema),
  PackageController.createPackage
);

router.get(
  '/',
  PackageController.getAllPackages
);

router.get(
  '/my-subscription',
  auth(USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  PackageController.getMySubscription
);

router.get(
  '/:id',
  PackageController.getPackageById
);

router.patch(
  '/:id',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  validateRequest(PackageValidation.updatePackageZodSchema),
  PackageController.updatePackage
);

router.delete(
  '/:id',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  PackageController.deletePackage
);

router.post(
  '/create-checkout-session',
  auth(USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  validateRequest(PackageValidation.checkoutSessionZodSchema),
  PackageController.createCheckoutSession
);

router.post(
  '/create-payment-intent',
  auth(USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  validateRequest(PackageValidation.paymentIntentZodSchema),
  PackageController.createPaymentIntent
);

router.post(
  '/cancel-subscription',
  auth(USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  validateRequest(PackageValidation.cancelSubscriptionZodSchema),
  PackageController.cancelSubscription
);

router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  PackageController.handleStripeWebhook
);

export const PackageRoutes = router;
