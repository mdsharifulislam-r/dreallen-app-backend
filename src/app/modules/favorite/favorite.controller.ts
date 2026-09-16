import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { FavoriteService } from './favorite.service';
import { FAVORITE_TARGET } from './favorite.constant';
import { Song } from '../song/song.model';
import { Video } from '../video/video.model';

const toggleFavorite = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { targetId } = req.params;

  const song = await Song.findOne({ _id: targetId });
  const video = await Video.findOne({ _id: targetId });
  
  if (!song && !video) {
    return sendResponse(res, {
      statusCode: StatusCodes.NOT_FOUND,
      success: false,
      message: 'Target media not found',
      data: null
    });
  }

  const targetType = song ? FAVORITE_TARGET.SONG : FAVORITE_TARGET.VIDEO;

  const result = await FavoriteService.toggleFavoriteInDB({
    userId,
    targetId,
    targetType
  });

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.favorited ? 'Added to favorites' : 'Removed from favorites',
    data: result,
  });
});

const getMyFavorites = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const targetType = req.query?.targetType as FAVORITE_TARGET | undefined;

  const result = await FavoriteService.getMyFavoritesFromDB(
    userId,
    targetType,
    req.query as Record<string, any>
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Favorites retrieved successfully',
    pagination: result.pagination,
    data: result.data,
  });
});

const checkFavorite = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { targetId } = req.params;
  const targetType = (
    req.params.targetType ||
    req.query?.targetType ||
    FAVORITE_TARGET.SONG
  ) as FAVORITE_TARGET;

  const result = await FavoriteService.checkFavoriteInDB(
    userId,
    targetId,
    targetType
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Favorite status retrieved successfully',
    data: result,
  });
});

export const FavoriteController = {
  toggleFavorite,
  getMyFavorites,
  checkFavorite,
};
