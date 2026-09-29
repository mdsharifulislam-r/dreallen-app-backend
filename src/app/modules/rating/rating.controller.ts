import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { RatingService } from './rating.service';

const giveRating = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { targetId, rating } = req.body;

  const result = await RatingService.giveRatingInDB({
    userId,
    targetId,
    rating,
    review: req.body?.review
  });

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Rating saved successfully',
    data: result,
  });
});


const getAllRatings = catchAsync(async (req: Request, res: Response) => {
  const result = await RatingService.getReviewsFromDB(req.params.id,req.query as Record<string, any>);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Ratings retrieved successfully',
    pagination: result.pagination,
    data: result.data,
  });
});


const deleteRating = catchAsync(async (req: Request, res: Response) => {
  const result = await RatingService.deleteRatingInDB(req.params.id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Rating deleted successfully',
    data: result,
  });
});

export const RatingController = {
  giveRating,
  getAllRatings,
  deleteRating
};
