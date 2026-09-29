import { Model,Types} from 'mongoose';

export type IBts = {
  title: string;
  description: string;
  thumbnail?: string;
  video : string;
  author : Types.ObjectId;
};

export type BtsModel = Model<IBts>;
