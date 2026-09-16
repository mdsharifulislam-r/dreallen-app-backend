import { Model, Types } from 'mongoose';

export interface ISong {
  _id?: Types.ObjectId;
  title: string;
  artist: string;
  cover_image: string;
  releaseDate: Date;
  type: 'AUDIO' | 'VIDEO';
  duration: string;
  audio: string;
  rating: number;
  viewsCount: number;
  isFavorite: boolean;
  playCount: number;
  averageRating?: number;
  avgRating?: number;
  ratingCount?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type SongModel = Model<ISong>;
