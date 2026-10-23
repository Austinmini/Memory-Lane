import * as FileSystem from 'expo-file-system/legacy';
import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from 'expo-audio';
import { ReminderRecord } from '../db/types';
import { speakCalmly, stopSpeaking as stopTtsSpeaking } from './speechService';

const ROUTINE_AUDIO_DIR_NAME = 'routine_audio';

let activeAudioPlayer: AudioPlayer | null = null;
let activePlaybackListener: any = null;

/**
 * Ensures the internal sandboxed directory for caregiver routine audio exists.
 */
export async function ensureRoutineAudioDirectoryExists(): Promise<string> {
  const docDir = FileSystem.documentDirectory;
  if (!docDir) {
    throw new Error('FileSystem.documentDirectory is null on this device');
  }

  const audioDir = `${docDir}${ROUTINE_AUDIO_DIR_NAME}/`;
  const dirInfo = await FileSystem.getInfoAsync(audioDir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(audioDir, { intermediates: true });
  }

  return audioDir;
}

/**
 * Copies a newly recorded audio file (e.g. from cache or recorder output)
 * permanently into the sandboxed routine_audio directory.
 */
export async function saveRoutineAudioToSandbox(sourceUri: string, reminderId: string): Promise<string> {
  if (!sourceUri) {
    return '';
  }

  const audioDir = await ensureRoutineAudioDirectoryExists();
  const fileExtMatch = sourceUri.match(/\.([a-zA-Z0-9]+)(\?.*)?$/);
  const ext = fileExtMatch ? fileExtMatch[1] : 'm4a';
  const destinationUri = `${audioDir}${reminderId}_${Date.now()}.${ext}`;

  await FileSystem.copyAsync({
    from: sourceUri,
    to: destinationUri,
  });

  return destinationUri;
}

/**
 * Deletes a stored routine audio recording from the sandbox if it exists.
 */
export async function deleteRoutineAudio(audioUri?: string | null): Promise<void> {
  if (!audioUri || audioUri.startsWith('http')) {
    return;
  }

  try {
    const fileInfo = await FileSystem.getInfoAsync(audioUri);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(audioUri, { idempotent: true });
    }
  } catch (err) {
    console.warn('[audioService] Error deleting routine audio file:', err);
  }
}

/**
 * Stops any currently playing caregiver audio playback.
 */
export async function stopActiveAudio(): Promise<void> {
  try {
    if (activeAudioPlayer) {
      activeAudioPlayer.pause();
      if (activePlaybackListener && (activeAudioPlayer as any).removeListener) {
        (activeAudioPlayer as any).removeListener('playbackStatusUpdate', activePlaybackListener);
      }
      activeAudioPlayer = null;
      activePlaybackListener = null;
    }
  } catch (err) {
    console.warn('[audioService] Error stopping audio player:', err);
  }
}

/**
 * Checks if a caregiver voice recording is currently playing.
 */
export function isAudioPlaying(): boolean {
  return !!activeAudioPlayer && activeAudioPlayer.playing;
}

/**
 * Plays a local caregiver voice recording file (.m4a).
 * Configures the audio session for clear, audible playback.
 */
export async function playAudioFile(
  uri: string,
  callbacks?: {
    onStart?: () => void;
    onDone?: () => void;
    onError?: (err: any) => void;
  }
): Promise<void> {
  if (!uri) return;

  // Stop any active TTS and active audio playback first
  await stopTtsSpeaking();
  await stopActiveAudio();

  try {
    // Ensure audio plays even if device silent switch is enabled
    await setAudioModeAsync({
      playsInSilentMode: true,
      allowsRecording: false,
    });

    const player = createAudioPlayer({ uri });
    activeAudioPlayer = player;

    let hasStarted = false;
    let hasCompleted = false;

    activePlaybackListener = (status: any) => {
      if (status.playing && !hasStarted) {
        hasStarted = true;
        callbacks?.onStart?.();
      }

      // Check if finished playing
      if (
        status.isLoaded &&
        !status.playing &&
        hasStarted &&
        !hasCompleted &&
        (status.currentTime >= status.duration - 0.2 || status.duration === 0)
      ) {
        hasCompleted = true;
        callbacks?.onDone?.();
        stopActiveAudio();
      }
    };

    player.addListener('playbackStatusUpdate', activePlaybackListener);
    player.play();
  } catch (err) {
    console.warn('[audioService] Failed to play audio file:', err);
    callbacks?.onError?.(err);
    await stopActiveAudio();
  }
}

/**
 * Unified smart audio playback for routine reminders:
 * - If the reminder has a caregiver voice recording (audioUri), plays the real voice clip!
 * - If no recording exists, falls back gracefully to calming Text-to-Speech!
 */
export async function playReminderAudio(
  reminder: ReminderRecord,
  callbacks?: {
    onStart?: () => void;
    onDone?: () => void;
    onStopped?: () => void;
    onError?: (err: any) => void;
  }
): Promise<void> {
  // If caregiver recorded their voice, play the custom voice clip
  if (reminder.audioUri && reminder.audioUri.trim().length > 0) {
    try {
      const fileInfo = await FileSystem.getInfoAsync(reminder.audioUri);
      if (fileInfo.exists) {
        await playAudioFile(reminder.audioUri, {
          onStart: callbacks?.onStart,
          onDone: callbacks?.onDone,
          onError: async () => {
            // If playing the file failed, fallback to TTS
            await speakCalmly(reminder.spokenMessage, callbacks);
          },
        });
        return;
      }
    } catch {
      // Fallback to TTS if file check fails
    }
  }

  // Fallback to calming TTS voice engine
  const message = reminder.spokenMessage || reminder.title || 'It is time for your scheduled routine.';
  await speakCalmly(message, callbacks);
}

/**
 * Global audio stop helper that halts both TTS speech and recorded audio clips.
 */
export async function stopAllAudio(): Promise<void> {
  await stopTtsSpeaking();
  await stopActiveAudio();
}
