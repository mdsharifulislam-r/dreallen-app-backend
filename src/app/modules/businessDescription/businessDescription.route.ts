import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middlewares/auth';
import fileUploadHandler from '../../middlewares/fileUploadHandler';
import validateRequest from '../../middlewares/validateRequest';
import { BusinessDescriptionController } from './businessDescription.controller';
import { BusinessDescriptionValidation } from './businessDescription.validation';

const router = express.Router();

router
  .route('/')
  .post(
    auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
    fileUploadHandler(),
    validateRequest(
      BusinessDescriptionValidation.upsertBusinessDescriptionZodSchema
    ),
    BusinessDescriptionController.upsertBusinessDescription
  )
  .get(BusinessDescriptionController.getBusinessDescription);

export const BusinessDescriptionRoutes = router;