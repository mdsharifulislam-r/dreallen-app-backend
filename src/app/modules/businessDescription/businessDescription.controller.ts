import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import { getSingleFilePath } from '../../../shared/getFilePath';
import sendResponse from '../../../shared/sendResponse';
import { BusinessDescriptionService } from './businessDescription.service';

const upsertBusinessDescription = catchAsync(
  async (req: Request, res: Response) => {
    const pdfLink = getSingleFilePath(req.files, 'doc');
    const result = await BusinessDescriptionService.upsertBusinessDescription(
      req.body.description,
      pdfLink
    );

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Business description saved successfully',
      data: result,
    });
  }
);

const getBusinessDescription = catchAsync(
  async (_req: Request, res: Response) => {
    const result = await BusinessDescriptionService.getBusinessDescription();

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Business description retrieved successfully',
      data: result,
    });
  }
);

export const BusinessDescriptionController = {
  upsertBusinessDescription,
  getBusinessDescription,
};