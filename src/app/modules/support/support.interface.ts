import { Model, Types } from 'mongoose';
import { SUPPORT_STATUS } from './support.constant';

export interface ISupport {
  _id?: Types.ObjectId;
  name: string;
  email: string;
  subject: string;
  feedback: string;
  userId?: Types.ObjectId;
  status?: SUPPORT_STATUS;
  createdAt?: Date;
  updatedAt?: Date;
}

export type SupportModel = Model<ISupport>;
