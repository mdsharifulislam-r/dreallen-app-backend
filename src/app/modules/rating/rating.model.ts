import { Schema, model } from 'mongoose';
import { IRating, RatingModel } from './rating.interface';
import { Song } from '../song/song.model';
import { Video } from '../video/video.model';
import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';

const ratingSchema = new Schema<IRating, RatingModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    review: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

ratingSchema.index({ userId: 1, targetId: 1 });

ratingSchema.pre('save',async function (next) {

  const isExistSong = await Song.findById(this.targetId);
  const isExistVideo = await Video.findById(this.targetId);
  if (!isExistSong && !isExistVideo) {
    throw new ApiError(StatusCodes.BAD_REQUEST, ' Media not found');
  }
  const avgExsitingRating = await Rating.aggregate([
    { $match: { targetId: this.targetId } },
    { $group: { _id: null, avgRating: { $avg: '$rating' }, totalRatings: { $sum: 1 }} },
  ])

  const avgRating = avgExsitingRating[0]?.avgRating || 0;
  const totalRatings = avgExsitingRating[0]?.totalRatings || 0;

  if(isExistSong){
    await Song.updateOne(
      { _id: this.targetId },
      { $set: { averageRating: avgRating, ratingCount: totalRatings } },
    )
  }

  if(isExistVideo){
    await Video.updateOne(
      { _id: this.targetId },
      { $set: { avgRating: avgRating, ratingCount: totalRatings } },
    )
  }

  
});

export const Rating = model<IRating, RatingModel>('Rating', ratingSchema);
