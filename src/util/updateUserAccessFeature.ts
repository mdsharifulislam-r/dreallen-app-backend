import { User } from '../app/modules/user/user.model';
import { ObjectId } from 'mongoose';

export const updateUserAccessFeature = async (userId: ObjectId): Promise<boolean> => {
  if (!userId) return false;

  const user = await User.findById(userId);
  if (!user) return false;

  return true;
};