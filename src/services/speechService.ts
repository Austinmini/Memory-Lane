import * as Speech from 'expo-speech';

export interface SpeechOptions {
  language?: string;
  pitch?: number;
  rate?: number;
  onStart?: () => void;
  onDone?: () => void;
  onStopped?: () => void;
  onError?: (error: any) => void;
}

/**
 * Default soothing speech configuration for dementia care:
 * - Language: English (US)
 * - Rate: 0.85 (Slightly slower, clear, patient cadence)
 * - Pitch: 1.0 (Comforting, natural vocal frequency)
 */
const DEFAULT_SPEECH_OPTIONS: SpeechOptions = {
  language: 'en-US',
  rate: 0.85,
  pitch: 1.0,
};

/**
 * Speaks a given text message with soothing, dementia-friendly settings.
 * Stops any ongoing speech before starting the new utterance.
 */
export async function speakCalmly(
  text: string,
  options?: Partial<SpeechOptions>
): Promise<void> {
  if (!text || text.trim().length === 0) {
    return;
  }

  // Stop any currently active speech to prevent overlapping audio
  try {
    const isSpeaking = await Speech.isSpeakingAsync();
    if (isSpeaking) {
      await Speech.stop();
    }
  } catch {
    // Graceful fallback if isSpeakingAsync check fails
  }

  const mergedOptions: SpeechOptions = {
    ...DEFAULT_SPEECH_OPTIONS,
    ...options,
  };

  Speech.speak(text, {
    language: mergedOptions.language,
    pitch: mergedOptions.pitch,
    rate: mergedOptions.rate,
    onStart: mergedOptions.onStart,
    onDone: mergedOptions.onDone,
    onStopped: mergedOptions.onStopped,
    onError: mergedOptions.onError,
  });
}

/**
 * Formats a memory record into a warm, natural narrative suitable for readout.
 * Example: "This is Sarah and Leo, your Daughter and Grandson. Sarah is your daughter..."
 */
export function formatMemoryNarration(title: string, relationship?: string | null, story?: string | null): string {
  const parts: string[] = [];

  if (title && relationship) {
    parts.push(`This is ${title}, your ${relationship}.`);
  } else if (title) {
    parts.push(`This is ${title}.`);
  }

  if (story && story.trim().length > 0) {
    parts.push(story.trim());
  }

  return parts.join(' ');
}

/**
 * Reads aloud a memory card with warm narration.
 */
export async function speakMemory(
  title: string,
  relationship?: string | null,
  story?: string | null,
  callbacks?: { onStart?: () => void; onDone?: () => void; onStopped?: () => void; onError?: (err: any) => void }
): Promise<void> {
  const narrative = formatMemoryNarration(title, relationship, story);
  await speakCalmly(narrative, callbacks);
}

/**
 * Stops any active speech synthesis immediately.
 */
export async function stopSpeaking(): Promise<void> {
  try {
    await Speech.stop();
  } catch (error) {
    console.warn('Error stopping speech:', error);
  }
}

/**
 * Checks if the speech synthesizer is currently speaking.
 */
export async function isSpeaking(): Promise<boolean> {
  try {
    return await Speech.isSpeakingAsync();
  } catch {
    return false;
  }
}
