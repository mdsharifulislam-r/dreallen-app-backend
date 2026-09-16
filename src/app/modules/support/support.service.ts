import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import QueryBuilder from '../../builder/QueryBuilder';
import { SUPPORT_STATUS, supportSearchableFields } from './support.constant';
import { ISupport } from './support.interface';
import { Support } from './support.model';

const createSupportToDB = async (payload: ISupport): Promise<ISupport> => {
  const result = await Support.create(payload);
  return result;
};

const getAllSupportsFromDB = async (query: Record<string, any>) => {
  const supportQuery = new QueryBuilder(Support.find().populate('userId', 'name email image role'), query)
    .search(supportSearchableFields)
    .filter()
    .sort()
    .paginate()
    .fields();

  const data = await supportQuery.modelQuery;
  const pagination = await supportQuery.getPaginationInfo();

  return {
    pagination,
    data,
  };
};

const getMySupportsFromDB = async (userId: string, query: Record<string, any>) => {
  const supportQuery = new QueryBuilder(Support.find({ userId }), query)
    .search(supportSearchableFields)
    .filter()
    .sort()
    .paginate()
    .fields();

  const data = await supportQuery.modelQuery;
  const pagination = await supportQuery.getPaginationInfo();

  return {
    pagination,
    data,
  };
};

const getSingleSupportFromDB = async (id: string): Promise<ISupport> => {
  const result = await Support.findById(id).populate('userId', 'name email image role');
  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Support ticket not found');
  }
  return result;
};

const updateSupportStatusInDB = async (id: string, status: SUPPORT_STATUS): Promise<ISupport> => {
  const result = await Support.findByIdAndUpdate(
    id,
    { status },
    { new: true, runValidators: true }
  ).populate('userId', 'name email image role');

  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Support ticket not found');
  }
  return result;
};

const deleteSupportFromDB = async (id: string): Promise<ISupport> => {
  const result = await Support.findByIdAndDelete(id);
  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Support ticket not found');
  }
  return result;
};

export const SupportService = {
  createSupportToDB,
  getAllSupportsFromDB,
  getMySupportsFromDB,
  getSingleSupportFromDB,
  updateSupportStatusInDB,
  deleteSupportFromDB,
};
