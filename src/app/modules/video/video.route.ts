import express from 'express';
import { VideoController } from './video.controller';
import fileUploadHandler from '../../middlewares/fileUploadHandler';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';

const router = express.Router();

router.get('/', auth(USER_ROLES.ADMIN, USER_ROLES.USER, USER_ROLES.SUPER_ADMIN), VideoController.getAllVideos);
router.get('/featured', auth(USER_ROLES.ADMIN, USER_ROLES.USER, USER_ROLES.SUPER_ADMIN), VideoController.getFeaturedVideos);

router.post('/', auth(USER_ROLES.ADMIN, USER_ROLES.USER, USER_ROLES.SUPER_ADMIN), fileUploadHandler(), VideoController.createVideo);
router.patch('/featured/:id', auth(USER_ROLES.ADMIN, USER_ROLES.USER, USER_ROLES.SUPER_ADMIN), VideoController.toggleFeatured);
router.patch('/:id/featured', auth(USER_ROLES.ADMIN, USER_ROLES.USER, USER_ROLES.SUPER_ADMIN), VideoController.toggleFeatured);

router.get('/:id', auth(USER_ROLES.ADMIN, USER_ROLES.USER, USER_ROLES.SUPER_ADMIN), VideoController.getVideoById);
router.patch('/:id/favorite', auth(USER_ROLES.ADMIN, USER_ROLES.USER, USER_ROLES.SUPER_ADMIN), VideoController.toggleFavorite);
router.post('/play/:id', auth(USER_ROLES.ADMIN, USER_ROLES.USER, USER_ROLES.SUPER_ADMIN), VideoController.recordPlay);

export const VideoRoutes = router;
