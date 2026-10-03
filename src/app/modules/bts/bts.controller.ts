import { Request, Response, NextFunction } from 'express';
import { BtsServices } from './bts.service';
import catchAsync from '../../../shared/catchAsync';
import { getSingleFilePath } from '../../../shared/getFilePath';

const createBts = catchAsync(async (req: Request, res: Response) => {
    req.body.author = req.user?.id
    const image = getSingleFilePath(req.files, 'image');
    if(image) req.body.thumbnail = image
    const result = await BtsServices.createBts(req.body);
    res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Bts created successfully',
        data: result,
    });
});


const getAllBts = catchAsync(async (req: Request, res: Response) => {
    const result = await BtsServices.getAllBts(req.query);
    res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Bts retrieved successfully',
        data: result.data,
        pagination: result.pagination
    });
});


const getBtsById = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await BtsServices.getBtsById(id);
    res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Bts retrieved successfully',
        data: result,
    });
});


const updateBts = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const image = getSingleFilePath(req.files, 'image');
    if(image) req.body.thumbnail = image
    const result = await BtsServices.updateBts(id, req.body);
    res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Bts updated successfully',
        data: result,
    });
});


const deleteBts = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await BtsServices.deleteBts(id);
    res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Bts deleted successfully',
        data: result,
    });
});


export const BtsController = {
    createBts,
    getAllBts,
    getBtsById,
    updateBts,
    deleteBts
};
