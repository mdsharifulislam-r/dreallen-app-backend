import { Model, Types } from 'mongoose';

export interface IVideo {
  _id?: Types.ObjectId;
  title: string;
  artist: string;
  cover_image: string;
  releaseDate: Date;
  duration: string;
  video: string;
  rating: number;
  viewsCount: number;
  type: 'AUDIO' | 'VIDEO';
  isFavorite: boolean;
  isFeatured?: boolean;
  playCount: number;
  averageRating?: number;
  avgRating?: number;
  ratingCount?: number;
  myRating?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type VideoModel = Model<IVideo>;
