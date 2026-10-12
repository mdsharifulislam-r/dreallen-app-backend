import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { Readable } from 'stream';
import config from '../config';

export interface SpacesUploadInput {
  body: Buffer | Readable;
  fileName: string;
  contentType: string;
  folder: string;
  contentLength?: number;
}

let spacesClient: S3Client | undefined;

const getSafeSpacesErrorDetails = (
  error: unknown
): { code?: string; statusCode?: number; requestId?: string } => {
  if (typeof error !== 'object' || error === null) return {};

  const details: {
    code?: string;
    statusCode?: number;
    requestId?: string;
  } = {};

  if ('Code' in error && typeof error.Code === 'string') {
    details.code = error.Code;
  } else if ('code' in error && typeof error.code === 'string') {
    details.code = error.code;
  } else if ('name' in error && typeof error.name === 'string') {
    details.code = error.name;
  }

  if (
    '$metadata' in error &&
    typeof error.$metadata === 'object' &&
    error.$metadata !== null
  ) {
    const metadata = error.$metadata;
    if (
      'httpStatusCode' in metadata &&
      typeof metadata.httpStatusCode === 'number'
    ) {
      details.statusCode = metadata.httpStatusCode;
    }
    if ('requestId' in metadata && typeof metadata.requestId === 'string') {
      details.requestId = metadata.requestId;
    }
  }

  return details;
};

const formatSafeSpacesError = (error: unknown): string => {
  const { code, statusCode, requestId } = getSafeSpacesErrorDetails(error);
  const detail = [
    code,
    statusCode ? `HTTP ${statusCode}` : undefined,
    requestId ? `request ID ${requestId}` : undefined,
  ]
    .filter(Boolean)
    .join(', ');

  return detail ? ` (${detail})` : '';
};

const getSpacesClient = (): {
  client: S3Client;
  bucket: string;
  endpoint: string;
} => {
  const {
    access_key_id,
    secret_access_key,
    region,
    endpoint,
    bucket,
  } = config.spaces;

  if (!access_key_id || !secret_access_key || !bucket || !region || !endpoint) {
    throw new Error(
      'DigitalOcean Spaces is not configured. Set SPACES_ACCESS_KEY_ID, SPACES_SECRET_ACCESS_KEY, SPACES_BUCKET, SPACES_REGION, and SPACES_ENDPOINT.'
    );
  }

  if (!spacesClient) {
    spacesClient = new S3Client({
      region,
      endpoint,
      forcePathStyle: false,
      requestChecksumCalculation: 'WHEN_REQUIRED',
      credentials: {
        accessKeyId: access_key_id,
        secretAccessKey: secret_access_key,
      },
    });
  }

  return { client: spacesClient, bucket, endpoint };
};

export const uploadToSpaces = async ({
  body,
  fileName,
  contentType,
  folder,
  contentLength,
}: SpacesUploadInput): Promise<string> => {
  if (!/^[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*$/.test(folder)) {
    throw new Error('Invalid DigitalOcean Spaces upload folder');
  }

  const extension = fileName.match(/\.[a-zA-Z0-9]{1,10}$/)?.[0] ?? '';
  const key = `${folder}/${randomUUID()}${extension}`;
  const { client, bucket, endpoint } = getSpacesClient();

  try {
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ...(contentLength !== undefined && { ContentLength: contentLength }),
        ContentType: contentType,
        ACL: 'public-read',
      })
    );
  } catch (error: unknown) {
    const { code, statusCode } = getSafeSpacesErrorDetails(error);

    if (code === 'SignatureDoesNotMatch') {
      throw new Error(
        `DigitalOcean Spaces rejected the upload signature${formatSafeSpacesError(error)}. Confirm the new key pair is active, the secret was copied exactly, the bucket and endpoint match, and the server clock is synchronized.`
      );
    }

    if (statusCode === 403) {
      throw new Error(
        `DigitalOcean Spaces denied the upload${formatSafeSpacesError(error)}. Verify the bucket-scoped key permissions and bucket access settings.`
      );
    }

    throw new Error(
      `DigitalOcean Spaces upload failed${formatSafeSpacesError(error)}.`
    );
  }

  const endpointUrl = new URL(endpoint);
  const objectUrlBase = `${endpointUrl.protocol}//${bucket}.${endpointUrl.host}/`;
  const encodedKey = key.split('/').map(encodeURIComponent).join('/');

  return new URL(encodedKey, objectUrlBase).toString();
};

export const checkSpacesUpload = async (): Promise<void> => {
  const { client, bucket } = getSpacesClient();
  const key = `healthcheck/${randomUUID()}.txt`;
  let uploaded = false;

  try {
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: 'DigitalOcean Spaces connection check',
        ContentType: 'text/plain; charset=utf-8',
        ACL: 'public-read',
      })
    );
    uploaded = true;
  } catch (error: unknown) {
    throw new Error(
      `DigitalOcean Spaces test upload failed${formatSafeSpacesError(error)}. Check that the credentials are active and the bucket, region, endpoint, and bucket permissions are correct.`
    );
  } finally {
    if (uploaded) {
      try {
        await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
      } catch {
        throw new Error(
          'The Spaces test object uploaded, but cleanup failed. Remove the healthcheck test object from the bucket.'
        );
      }
    }
  }
};
