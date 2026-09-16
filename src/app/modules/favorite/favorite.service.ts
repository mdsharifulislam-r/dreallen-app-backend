import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { IFavorite } from './favorite.interface';
import { Favorite } from './favorite.model';
import { FAVORITE_TARGET } from './favorite.constant';
import { Types } from 'mongoose';
import { Song } from '../song/song.model';
import { Video } from '../video/video.model';

const toggleFavoriteInDB = async (payload: IFavorite) => {
  const { userId, targetId, targetType } = payload;

  const existing = await Favorite.findOne({ userId, targetId, targetType });

  let isMediaExist = false;
  if (targetType === FAVORITE_TARGET.VIDEO) {
    isMediaExist = !!(await Video.exists({ _id: targetId }));
  } else {
    isMediaExist = !!(await Song.exists({ _id: targetId }));
  }

  if (!isMediaExist) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Media not found');
  }

  if (existing) {
    await Favorite.deleteOne({ _id: existing._id });
    return { favorited: false, favorite: null };
  }

  const favorite = await Favorite.create(payload);
  return { favorited: true, favorite };
};

const getMyFavoritesFromDB = async (
  userId: string,
  targetType: FAVORITE_TARGET | undefined,
  query: Record<string, any>
) => {
  const match: Record<string, any> = { userId: new Types.ObjectId(userId) };
  if (targetType) {
    match.targetType = targetType;
  }

  const page = Number(query?.page) || 1;
  const limit = Number(query?.limit) || 10;
  const skip = (page - 1) * limit;

  const pipeline: any[] = [{ $match: match }];

  pipeline.push({
    $lookup: {
      from: 'songs',
      let: { targetId: '$targetId', targetType: '$targetType' },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ['$_id', '$$targetId'] },
                { $eq: ['$$targetType', FAVORITE_TARGET.SONG] },
              ],
            },
          },
        },
      ],
      as: '_song',
    },
  });

  pipeline.push({
    $lookup: {
      from: 'videos',
      let: { targetId: '$targetId', targetType: '$targetType' },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ['$_id', '$$targetId'] },
                { $eq: ['$$targetType', FAVORITE_TARGET.VIDEO] },
              ],
            },
          },
        },
      ],
      as: '_video',
    },
  });

  pipeline.push({
    $addFields: {
      item: {
        $cond: [
          { $gt: [{ $size: '$_song' }, 0] },
          { $first: '$_song' },
          {
            $cond: [
              { $gt: [{ $size: '$_video' }, 0] },
              { $first: '$_video' },
              null,
            ],
          },
        ],
      },
    },
  });

  pipeline.push(
    { $match: { item: { $ne: null } } },
    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: [
            '$item',
            { targetType: '$targetType', favoriteId: '$_id' },
          ],
        },
      },
    },
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit }
  );

  const countPipeline: any[] = [
    { $match: match },
    {
      $lookup: {
        from: 'songs',
        localField: 'targetId',
        foreignField: '_id',
        as: '_song',
      },
    },
    {
      $lookup: {
        from: 'videos',
        localField: 'targetId',
        foreignField: '_id',
        as: '_video',
      },
    },
    {
      $match: {
        $or: [
          { targetType: FAVORITE_TARGET.SONG, _song: { $ne: [] } },
          { targetType: FAVORITE_TARGET.VIDEO, _video: { $ne: [] } },
        ],
      },
    },
    { $count: 'total' },
  ];

  const [items, countResult] = await Promise.all([
    Favorite.aggregate(pipeline),
    Favorite.aggregate(countPipeline),
  ]);

  const total = countResult[0]?.total || 0;
  const totalPages = Math.ceil(total / limit);

  return {
    pagination: {
      page,
      limit,
      total,
      totalPage: totalPages,
    },
    data: items,
  };
};

const checkFavoriteInDB = async (
  userId: string,
  targetId: string,
  targetType: FAVORITE_TARGET
): Promise<{ favorited: boolean }> => {
  const exists = await Favorite.exists({ userId, targetId, targetType });
  return { favorited: !!exists };
};

export const FavoriteService = {
  toggleFavoriteInDB,
  getMyFavoritesFromDB,
  checkFavoriteInDB,
};
