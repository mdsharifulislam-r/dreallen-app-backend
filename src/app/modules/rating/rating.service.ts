import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { IRating } from './rating.interface';
import { Rating } from './rating.model';
import { Song } from '../song/song.model';
import { Video } from '../video/video.model';
import QueryBuilder from '../../builder/QueryBuilder';

const giveRatingInDB = async (payload: IRating): Promise<IRating> => {
  const { userId, targetId, rating, review } = payload;

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
    await Rating.updateOne(
      { _id: existing._id },
      { $set: { rating, review } },
    )
  }

  return await Rating.create(payload);
};

const getReviewsFromDB = async (targetId: string,query: Record<string, any>) => {
  const reviewQuery = new QueryBuilder(Rating.find({ targetId }), query).paginate().sort()
  const [reviews, pagination] = await Promise.all([
    reviewQuery.modelQuery.populate('userId', 'name email image').lean(),
    reviewQuery.getPaginationInfo(),
  ])

  return {
    pagination,
    data: reviews,
  }
};


const deleteRatingInDB = async (ratingId: string): Promise<void> => {
  const existing = await Rating.findOne({ _id: ratingId });

  if (!existing) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Rating not found');
  }

  

  await Rating.deleteOne({ _id: ratingId });

  const avgExsitingRating = await Rating.aggregate([
    { $match: { targetId: existing.targetId } },
    { $group: { _id: null, avgRating: { $avg: '$rating' }, totalRatings: { $sum: 1 }} },
  ])

  await Song.updateOne(
    { _id: existing.targetId },
    { $set: { averageRating: avgExsitingRating[0]?.avgRating || 0, ratingCount: avgExsitingRating[0]?.totalRatings || 0 } },
  )

  await Video.updateOne(
    { _id: existing.targetId },
    { $set: { avgRating: avgExsitingRating[0]?.avgRating || 0, ratingCount: avgExsitingRating[0]?.totalRatings || 0 } },
  )

};

export const RatingService = {
  giveRatingInDB,
  getReviewsFromDB,
  deleteRatingInDB
};
