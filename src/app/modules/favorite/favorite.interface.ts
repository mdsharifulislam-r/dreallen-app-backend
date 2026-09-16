import { Model, Types } from 'mongoose';
import { FAVORITE_TARGET } from './favorite.constant';

export interface IFavorite {
  _id?: Types.ObjectId;
  userId: Types.ObjectId;
  targetId: Types.ObjectId | string;
  targetType?: FAVORITE_TARGET;
  createdAt?: Date;
  updatedAt?: Date;
}

export type FavoriteModel = Model<IFavorite>;
