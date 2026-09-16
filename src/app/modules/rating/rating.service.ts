import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { IRating } from './rating.interface';
import { Rating } from './rating.model';
import { Song } from '../song/song.model';
import { Video } from '../video/video.model';

const giveRatingInDB = async (payload: IRating): Promise<IRating> => {
  const { userId, targetId, rating } = payload;

  if (rating < 1 || rating > 5) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Rating must be between 1 and 5');
  }

  const existing = await Rating.findOne({ userId, targetId });

  const isExistSong = await Song.findById(targetId);
  const isExistVideo = await Video.findById(targetId);

  if (!isExistSong && !isExistVideo) {
    throw new ApiError(StatusCodes.BAD_REQUEST, ' Media not found');
  }


  if (existing) {
    existing.rating = rating;
    await existing.save();
    return existing;
  }

  return await Rating.create(payload);
};

export const RatingService = {
  giveRatingInDB,
};
