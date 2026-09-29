import { Schema, model } from 'mongoose';
import { IVideo, VideoModel } from './video.interface';

const videoSchema = new Schema<IVideo, VideoModel>(
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
    type:{
      type: String,
      default: 'VIDEO',
      enum: ['AUDIO', 'VIDEO'],
    },
    releaseDate: {
      type: Date,
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
    video: {
      type: String,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    avgRating: {
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

export const Video = model<IVideo, VideoModel>('Video', videoSchema);
