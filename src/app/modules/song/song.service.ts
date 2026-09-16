import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { ISong } from './song.interface';
import { Song } from './song.model';
import QueryBuilder from '../../builder/QueryBuilder';
import { Rating } from '../rating/rating.model';
import { Favorite } from '../favorite/favorite.model';
import { FAVORITE_TARGET } from '../favorite/favorite.constant';

const getAllSongsFromDB = async (query: Record<string, any>) => {
  const songQuery = new QueryBuilder(Song.find(), query)
    .search(['title', 'artist'])
    .fields()
    .filter();

  const result = await songQuery.modelQuery.lean();

  if (!result.length) {
    return {
      pagination: await songQuery.getPaginationInfo(),
      data: [],
    };
  }

  const songIds = result.map(song => song._id);

  // Run both queries at the same time
  const [ratingsQuery, favoritesQuery] = await Promise.all([
    Rating.find({ targetId: { $in: songIds } }).lean(),
    Favorite.find({ targetId: { $in: songIds }, targetType: FAVORITE_TARGET.SONG }).lean(),
  ]);

  // Rating Map
  const ratingsMap = new Map(
    ratingsQuery.map(rating => [rating.targetId.toString(), rating.rating]),
  );

  // Favorite Set
  const favoritesSet = new Set(
    favoritesQuery.map(favorite => favorite.targetId.toString()),
  );

  result.forEach(song => {
    const songId = song._id.toString();

    song.rating = ratingsMap.get(songId) ?? 0;
    song.isFavorite = favoritesSet.has(songId);
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

  const pagination = await songQuery.getPaginationInfo();

  return {
    pagination,
    data: result,
  };
};

const getSongByIdFromDB = async (id: string): Promise<ISong> => {
  const song = await Song.findById(id).lean();
  if (!song) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Song not found');
  }
  return song;
};

const toggleFavoriteInDB = async (id: string, userId?: string): Promise<ISong> => {
  const song = await Song.findById(id);
  if (!song) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Song not found');
  }

  if (userId) {
    const existing = await Favorite.findOne({
      userId,
      targetId: id,
      targetType: FAVORITE_TARGET.SONG,
    });
    if (existing) {
      await Favorite.deleteOne({ _id: existing._id });
      song.isFavorite = false;
    } else {
      await Favorite.create({
        userId,
        targetId: id,
        targetType: FAVORITE_TARGET.SONG,
      });
      song.isFavorite = true;
    }
  } else {
    song.isFavorite = !song.isFavorite;
  }

  await song.save();
  return song;
};

const recordPlayInDB = async (id: string): Promise<ISong> => {
  const song = await Song.findByIdAndUpdate(
    id,
    { $inc: { playCount: 1, viewsCount: 1 } },
    { new: true },
  );
  if (!song) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Song not found');
  }
  return song;
};

const createSongInDB = async (payload: Partial<ISong>): Promise<ISong> => {
  return await Song.create(payload);
};

export const SongService = {
  getAllSongsFromDB,
  getSongByIdFromDB,
  toggleFavoriteInDB,
  recordPlayInDB,
  createSongInDB,
};
