import { Schema, model } from 'mongoose';
import { IPlaylist, PlaylistModel } from './playlist.interface';

const playlistSchema = new Schema<IPlaylist, PlaylistModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    coverImage: {
      type: String,
    },
    songs: [
      {
        type: Schema.Types.ObjectId,
        default: [],
      },
    ],
    isPublic: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual field to derive songCount dynamically from songs.length
playlistSchema.virtual('songCount').get(function () {
  return Array.isArray(this.songs) ? this.songs.length : 0;
});

export const Playlist = model<IPlaylist, PlaylistModel>(
  'Playlist',
  playlistSchema
);
