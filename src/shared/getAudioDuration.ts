import * as musicMetadata from 'music-metadata';
import path from 'path';
import { Readable } from 'stream';
import config from '../config';

/**
 * Formats duration in seconds to "MM:SS" or "HH:MM:SS" string.
 */
export const formatDuration = (seconds: number): string => {
  const totalSeconds = Math.round(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  const paddedMinutes = String(minutes).padStart(2, '0');
  const paddedSeconds = String(secs).padStart(2, '0');

  if (hours > 0) {
    const paddedHours = String(hours).padStart(2, '0');
    return `${paddedHours}:${paddedMinutes}:${paddedSeconds}`;
  }

  return `${paddedMinutes}:${paddedSeconds}`;
};

/**
 * Extracts media duration from a local file or a public URL in this Spaces bucket.
 * @param filePath Local file path or public Spaces URL
 * @returns Formatted duration string (e.g. "03:45") or undefined if parsing fails
 */
export const getAudioDuration = async (
  filePath: string
): Promise<string | undefined> => {
  try {
    if (/^https?:\/\//i.test(filePath)) {
      const mediaUrl = new URL(filePath);
      const { bucket, region, endpoint } = config.spaces;
      const endpointHost = endpoint ? new URL(endpoint).hostname : undefined;
      const allowedHosts = new Set(
        [
          endpointHost && bucket ? `${bucket}.${endpointHost}` : undefined,
          bucket && region
            ? `${bucket}.${region}.cdn.digitaloceanspaces.com`
            : undefined,
        ].filter((hostname): hostname is string => Boolean(hostname))
      );

      if (
        mediaUrl.protocol !== 'https:' ||
        !allowedHosts.has(mediaUrl.hostname)
      ) {
        throw new Error(
          'Media URL must be an HTTPS URL from the configured Spaces bucket'
        );
      }

      const response = await fetch(mediaUrl, { redirect: 'error' });
      if (!response.ok || !response.body) {
        await response.body?.cancel();
        throw new Error(`Remote media request failed with HTTP ${response.status}`);
      }

      const contentLength = Number(response.headers.get('content-length'));
      const metadata = await musicMetadata.parseStream(
        Readable.fromWeb(response.body as any),
        {
          mimeType: response.headers.get('content-type')?.split(';', 1)[0],
          ...(Number.isSafeInteger(contentLength) &&
            contentLength > 0 && { size: contentLength }),
          url: mediaUrl.href,
        },
        { duration: true }
      );

      if (metadata.format.duration) {
        return formatDuration(metadata.format.duration);
      }
      return undefined;
    }

    const absolutePath = path.isAbsolute(filePath)
      ? filePath
      : path.join(process.cwd(), filePath);
    const metadata = await musicMetadata.parseFile(absolutePath, {
      duration: true,
    });
    if (metadata.format && metadata.format.duration) {
      return formatDuration(metadata.format.duration);
    }
  } catch (error) {
    const errorName =
      error instanceof Error ? error.name : 'Unknown media parsing error';
    console.error(`Error parsing media duration (${errorName})`);
  }
  return undefined;
};
