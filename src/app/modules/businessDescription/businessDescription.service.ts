import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { BusinessDescription } from './businessDescription.model';

const upsertBusinessDescription = async (
  description: string,
  pdfLink?: string
) => {
  const current = await BusinessDescription.findById('business-description');

  if (!current && !pdfLink) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'A PDF document is required');
  }

  return BusinessDescription.findByIdAndUpdate(
    'business-description',
    {
      $set: {
        description,
        ...(pdfLink ? { pdfLink } : {}),
      },
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    }
  );
};

const getBusinessDescription = async () => {
  return BusinessDescription.findById('business-description');
};

export const BusinessDescriptionService = {
  upsertBusinessDescription,
  getBusinessDescription,
};