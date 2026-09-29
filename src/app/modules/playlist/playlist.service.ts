import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { IPlaylist } from './playlist.interface';
import { Playlist, PlaylistSong } from './playlist.model';
import QueryBuilder from '../../builder/QueryBuilder';
import { Song } from '../song/song.model';
import { Video } from '../video/video.model';
import mongoose from 'mongoose';
import { sendNotifications } from '../../../helpers/notificationHelper';

/**
 * Helper to populate media items (both Songs and Videos) in playlist.songs array
 */

const createPlaylistInDB = async (payload: Partial<IPlaylist>) => {
  const playlist = await Playlist.create(payload);
  const result = await Playlist.findById(playlist._id)
    .populate('userId', 'name email image')
    .lean();

  return result;
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

  return {
    pagination,
    data: result,
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

  return {
    pagination,
    data: result,
  };
};

const getPlaylistByIdFromDB = async (id: string): Promise<IPlaylist> => {
  const playlist = await Playlist.findById(id)
    .populate('userId', 'name email image')
    .lean();

  if (!playlist) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Playlist not found');
  }

  return playlist;
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

  return playlist;
};

const addSongToPlaylistInDB = async (
  id: string,
  songId: string
) => {
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

  const isExistPlaylistSong = await PlaylistSong.findOne({
    playlist: playlist._id,
    song: mediaObjectId,
  })

  if (isExistPlaylistSong) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Song already exist in playlist');
  }
  
  sendNotifications(
    {
      title: 'New song added to playlist',
      message: `New song added to playlist ${playlist.name}`,
      isRead: false,
      receiver: [playlist.userId],
      filePath:"other",
      referenceId: playlist._id,
    }
  )
  return await PlaylistSong.create({
    playlist: playlist._id,
    song: mediaObjectId,
    type: songExist ? 'Song' : 'Video',
  })


};

const removeSongFromPlaylistInDB = async (
  id: string,
  songId: string
) => {
  const playlist = await Playlist.findById(id);
  if (!playlist) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Playlist not found');
  }

  if (!songId || !mongoose.Types.ObjectId.isValid(songId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Song or Video ID');
  }
  return await PlaylistSong.deleteOne({
    playlist: playlist._id,
    song: new mongoose.Types.ObjectId(songId),
  })

};

const deletePlaylistFromDB = async (id: string): Promise<IPlaylist | null> => {
  const playlist = await Playlist.findByIdAndDelete(id);
  if (!playlist) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Playlist not found');
  }
  return playlist;
};


const getSongsByPlaylistId = async (id: string,query: Record<string, any>) => {
  const playlist = await Playlist.findById(id);
  if (!playlist) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Playlist not found');
  }

  const playlistQuery = new QueryBuilder(
    PlaylistSong.find({ playlist: playlist._id },{_id:1,song:1,type:1}),
    query
  )
    .fields()
    .filter()
    .paginate()
    .sort()

  const [result, pagination] = await Promise.all([
    playlistQuery.modelQuery.populate('song').lean(),
    playlistQuery.getPaginationInfo(),
  ])

  return {
    pagination,
    data: result,
  };
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
  getSongsByPlaylistId
};
