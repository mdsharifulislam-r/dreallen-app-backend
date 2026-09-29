import { Schema, model } from 'mongoose';
import { IBts, BtsModel } from './bts.interface'; 

const btsSchema = new Schema<IBts, BtsModel>({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  video: {
    type: String,
    required: true,
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  thumbnail: {
    type: String,
  },
}, {
  timestamps: true,
});

export const Bts = model<IBts, BtsModel>('Bts', btsSchema);
