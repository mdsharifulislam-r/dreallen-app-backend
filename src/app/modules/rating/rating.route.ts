import express from 'express';
import { RatingController } from './rating.controller';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';

const router = express.Router();

router.post(
  '/',
  auth(USER_ROLES.ADMIN, USER_ROLES.USER, USER_ROLES.SUPER_ADMIN),
  RatingController.giveRating
);

router.get(
  '/:id',
  auth(USER_ROLES.ADMIN, USER_ROLES.USER, USER_ROLES.SUPER_ADMIN),
  RatingController.getAllRatings
)

router.delete(
  '/:id',
  auth(USER_ROLES.ADMIN, USER_ROLES.USER, USER_ROLES.SUPER_ADMIN),
  RatingController.deleteRating
)

export const RatingRoutes = router;
