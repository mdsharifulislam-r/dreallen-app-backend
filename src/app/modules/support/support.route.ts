import express, { NextFunction, Request, Response } from 'express';
import { Secret } from 'jsonwebtoken';
import config from '../../../config';
import { USER_ROLES } from '../../../enums/user';
import { jwtHelper } from '../../../helpers/jwtHelper';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { SupportController } from './support.controller';
import { SupportValidation } from './support.validation';

const router = express.Router();

const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tokenWithBearer = req.headers.authorization;
    if (tokenWithBearer && tokenWithBearer.startsWith('Bearer')) {
      const token = tokenWithBearer.split(' ')[1];
      const verifyUser = jwtHelper.verifyToken(
        token,
        config.jwt.jwt_secret as Secret
      );
      req.user = verifyUser;
    }
    next();
  } catch {
    next();
  }
};

router.post(
  '/',
  validateRequest(SupportValidation.createSupportZodSchema),
  optionalAuth,
  SupportController.createSupport
);

router.get(
  '/mine',
  auth(USER_ROLES.ADMIN, USER_ROLES.USER, USER_ROLES.SUPER_ADMIN),
  SupportController.getMySupports
);

router.get(
  '/',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.USER),
   SupportController.getAllSupports
);

router.get(
  '/:id',
  auth(USER_ROLES.ADMIN, USER_ROLES.USER, USER_ROLES.SUPER_ADMIN),
  SupportController.getSingleSupport
);

router.patch(
  '/:id/status',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  validateRequest(SupportValidation.updateSupportStatusZodSchema),
  SupportController.updateSupportStatus
);

router.delete(
  '/:id',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  SupportController.deleteSupport
);

export const SupportRoutes = router;
