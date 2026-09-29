import { BtsRoutes } from '../app/modules/bts/bts.route';
import express from 'express';
import { AuthRoutes } from '../app/modules/auth/auth.route';
import { UserRoutes } from '../app/modules/user/user.route';
import { SongRoutes } from '../app/modules/song/song.route';
import { VideoRoutes } from '../app/modules/video/video.route';
import { PlaylistRoutes } from '../app/modules/playlist/playlist.route';
import { RatingRoutes } from '../app/modules/rating/rating.route';
import { FavoriteRoutes } from '../app/modules/favorite/favorite.route';
import { SupportRoutes } from '../app/modules/support/support.route';
import { SettingsRoutes } from '../app/modules/settings/settings.route';
import { PackageRoutes } from '../app/modules/package/package.route';
import { NotificationRoutes } from '../app/modules/notification/notification.routes';
import { SubscriptionRoutes } from '../app/modules/subscription/subscription.route';
import { BusinessDescriptionRoutes } from '../app/modules/businessDescription/businessDescription.route';

const router = express.Router();

const apiRoutes: { path: string; route: any }[] = [
  {
    path: '/user',
    route: UserRoutes,
  },
  {
    path: '/auth',
    route: AuthRoutes,
  },
  {
    path: '/songs',
    route: SongRoutes,
  },
  {
    path: '/videos',
    route: VideoRoutes,
  },
  {
    path: '/playlists',
    route: PlaylistRoutes,
  },
  {
    path: '/ratings',
    route: RatingRoutes,
  },
  {
    path: '/favorites',
    route: FavoriteRoutes,
  },
  {
    path: '/supports',
    route: SupportRoutes,
  },
  {
    path: "/settings",
    route: SettingsRoutes
  },
  {
    path: '/business-description',
    route: BusinessDescriptionRoutes,
  },
  {
    path: '/packages',
    route: PackageRoutes,
  },
  {
    path:"/notification",
    route:NotificationRoutes
  },
  { path: '/bts', route: BtsRoutes },
  {
    path: '/package',
    route: PackageRoutes,
  },
  {
    path: '/subscription',
    route: SubscriptionRoutes,
  },
  {
    path: '/business-description',
    route: BusinessDescriptionRoutes,
  }
];


apiRoutes.forEach(route => router.use(route.path, route.route));

export default router;
