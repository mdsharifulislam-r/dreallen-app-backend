import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { SongService } from './song.service';
import {
  getSingleFilePath,
  getSingleUploadedFile,
} from '../../../shared/getFilePath';
import { getAudioDuration } from '../../../shared/getAudioDuration';
import path from 'path';

const getAllSongs = catchAsync(async (req: Request, res: Response) => {
  const result = await SongService.getAllSongsFromDB(req.query as Record<string, any>);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Songs retrieved successfully',
    pagination: result.pagination,
    data: result.data,
  });
});

const getSongById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await SongService.getSongByIdFromDB(id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Song retrieved successfully',
    data: result,
  });
});

const toggleFavorite = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;
  const result = await SongService.toggleFavoriteInDB(id, userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.isFavorite
      ? 'Song added to favorites'
      : 'Song removed from favorites',
    data: result,
  });
});

const recordPlay = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await SongService.recordPlayInDB(id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Playback recorded successfully',
    data: result,
  });
});

const createSong = catchAsync(async (req: Request, res: Response) => {
  const coverImage = getSingleFilePath(req.files, 'cover_image');
  const audioFile = getSingleUploadedFile(req.files, 'audio');

  let duration = req.body.duration;

  const audioPath =
    audioFile?.path ||
    (req.body.audio && !/^https?:\/\//i.test(req.body.audio)
      ? path.join(process.cwd(), 'uploads', req.body.audio)
      : undefined);
  if (audioPath) {
    const autoDuration = await getAudioDuration(audioPath);
    if (autoDuration) {
      duration = autoDuration;
    }
  }

  const data = {
    ...req.body,
    ...(audioFile && { audio: getSingleFilePath(req.files, 'audio') }),
    cover_image: coverImage,
    duration,
  };

  const result = await SongService.createSongInDB(data);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Song created successfully',
    data: result,
  });
});

export const SongController = {
  getAllSongs,
  getSongById,
  toggleFavorite,
  recordPlay,
  createSong,
};
