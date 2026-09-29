import { Model, Types } from 'mongoose';
import { ISong } from '../song/song.interface';

export interface IPlaylist {
  _id?: Types.ObjectId;
  userId: Types.ObjectId;
  name: string;
  description?: string;
  coverImage?: string;
  songs: Types.ObjectId[] | ISong[];
  isPublic: boolean;
  songCount?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type PlaylistModel = Model<IPlaylist>;


export interface IPlaylistSong {
  playlist: Types.ObjectId;
  song: Types.ObjectId;
  type:"Song" | "Video";
}

export type PlaylistSongModel = Model<IPlaylistSong>;