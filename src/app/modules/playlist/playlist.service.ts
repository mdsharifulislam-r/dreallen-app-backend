import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { IPlaylist } from './playlist.interface';
import { Playlist } from './playlist.model';
import QueryBuilder from '../../builder/QueryBuilder';
import { Song } from '../song/song.model';
import { Video } from '../video/video.model';
import mongoose from 'mongoose';

/**
 * Helper to populate media items (both Songs and Videos) in playlist.songs array
 */
const populatePlaylistMedia = async (playlist: any) => {
  if (!playlist) return playlist;

  const songsArray = playlist.songs || [];
  if (!Array.isArray(songsArray) || songsArray.length === 0) {
    return {
      ...playlist,
      songs: [],
      songCount: 0,
    };
  }

  const mediaIds = songsArray.map((s: any) => (s._id ? s._id : s));

  const [songs, videos] = await Promise.all([
    Song.find({ _id: { $in: mediaIds } }).lean(),
    Video.find({ _id: { $in: mediaIds } }).lean(),
  ]);

  const mediaMap = new Map<string, any>();
  songs.forEach(s => mediaMap.set(s._id.toString(), { ...s, mediaType: 'SONG' }));
  videos.forEach(v => mediaMap.set(v._id.toString(), { ...v, mediaType: 'VIDEO' }));

  const populatedSongs = mediaIds
    .map((id: any) => mediaMap.get(id.toString()))
    .filter(Boolean);

  return {
    ...playlist,
    songs: populatedSongs,
    songCount: populatedSongs.length,
  };
};

const populateMultiplePlaylistsMedia = async (playlists: any[]) => {
  if (!Array.isArray(playlists) || playlists.length === 0) return [];
  return await Promise.all(playlists.map(p => populatePlaylistMedia(p)));
};

const createPlaylistInDB = async (payload: Partial<IPlaylist>): Promise<IPlaylist> => {
  const playlist = await Playlist.create(payload);
  const result = await Playlist.findById(playlist._id)
    .populate('userId', 'name email image')
    .lean();

  return await populatePlaylistMedia(result);
};

const getAllPlaylistsFromDB = async (query: Record<string, any>) => {
  const playlistQuery = new QueryBuilder(
    Playlist.find().populate('userId', 'name email image'),
    query
  )
    .search(['name', 'description'])
    .fields()
    .filter()
    .paginate()
    .sort();

  const result = await playlistQuery.modelQuery.lean();
  const pagination = await playlistQuery.getPaginationInfo();
  const formattedData = await populateMultiplePlaylistsMedia(result);

  return {
    pagination,
    data: formattedData,
  };
};

const getMyPlaylistsFromDB = async (userId: string, query: Record<string, any>) => {
  const playlistQuery = new QueryBuilder(
    Playlist.find({ userId }).populate('userId', 'name email image'),
    query
  )
    .search(['name', 'description'])
    .fields()
    .filter()
    .paginate()
    .sort();

  const result = await playlistQuery.modelQuery.lean();
  const pagination = await playlistQuery.getPaginationInfo();
  const formattedData = await populateMultiplePlaylistsMedia(result);

  return {
    pagination,
    data: formattedData,
  };
};

const getPlaylistByIdFromDB = async (id: string): Promise<IPlaylist> => {
  const playlist = await Playlist.findById(id)
    .populate('userId', 'name email image')
    .lean();

  if (!playlist) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Playlist not found');
  }

  return await populatePlaylistMedia(playlist);
};

const updatePlaylistInDB = async (
  id: string,
  payload: Partial<IPlaylist>
): Promise<IPlaylist> => {
  const playlist = await Playlist.findById(id);
  if (!playlist) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Playlist not found');
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(id, payload, { new: true })
    .populate('userId', 'name email image')
    .lean();

  return await populatePlaylistMedia(updatedPlaylist);
};

const addSongToPlaylistInDB = async (
  id: string,
  songId: string
): Promise<IPlaylist> => {
  const playlist = await Playlist.findById(id);
  if (!playlist) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Playlist not found');
  }

  if (!songId || !mongoose.Types.ObjectId.isValid(songId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Song or Video ID');
  }

  const mediaObjectId = new mongoose.Types.ObjectId(songId);

  const [songExist, videoExist] = await Promise.all([
    Song.findById(mediaObjectId),
    Video.findById(mediaObjectId),
  ]);

  if (!songExist && !videoExist) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Song or Video not found');
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    id,
    { $addToSet: { songs: mediaObjectId } },
    { new: true }
  )
    .populate('userId', 'name email image')
    .lean();

  return await populatePlaylistMedia(updatedPlaylist);
};

const removeSongFromPlaylistInDB = async (
  id: string,
  songId: string
): Promise<IPlaylist> => {
  const playlist = await Playlist.findById(id);
  if (!playlist) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Playlist not found');
  }

  if (!songId || !mongoose.Types.ObjectId.isValid(songId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Song or Video ID');
  }

  const mediaObjectId = new mongoose.Types.ObjectId(songId);

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    id,
    { $pull: { songs: mediaObjectId } },
    { new: true }
  )
    .populate('userId', 'name email image')
    .lean();

  return await populatePlaylistMedia(updatedPlaylist);
};

const deletePlaylistFromDB = async (id: string): Promise<IPlaylist | null> => {
  const playlist = await Playlist.findByIdAndDelete(id);
  if (!playlist) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Playlist not found');
  }
  return playlist;
};

export const PlaylistService = {
  createPlaylistInDB,
  getAllPlaylistsFromDB,
  getMyPlaylistsFromDB,
  getPlaylistByIdFromDB,
  updatePlaylistInDB,
  addSongToPlaylistInDB,
  removeSongFromPlaylistInDB,
  deletePlaylistFromDB,
};
