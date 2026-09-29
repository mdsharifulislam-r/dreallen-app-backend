import { Model, Types } from 'mongoose';
import { RATING_TARGET } from './rating.constant';

export interface IRating {
  _id?: Types.ObjectId;
  userId: Types.ObjectId;
  targetId: Types.ObjectId;
  rating: number;
  review?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type RatingModel = Model<IRating>;
