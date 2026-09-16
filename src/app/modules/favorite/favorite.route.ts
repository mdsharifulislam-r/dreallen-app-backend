import express from 'express';
import { FavoriteController } from './favorite.controller';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';

const router = express.Router();

router.patch(
  '/toggle/:targetId',
  auth(USER_ROLES.ADMIN, USER_ROLES.USER, USER_ROLES.SUPER_ADMIN),
  FavoriteController.toggleFavorite
);

router.patch(
  '/toggle/:targetType/:targetId',
  auth(USER_ROLES.ADMIN, USER_ROLES.USER, USER_ROLES.SUPER_ADMIN),
  FavoriteController.toggleFavorite
);

router.get(
  '/mine',
  auth(USER_ROLES.ADMIN, USER_ROLES.USER, USER_ROLES.SUPER_ADMIN),
  FavoriteController.getMyFavorites
);

router.get(
  '/check/:targetId',
  auth(USER_ROLES.ADMIN, USER_ROLES.USER, USER_ROLES.SUPER_ADMIN),
  FavoriteController.checkFavorite
);

router.get(
  '/check/:targetType/:targetId',
  auth(USER_ROLES.ADMIN, USER_ROLES.USER, USER_ROLES.SUPER_ADMIN),
  FavoriteController.checkFavorite
);

export const FavoriteRoutes = router;
