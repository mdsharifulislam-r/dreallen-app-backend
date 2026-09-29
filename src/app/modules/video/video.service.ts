import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { IVideo } from './video.interface';
import { Video } from './video.model';
import QueryBuilder from '../../builder/QueryBuilder';
import { Rating } from '../rating/rating.model';
import { Favorite } from '../favorite/favorite.model';
import { FAVORITE_TARGET } from '../favorite/favorite.constant';

const getAllVideosFromDB = async (query: Record<string, any>) => {
  const videoQuery = new QueryBuilder(Video.find(), query)
    .search(['title', 'artist'])
    .fields()
    .filter();

  const result = await videoQuery.modelQuery.lean();

  if (!result.length) {
    return {
      pagination: await videoQuery.getPaginationInfo(),
      data: [],
    };
  }

  const videoIds = result.map(video => video._id);

  // Run both queries at the same time
  const [ratingsQuery, favoritesQuery] = await Promise.all([
    Rating.find({ targetId: { $in: videoIds } }).lean(),
    Favorite.find({ targetId: { $in: videoIds }, targetType: FAVORITE_TARGET.VIDEO }).lean(),
  ]);

  // Rating Map
  const ratingsMap = new Map(
    ratingsQuery.map(rating => [rating.targetId.toString(), rating.rating]),
  );

  // Favorite Set
  const favoritesSet = new Set(
    favoritesQuery.map(favorite => favorite.targetId.toString()),
  );

  result.forEach(video => {
    const videoId = video._id.toString();

    video.rating = ratingsMap.get(videoId) ?? 0;
    video.isFavorite = favoritesSet.has(videoId);
  });

  const sort = (query?.sort as string) || (query?.sortBy as string) || 'latest';

  if (sort === 'top-rated') {
    result.sort((a, b) => {
      if (b.rating !== a.rating) {
        return b.rating - a.rating;
      }

      return (b.ratingCount || 0) - (a.ratingCount || 0);
    });
  } else if (sort === 'most-played') {
    result.sort((a, b) => (b.playCount || 0) - (a.playCount || 0));
  } else {
    result.sort(
      (a, b) =>
        new Date(b.createdAt || new Date()).getTime() - new Date(a.createdAt || new Date()).getTime(),
    );
  }

  const pagination = await videoQuery.getPaginationInfo();

  return {
    pagination,
    data: result,
  };
};

const getVideoByIdFromDB = async (id: string, userId: string): Promise<IVideo> => {
  console.log("userId", userId)
  // First fetch and update the video, check if it exists immediately
  const video = await Video.findByIdAndUpdate(
    id,
    { $inc: { viewsCount: 1 } },
    { new: true }
  ).lean();

  if (!video) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Video not found');
  }

  // Run all secondary queries in parallel using Promise.all
  const [isFavoriteDoc, myRatingDoc, averageRatingDoc] = await Promise.all([
    Favorite.findOne({
      userId,
      targetId: video._id,
    }).lean(),
    Rating.findOne({
      userId,
      targetId: video._id,
    }).lean(),
    Rating.findOne({
      targetId: video._id,
      userId
    }).lean(),
  ]);

  console.log("isFavoriteDoc", isFavoriteDoc)
  // Attach computed properties to the video object
  video.isFavorite = isFavoriteDoc?._id ? true : false;

  return video;
};

const toggleFavoriteInDB = async (id: string, userId?: string): Promise<IVideo> => {
  const video = await Video.findById(id);
  if (!video) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Video not found');
  }

  if (userId) {
    const existing = await Favorite.findOne({
      userId,
      targetId: id,
      targetType: FAVORITE_TARGET.VIDEO,
    });
    if (existing) {
      await Favorite.deleteOne({ _id: existing._id });
      video.isFavorite = false;
    } else {
      await Favorite.create({
        userId,
        targetId: id,
        targetType: FAVORITE_TARGET.VIDEO,
      });
      video.isFavorite = true;
    }
  } else {
    video.isFavorite = !video.isFavorite;
  }

  await video.save();
  return video;
};

const recordPlayInDB = async (id: string): Promise<IVideo> => {
  const video = await Video.findByIdAndUpdate(
    id,
    { $inc: { playCount: 1 } },
    { new: true },
  );
  if (!video) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Video not found');
  }
  return video;
};

const createVideoInDB = async (payload: Partial<IVideo>): Promise<IVideo> => {
  return await Video.create(payload);
};

const toggleFeaturedInDB = async (id: string): Promise<IVideo> => {
  const video = await Video.findById(id);
  if (!video) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Video not found');
  }

  video.isFeatured = !video.isFeatured;
  await video.save();
  return video;
};

const getFeaturedVideosFromDB = async (query: Record<string, any>) => {
  return await getAllVideosFromDB({ ...query, isFeatured: true });
};

export const VideoService = {
  getAllVideosFromDB,
  getVideoByIdFromDB,
  toggleFavoriteInDB,
  recordPlayInDB,
  createVideoInDB,
  toggleFeaturedInDB,
  getFeaturedVideosFromDB,
};
