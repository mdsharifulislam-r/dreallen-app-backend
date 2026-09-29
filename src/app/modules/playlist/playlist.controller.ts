import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { PlaylistService } from './playlist.service';
import { getSingleFilePath } from '../../../shared/getFilePath';

const createPlaylist = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const coverImage =
    getSingleFilePath(req.files, 'cover_image') ||
    getSingleFilePath(req.files, 'image') ||
    req.body.coverImage;

  const data = {
    ...req.body,
    userId,
    coverImage,
  };

  const result = await PlaylistService.createPlaylistInDB(data);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Playlist created successfully',
    data: result,
  });
});

const getAllPlaylists = catchAsync(async (req: Request, res: Response) => {
  const result = await PlaylistService.getAllPlaylistsFromDB(
    req.query as Record<string, any>
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Playlists retrieved successfully',
    pagination: result.pagination,
    data: result.data,
  });
});

const getMyPlaylists = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const result = await PlaylistService.getMyPlaylistsFromDB(
    userId,
    req.query as Record<string, any>
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'My playlists retrieved successfully',
    pagination: result.pagination,
    data: result.data,
  });
});

const getPlaylistById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await PlaylistService.getPlaylistByIdFromDB(id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Playlist retrieved successfully',
    data: result,
  });
});

const updatePlaylist = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const coverImage =
    getSingleFilePath(req.files, 'cover_image') ||
    getSingleFilePath(req.files, 'image') ||
    req.body.coverImage;

  const data = { ...req.body };
  if (coverImage) {
    data.coverImage = coverImage;
  }

  const result = await PlaylistService.updatePlaylistInDB(id, data);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Playlist updated successfully',
    data: result,
  });
});

const addSongToPlaylist = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const songId = req.body.songId || req.body.song;
  const result = await PlaylistService.addSongToPlaylistInDB(id, songId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Song added to playlist successfully',
    data: result,
  });
});

const removeSongFromPlaylist = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const songId = req.body.songId || req.body.song;
  const result = await PlaylistService.removeSongFromPlaylistInDB(id, songId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Song removed from playlist successfully',
    data: result,
  });
});

const deletePlaylist = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await PlaylistService.deletePlaylistFromDB(id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Playlist deleted successfully',
    data: result,
  });
});

const getPlaylistSongs = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await PlaylistService.getSongsByPlaylistId(id, req.query);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Playlist songs retrieved successfully',
    data: result.data,
    pagination: result.pagination,
  });
});

export const PlaylistController = {
  createPlaylist,
  getAllPlaylists,
  getMyPlaylists,
  getPlaylistById,
  updatePlaylist,
  addSongToPlaylist,
  removeSongFromPlaylist,
  deletePlaylist,
  getPlaylistSongs,
};
