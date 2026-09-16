import { Schema, model } from 'mongoose';
import { ISupport, SupportModel } from './support.interface';
import { SUPPORT_STATUS } from './support.constant';

const supportSchema = new Schema<ISupport, SupportModel>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    feedback: {
      type: String,
      required: true,
      trim: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    status: {
      type: String,
      enum: Object.values(SUPPORT_STATUS),
      default: SUPPORT_STATUS.PENDING,
    },
  },
  {
    timestamps: true,
  }
);

export const Support = model<ISupport, SupportModel>('Support', supportSchema);
