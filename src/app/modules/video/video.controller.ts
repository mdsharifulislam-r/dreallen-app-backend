import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { VideoService } from './video.service';
import { getSingleFilePath } from '../../../shared/getFilePath';
import { getAudioDuration } from '../../../shared/getAudioDuration';

const getAllVideos = catchAsync(async (req: Request, res: Response) => {
  const result = await VideoService.getAllVideosFromDB(req.query as Record<string, any>);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Videos retrieved successfully',
    pagination: result.pagination,
    data: result.data,
  });
});

const getVideoById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;
  
  const result = await VideoService.getVideoByIdFromDB(id, userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Video retrieved successfully',
    data: result,
  });
});

const toggleFavorite = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;
  const result = await VideoService.toggleFavoriteInDB(id, userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.isFavorite
      ? 'Video added to favorites'
      : 'Video removed from favorites',
    data: result,
  });
});

const recordPlay = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await VideoService.recordPlayInDB(id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Playback recorded successfully',
    data: result,
  });
});

const createVideo = catchAsync(async (req: Request, res: Response) => {
  const video = getSingleFilePath(req.files, 'video');
  const coverImage = getSingleFilePath(req.files, 'cover_image');

  let duration = req.body.duration;
  const videoFile = req.files && (req.files as any)['video']?.[0];

  if (videoFile?.path) {
    const autoDuration = await getAudioDuration(videoFile.path);
    if (autoDuration) {
      duration = autoDuration;
    }
  }

  const data = { ...req.body, video, cover_image: coverImage, duration };

  const result = await VideoService.createVideoInDB(data);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Video created successfully',
    data: result,
  });
});

const toggleFeatured = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await VideoService.toggleFeaturedInDB(id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.isFeatured
      ? 'Video marked as featured'
      : 'Video removed from featured',
    data: result,
  });
});

const getFeaturedVideos = catchAsync(async (req: Request, res: Response) => {
  const result = await VideoService.getFeaturedVideosFromDB(req.query as Record<string, any>);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Featured videos retrieved successfully',
    pagination: result.pagination,
    data: result.data,
  });
});

export const VideoController = {
  getAllVideos,
  getVideoById,
  toggleFavorite,
  recordPlay,
  createVideo,
  toggleFeatured,
  getFeaturedVideos,
};
