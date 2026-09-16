import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { SupportService } from './support.service';

const createSupport = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const payload = {
    ...req.body,
    ...(userId ? { userId } : {}),
  };

  const result = await SupportService.createSupportToDB(payload);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Support request submitted successfully',
    data: result,
  });
});

const getAllSupports = catchAsync(async (req: Request, res: Response) => {
  const result = await SupportService.getAllSupportsFromDB(req.query as Record<string, any>);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Support requests retrieved successfully',
    pagination: result.pagination,
    data: result.data,
  });
});

const getMySupports = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const result = await SupportService.getMySupportsFromDB(userId, req.query as Record<string, any>);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Your support requests retrieved successfully',
    pagination: result.pagination,
    data: result.data,
  });
});

const getSingleSupport = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await SupportService.getSingleSupportFromDB(id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Support request retrieved successfully',
    data: result,
  });
});

const updateSupportStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const result = await SupportService.updateSupportStatusInDB(id, status);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Support request status updated successfully',
    data: result,
  });
});

const deleteSupport = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await SupportService.deleteSupportFromDB(id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Support request deleted successfully',
    data: result,
  });
});

export const SupportController = {
  createSupport,
  getAllSupports,
  getMySupports,
  getSingleSupport,
  updateSupportStatus,
  deleteSupport,
};
