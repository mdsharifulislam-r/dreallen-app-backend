import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { SongService } from './song.service';
import { getSingleFilePath } from '../../../shared/getFilePath';
import { getAudioDuration } from '../../../shared/getAudioDuration';

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
  const audio = getSingleFilePath(req.files, 'audio');
  const coverImage = getSingleFilePath(req.files, 'cover_image');

  let duration = req.body.duration;
  const audioFile = req.files && (req.files as any)['audio']?.[0];

  if (audioFile?.path) {
    const autoDuration = await getAudioDuration(audioFile.path);
    if (autoDuration) {
      duration = autoDuration;
    }
  }

  const data = { ...req.body, audio, cover_image: coverImage, duration };

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
