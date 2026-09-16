import * as musicMetadata from 'music-metadata';
import path from 'path';

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
 * Automatically extracts the duration of an audio file.
 * @param filePath Path to the audio file (relative or absolute)
 * @returns Formatted duration string (e.g. "03:45") or undefined if parsing fails
 */
export const getAudioDuration = async (
  filePath: string
): Promise<string | undefined> => {
  try {
    const absolutePath = path.isAbsolute(filePath)
      ? filePath
      : path.join(process.cwd(), filePath);
    const metadata = await musicMetadata.parseFile(absolutePath);
    if (metadata.format && metadata.format.duration) {
      return formatDuration(metadata.format.duration);
    }
  } catch (error) {
    console.error('Error parsing audio duration:', error);
  }
  return undefined;
};
