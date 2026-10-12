import { createHash, randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import { uploadToSpaces } from '../shared/uploadToSpaces';

const uploadDir = path.join(process.cwd(), 'uploads', 'chunks');

const getChunkPath = (directory: string, index: number): string =>
  path.join(directory, `chunk-${index}.part`);

export const handleChunkUpload = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const chunk = req.file;

  if (!chunk?.buffer) {
    return res.status(400).json({ status: 'error', message: 'No chunk received' });
  }

  const originalname =
    typeof req.body.originalname === 'string'
      ? path.basename(req.body.originalname)
      : '';
  const chunkIndex = Number(req.body.chunkIndex);
  const totalChunks = Number(req.body.totalChunks);

  if (
    !originalname ||
    originalname === '.' ||
    originalname === '..' ||
    !Number.isSafeInteger(chunkIndex) ||
    !Number.isSafeInteger(totalChunks) ||
    totalChunks < 1 ||
    totalChunks > 100000 ||
    chunkIndex < 0 ||
    chunkIndex >= totalChunks
  ) {
    return res.status(400).json({
      status: 'error',
      message: 'A valid originalname, chunkIndex, and totalChunks are required',
    });
  }

  const uploadKey =
    typeof req.body.uploadId === 'string' && req.body.uploadId.length > 0
      ? req.body.uploadId
      : originalname;
  const directoryName = createHash('sha256').update(uploadKey).digest('hex');
  const directory = path.join(uploadDir, directoryName);
  const metadataPath = path.join(directory, 'metadata.json');
  const lockPath = path.join(directory, 'finalizing');

  try {
    await fs.promises.mkdir(directory, { recursive: true });

    const metadata = JSON.stringify({ originalname, totalChunks });
    const temporaryMetadataPath = path.join(
      directory,
      `metadata-${randomUUID()}.tmp`
    );
    try {
      await fs.promises.writeFile(temporaryMetadataPath, metadata, {
        flag: 'wx',
      });
      await fs.promises.link(temporaryMetadataPath, metadataPath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;

      const existingMetadata = await fs.promises.readFile(metadataPath, 'utf8');
      if (existingMetadata !== metadata) {
        return res.status(400).json({
          status: 'error',
          message: 'Chunk metadata does not match the existing upload',
        });
      }
    } finally {
      await fs.promises
        .unlink(temporaryMetadataPath)
        .catch((error: NodeJS.ErrnoException) => {
          if (error.code !== 'ENOENT') throw error;
        });
    }

    const chunkPath = getChunkPath(directory, chunkIndex);
    const temporaryChunkPath = path.join(
      directory,
      `chunk-${chunkIndex}-${randomUUID()}.tmp`
    );
    try {
      await fs.promises.writeFile(temporaryChunkPath, chunk.buffer, {
        flag: 'wx',
      });
      await fs.promises.link(temporaryChunkPath, chunkPath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;

      const existingChunk = await fs.promises.readFile(chunkPath);
      if (!existingChunk.equals(chunk.buffer)) {
        return res.status(409).json({
          status: 'error',
          message: 'A different chunk already exists at this index',
        });
      }
    } finally {
      await fs.promises
        .unlink(temporaryChunkPath)
        .catch((error: NodeJS.ErrnoException) => {
          if (error.code !== 'ENOENT') throw error;
        });
    }

    const chunkPaths = Array.from({ length: totalChunks }, (_, index) =>
      getChunkPath(directory, index)
    );
    const chunkStats = await Promise.all(
      chunkPaths.map(async (filePath) => {
        try {
          await fs.promises.stat(filePath);
          return true;
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
          throw error;
        }
      })
    );

    if (chunkStats.some((exists) => !exists)) {
      return res.json({ status: 'chunkReceived', message: 'Chunk received!' });
    }

    try {
      await fs.promises.mkdir(lockPath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'EEXIST') {
        return res.json({ status: 'chunkReceived', message: 'Upload is completing' });
      }
      throw error;
    }

    const assembledPath = path.join(directory, 'assembled.mp4');
    try {
      const chunks = async function* () {
        for (const filePath of chunkPaths) {
          for await (const data of fs.createReadStream(filePath)) {
            yield data;
          }
        }
      };
      await pipeline(
        Readable.from(chunks()),
        fs.createWriteStream(assembledPath, { flags: 'wx' })
      );

      const { size } = await fs.promises.stat(assembledPath);
      const location = await uploadToSpaces({
        body: fs.createReadStream(assembledPath),
        fileName: originalname,
        contentType: chunk.mimetype || 'video/mp4',
        folder: 'video',
        contentLength: size,
      });


      await fs.promises.rm(directory, { recursive: true, force: true });
      return res.json({
        status:"success",
        url:location
      });
    } finally {
      await fs.promises.unlink(assembledPath).catch((error: NodeJS.ErrnoException) => {
        if (error.code !== 'ENOENT') throw error;
      });
      await fs.promises.rmdir(lockPath).catch((error: NodeJS.ErrnoException) => {
        if (error.code !== 'ENOENT') throw error;
      });
    }
  } catch (error: unknown) {
    next(error);
  }
};
