import express from 'express';
import { PlaylistController } from './playlist.controller';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import fileUploadHandler from '../../middlewares/fileUploadHandler';

const router = express.Router();

router.get(
  '/',
  auth(USER_ROLES.ADMIN, USER_ROLES.USER, USER_ROLES.SUPER_ADMIN),
  PlaylistController.getAllPlaylists
);

router.get(
  '/my-playlists',
  auth(USER_ROLES.ADMIN, USER_ROLES.USER, USER_ROLES.SUPER_ADMIN),
  PlaylistController.getMyPlaylists
);

router.post(
  '/',
  auth(USER_ROLES.ADMIN, USER_ROLES.USER, USER_ROLES.SUPER_ADMIN),
  fileUploadHandler(),
  PlaylistController.createPlaylist
);

router.get(
  '/:id',
  auth(USER_ROLES.ADMIN, USER_ROLES.USER, USER_ROLES.SUPER_ADMIN),
  PlaylistController.getPlaylistById
);

router.patch(
  '/:id',
  auth(USER_ROLES.ADMIN, USER_ROLES.USER, USER_ROLES.SUPER_ADMIN),
  fileUploadHandler(),
  PlaylistController.updatePlaylist
);

router.patch(
  '/:id/add-song',
  auth(USER_ROLES.ADMIN, USER_ROLES.USER, USER_ROLES.SUPER_ADMIN),
  PlaylistController.addSongToPlaylist
);

router.patch(
  '/:id/remove-song',
  auth(USER_ROLES.ADMIN, USER_ROLES.USER, USER_ROLES.SUPER_ADMIN),
  PlaylistController.removeSongFromPlaylist
);

router.delete(
  '/:id',
  auth(USER_ROLES.ADMIN, USER_ROLES.USER, USER_ROLES.SUPER_ADMIN),
  PlaylistController.deletePlaylist
);

router.get(
  '/:id/songs',
  auth(USER_ROLES.ADMIN, USER_ROLES.USER, USER_ROLES.SUPER_ADMIN),
  PlaylistController.getPlaylistSongs
);

export const PlaylistRoutes = router;
