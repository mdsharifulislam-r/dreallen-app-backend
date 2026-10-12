import { NextFunction, Request } from 'express';
import fs, { createReadStream } from 'fs';
import { StatusCodes } from 'http-status-codes';
import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import { randomUUID } from 'crypto';
import ApiError from '../../errors/ApiError';
import { getUploadedFiles } from '../../shared/getFilePath';
import { uploadToSpaces } from '../../shared/uploadToSpaces';

const fileUploadHandler = () => {
  //create upload folder
  const baseUploadDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(baseUploadDir)) {
    fs.mkdirSync(baseUploadDir, { recursive: true });
  }

  //folder create for different file
  const createDir = (dirPath: string) => {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  };

  //create filename
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      let uploadDir;
      switch (file.fieldname) {
        case 'image':
          uploadDir = path.join(baseUploadDir, 'image');
          break;
        case 'cover_image':
          uploadDir = path.join(baseUploadDir, 'cover_image');
          break;
        case 'media':
          uploadDir = path.join(baseUploadDir, 'media');
          break;
        case 'doc':
          uploadDir = path.join(baseUploadDir, 'doc');
          break;
        case 'audio':
          uploadDir = path.join(baseUploadDir, 'audio');
          break;
        case 'video':
          uploadDir = path.join(baseUploadDir, 'video');
          break;
        default:
          throw new ApiError(StatusCodes.BAD_REQUEST, 'File is not supported');
      }
      createDir(uploadDir);
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const fileExt = path.extname(file.originalname);
      const fileName = path
        .basename(file.originalname)
          .replace(fileExt, '')
          .toLowerCase()
          .split(' ')
          .join('-') +
        '-' +
        randomUUID();
      cb(null, fileName + fileExt);
    },
  });

  //file filter
  const filterFilter = (req: Request, file: any, cb: FileFilterCallback) => {
    if (file.fieldname === 'image' || file.fieldname === 'cover_image') {
      if (
        file.mimetype === 'image/jpeg' ||
        file.mimetype === 'image/png' ||
        file.mimetype === 'image/jpg' ||
        file.mimetype === 'image/webp' ||
        file.mimetype === 'image/gif' ||
        file.mimetype === 'image/bmp'
      ) {
        cb(null, true);
      } else {
        cb(
          new ApiError(
            StatusCodes.BAD_REQUEST,
            '  Only webp, gif, bmp, .jpeg, .png, .jpg file supported'
          )
        );
      }
    }
    else if (file.fieldname === 'audio') {
      if (file.mimetype === 'audio/mpeg' || file.mimetype === 'audio/mp3' || file.mimetype === 'audio/wav') {
        cb(null, true);
      } else {
        cb(
          new ApiError(
            StatusCodes.BAD_REQUEST,
            'Only .mp3, .wav file supported'
          )
        );
      }
    } else if (file.fieldname === 'video') {
      if (file.mimetype === 'video/mp4' || file.mimetype === 'video/mpeg') {
        cb(null, true);
      } else {
        cb(
          new ApiError(
            StatusCodes.BAD_REQUEST,
            'Only .mp4 file supported'
          )
        );
      }
    } else if (file.fieldname === 'media') {
      if (file.mimetype === 'video/mp4' || file.mimetype === 'audio/mpeg') {
        cb(null, true);
      } else {
        cb(
          new ApiError(
            StatusCodes.BAD_REQUEST,
            'Only .mp4, .mp3, file supported'
          )
        );
      }
    } else if (file.fieldname === 'doc') {
      if (file.mimetype === 'application/pdf') {
        cb(null, true);
      } else {
        cb(new ApiError(StatusCodes.BAD_REQUEST, 'Only pdf supported'));
      }
    } else {
      cb(new ApiError(StatusCodes.BAD_REQUEST, 'This file is not supported'));
    }
  };

  const parseFiles = multer({
    storage: storage,
    fileFilter: filterFilter,
  }).fields([
    { name: 'image', maxCount: 3 },
    { name: 'cover_image', maxCount: 3 },
    { name: 'media', maxCount: 3 },
    { name: 'doc', maxCount: 3 },
    { name: 'audio', maxCount: 3 },
    { name: 'video', maxCount: 3 },
  ]);

  return (req: any, res:any, next: NextFunction) => {
    parseFiles(req, res, (parseError) => {
      const files = getUploadedFiles(req.files);
      let cleanupScheduled = false;
      const scheduleCleanup = () => {
        if (cleanupScheduled) return;
        cleanupScheduled = true;

        const cleanup = () => {
          void Promise.all(
            files
              .filter((file) => file.path)
              .map((file) =>
                fs.promises.unlink(file.path).catch((error: NodeJS.ErrnoException) => {
                  if (error.code !== 'ENOENT') throw error;
                })
              )
          ).catch((error) => {
            console.error('Failed to remove temporary upload files:', error);
          });
        };

        if (res.destroyed) {
          cleanup();
        } else {
          res.once('finish', cleanup);
          res.once('close', cleanup);
        }
      };

      if (parseError) {
        scheduleCleanup();
        return next(parseError);
      }

      Promise.allSettled(
        files.map(async (file) => {
          if (!file.path) {
            throw new Error('Uploaded file is missing its temporary file path');
          }

          const location = await uploadToSpaces({
            body: createReadStream(file.path),
            fileName: file.originalname,
            contentType: file.mimetype,
            folder: file.fieldname,
            contentLength: file.size,
          });
          Object.assign(file, { location });
        })
      )
        .then((results) => {
          scheduleCleanup();
          const failedUpload = results.find(
            (result): result is PromiseRejectedResult =>
              result.status === 'rejected'
          );
          if (failedUpload) return next(failedUpload.reason);
          next();
        });
    });
  };
};

export default fileUploadHandler;
