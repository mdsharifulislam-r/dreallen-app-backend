import { Schema, model } from 'mongoose';
import { ISong, SongModel } from './song.interface';

const songSchema = new Schema<ISong, SongModel>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    artist: {
      type: String,
      required: true,
      trim: true,
    },
    cover_image: {
      type: String,
    },
    releaseDate: {
      type: Date,
    },
    type:{
      type: String,
      default: 'AUDIO',
      enum: ['AUDIO', 'VIDEO'],
    },
    duration: {
      type: String,
    },
    viewsCount: {
      type: Number,
      default: 0,
    },
    playCount: {
      type: Number,
      default: 0,
    },
    audio: {
      type: String,
    },
    averageRating: {
      type: Number,
      default: 0,
    },
    ratingCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const Song = model<ISong, SongModel>('Song', songSchema);
