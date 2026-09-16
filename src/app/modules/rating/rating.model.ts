import { Schema, model } from 'mongoose';
import { IRating, RatingModel } from './rating.interface';

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
  },
  {
    timestamps: true,
  }
);

ratingSchema.index({ userId: 1, targetId: 1 }, { unique: true });

export const Rating = model<IRating, RatingModel>('Rating', ratingSchema);
