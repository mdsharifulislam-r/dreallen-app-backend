import { Model } from 'mongoose';

export interface IBusinessDescription {
  _id?: string;
  description: string;
  pdfLink: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type BusinessDescriptionModel = Model<IBusinessDescription>;