import { Schema, model } from 'mongoose';
import { IFavorite, FavoriteModel } from './favorite.interface';
import { FAVORITE_TARGET } from './favorite.constant';

const favoriteSchema = new Schema<IFavorite, FavoriteModel>(
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
    targetType: {
      type: String,
      required: true,
      enum: Object.values(FAVORITE_TARGET),
    },
  },
  {
    timestamps: true,
  }
);

favoriteSchema.index({ userId: 1, targetId: 1, targetType: 1 }, { unique: true });

export const Favorite = model<IFavorite, FavoriteModel>('Favorite', favoriteSchema);
