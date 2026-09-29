import { model, Schema } from 'mongoose';
import {
  BusinessDescriptionModel,
  IBusinessDescription,
} from './businessDescription.interface';

const businessDescriptionSchema = new Schema<
  IBusinessDescription,
  BusinessDescriptionModel
>(
  {
    _id: {
      type: String,
      default: 'business-description',
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    pdfLink: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

export const BusinessDescription = model<
  IBusinessDescription,
  BusinessDescriptionModel
>('BusinessDescription', businessDescriptionSchema);