import express from 'express';
import { BtsController } from './bts.controller';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import fileUploadHandler from '../../middlewares/fileUploadHandler';
import validateRequest from '../../middlewares/validateRequest';
import { BtsValidations } from './bts.validation';

const router = express.Router();

router.route("/")
    .post(auth(),fileUploadHandler(),validateRequest(BtsValidations.createBtsZodSchema),BtsController.createBts)
    .get(auth(),BtsController.getAllBts)

router.route("/:id")
    .get(auth(),BtsController.getBtsById)
    .patch(auth(),fileUploadHandler(),validateRequest(BtsValidations.updateBtsZodSchema),BtsController.updateBts)
    .delete(auth(),BtsController.deleteBts)

export const BtsRoutes = router;
