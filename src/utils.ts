import type { AudioProTrack } from './types';
import { useAudioProStore } from './useAudioProStore';
import { emitter } from './emitter';
import { AudioProEventName } from './values';

/**
 * Validates a track to ensure it contains all required properties and uses supported formats
 * @param track - The audio track to validate
 * @returns A boolean indicating whether the track is valid
 */
export function validateTrack(track: AudioProTrack): boolean {
  // noinspection SuspiciousTypeOfGuard
  if (
    !track ||
    typeof track.url !== 'string' ||
    !track.url.trim() ||
    typeof track.title !== 'string' ||
    !track.title.trim() ||
    typeof track.artwork !== 'string' ||
    !track.artwork.trim() ||
    (track.album !== undefined && typeof track.album !== 'string') ||
    (track.artist !== undefined && typeof track.artist !== 'string')
  ) {
    logDebug('Track validation failed: Missing or invalid required properties');
    return false;
  }

  const audioUrl = track.url.toLowerCase();
  const supportedAudioFormats = [
    '.mp3',
    '.aac',
    '.wav',
    '.m4a',
    '.ogg',
    '.flac',
    '.mp4',
    '.3gp',
  ];

  const isAudioFormatSupported = supportedAudioFormats.some(
    (format) => audioUrl.endsWith(format) || audioUrl.includes(`${format}?`) // Handle URLs with query parameters
  );

  if (!isAudioFormatSupported) {
    logDebug(
      `Track validation failed: Unsupported audio format for URL: ${track.url}`
    );
    return false;
  }

  const artworkUrl = track.artwork.toLowerCase();
  const supportedImageFormats = ['.jpg', '.jpeg', '.png', '.webp'];

  const isImageFormatSupported = supportedImageFormats.some(
    (format) => artworkUrl.endsWith(format) || artworkUrl.includes(`${format}?`) // Handle URLs with query parameters
  );

  if (!isImageFormatSupported) {
    logDebug(
      `Track validation failed: Unsupported image format for artwork: ${track.artwork}`
    );
    return false;
  }

  return true;
}

export function logDebug(...args: any[]) {
  const { debug } = useAudioProStore.getState();
  if (debug) {
    console.log('~~~', ...args);
  }
}

export function guardTrackLoaded(methodName: string): boolean {
  const { loadedTrack } = useAudioProStore.getState();
  if (!loadedTrack) {
    const errorMessage = `~~~ AudioPro: ${methodName} called but no track loaded.`;
    console.error(errorMessage);
    emitter.emit('AudioProNameEvent', {
      name: AudioProEventName.PLAYBACK_ERROR,
      error: errorMessage,
      errorCode: -1,
    });
    return false;
  }
  return true;
}
