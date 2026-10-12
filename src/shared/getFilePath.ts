import { Request } from 'express';

type IFolderName =
  | 'images'
  | 'image'
  | 'media'
  | 'doc'
  | 'cover_image'
  | 'video'
  | 'audio';
type SpacesFile = Express.Multer.File & { location?: string };
type UploadedFiles = Request['files'];

export const getUploadedFiles = (files: UploadedFiles): Express.Multer.File[] => {
  if (!files) return [];
  return Array.isArray(files) ? files : Object.values(files).flat();
};

export const getSingleUploadedFile = (
  files: UploadedFiles,
  fieldName: IFolderName
): Express.Multer.File | undefined => {
  return getUploadedFiles(files).find((file) => file.fieldname === fieldName);
};

export const getSingleFilePath = (
  files: UploadedFiles,
  folderName: IFolderName
): string | undefined => {
  const file = getSingleUploadedFile(files, folderName) as SpacesFile | undefined;
  if (!file) return undefined;

  if (!file.location) {
    throw new Error(`Uploaded ${folderName} file is missing its Spaces URL`);
  }

  return file.location;
};

export const getMultipleFilesPath = (
  files: UploadedFiles,
  folderName: IFolderName
): string[] | undefined => {
  const folderFiles = getUploadedFiles(files).filter(
    (file) => file.fieldname === folderName
  ) as SpacesFile[];
  if (folderFiles.length === 0) return undefined;

  return folderFiles.map((file) => {
    if (!file.location) {
      throw new Error(`Uploaded ${folderName} file is missing its Spaces URL`);
    }

    return file.location;
  });
};
