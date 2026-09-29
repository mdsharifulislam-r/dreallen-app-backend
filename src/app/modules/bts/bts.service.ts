import QueryBuilder from '../../builder/QueryBuilder';
import { BtsModel, IBts } from './bts.interface';
import { Bts } from './bts.model';

const createBtsInDB = async (payload: IBts): Promise<IBts> => {
    console.log(payload)
    const result = await Bts.create(payload);
    return result;
};

const updateBtsInDB = async (id: string, payload: Partial<IBts>): Promise<IBts> => {
  const result = await Bts.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
  if (!result) {
    throw new Error('Bts not found');
  }
  return result;
};

const deleteBtsInDB = async (id: string): Promise<IBts> => {
  const result = await Bts.findByIdAndDelete(id);
  if (!result) {
    throw new Error('Bts not found');
  }
  return result;
};

const getBtsByIdFromDB = async (id: string)=> {
  const result = await Bts.findById(id).populate('author', 'name email image').lean();
  if (!result) {
    throw new Error('Bts not found');
  }
  return result;
};

const getAllBtsFromDB = async (query: Record<string, any>)=> {
    const btsQuery = new QueryBuilder(Bts.find(),query).paginate().sort().search(['title','description']).fields().filter();
    const result = await btsQuery.modelQuery.populate('author', 'name email image').lean();
    const pagination = await btsQuery.getPaginationInfo();
    return {
        pagination,
        data: result,
    };
};

export const BtsServices = {
    createBts: createBtsInDB,
    updateBts: updateBtsInDB,
    deleteBts: deleteBtsInDB,
    getBtsById: getBtsByIdFromDB,
    getAllBts: getAllBtsFromDB
};
