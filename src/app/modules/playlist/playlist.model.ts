import { Schema, model } from 'mongoose';
import { IPlaylist, IPlaylistSong, PlaylistModel, PlaylistSongModel } from './playlist.interface';

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


const playlistSongSchema = new Schema<IPlaylistSong, PlaylistSongModel>({
  playlist: {
    type: Schema.Types.ObjectId,
    ref: 'Playlist',
    required: true,
  },
  song: {
    type: Schema.Types.ObjectId,
    refPath: 'type',
    required: true,
  },
  type: {
    type: String,
    enum: ['Song', 'Video'],
    required: true,
  },
});

playlistSongSchema.pre('save', async function (next) {

  await Playlist.findOneAndUpdate({_id:this.playlist},{$inc:{songCount:1}})
  next();
});

export const PlaylistSong = model<IPlaylistSong, PlaylistSongModel>('PlaylistSong', playlistSongSchema);
