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
  });

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Rating saved successfully',
    data: result,
  });
});

export const RatingController = {
  giveRating,
};
