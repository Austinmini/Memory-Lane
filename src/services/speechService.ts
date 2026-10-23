import * as Speech from 'expo-speech';
import { getSetting, setSetting } from '../db';

export type VoiceGender = 'female' | 'male';

export interface SpeechOptions {
  language?: string;
  pitch?: number;
  rate?: number;
  voice?: string;
  onStart?: () => void;
  onDone?: () => void;
  onStopped?: () => void;
  onError?: (error: any) => void;
}

const SETTING_KEY_VOICE_GENDER = 'tts_voice_gender';

// In-memory cached voice gender and discovered voice profiles
let cachedGender: VoiceGender | null = null;
let cachedVoiceMap: Partial<Record<VoiceGender, Speech.Voice | null>> = {};
let isVoiceScanning = false;

// Known female and male indicator keywords across iOS, Android Google TTS, and Web
const FEMALE_VOICE_KEYWORDS = [
  'female',
  'samantha',
  'ava',
  'allison',
  'karen',
  'victoria',
  'susan',
  'nora',
  'zoe',
  'zira',
  'moira',
  'tessa',
  'serena',
  'fiona',
  'veena',
  'en-us-x-sfg#female',
  'en-us-language',
];

const MALE_VOICE_KEYWORDS = [
  'male',
  'alex',
  'daniel',
  'oliver',
  'fred',
  'tom',
  'aaron',
  'david',
  'george',
  'rishi',
  'en-us-x-sfg#male',
  'en-us-x-iol',
  'en-us-x-tpd',
];

/**
 * Retrieve the caregiver's preferred voice gender from SQLite settings.
 * Defaults to 'female' (warm and soothing).
 */
export async function getVoiceGender(): Promise<VoiceGender> {
  if (cachedGender) {
    return cachedGender;
  }

  try {
    const saved = await getSetting(SETTING_KEY_VOICE_GENDER);
    if (saved === 'female' || saved === 'male') {
      cachedGender = saved;
      return saved;
    }
  } catch (err) {
    console.warn('[speechService] Error reading voice gender setting:', err);
  }

  cachedGender = 'female';
  return 'female';
}

/**
 * Persist the caregiver's voice gender preference in SQLite.
 */
export async function setVoiceGender(gender: VoiceGender): Promise<void> {
  cachedGender = gender;
  try {
    await setSetting(SETTING_KEY_VOICE_GENDER, gender);
  } catch (err) {
    console.warn('[speechService] Error saving voice gender setting:', err);
  }
}

/**
 * Scan device voices and locate the highest-fidelity English voice for the given gender.
 * Prioritizes 'Enhanced' quality neural voice models over standard robotic fallbacks.
 */
export async function findBestVoiceForGender(gender: VoiceGender): Promise<Speech.Voice | null> {
  if (cachedVoiceMap[gender] !== undefined) {
    return cachedVoiceMap[gender] || null;
  }

  if (isVoiceScanning) {
    return null;
  }

  isVoiceScanning = true;
  try {
    const available = await Speech.getAvailableVoicesAsync();
    if (!available || available.length === 0) {
      cachedVoiceMap[gender] = null;
      return null;
    }

    // Filter for English voices
    const englishVoices = available.filter(
      (v) => v.language && v.language.toLowerCase().startsWith('en')
    );

    const targetKeywords = gender === 'female' ? FEMALE_VOICE_KEYWORDS : MALE_VOICE_KEYWORDS;
    const opposingKeywords = gender === 'female' ? MALE_VOICE_KEYWORDS : FEMALE_VOICE_KEYWORDS;

    // Helper to score a voice based on quality and name matching
    const scoreVoice = (v: Speech.Voice): number => {
      const name = (v.name || '').toLowerCase();
      const id = (v.identifier || '').toLowerCase();
      const combined = `${name} ${id}`;

      // Strictly disqualify if it explicitly matches the opposite gender
      for (const opp of opposingKeywords) {
        if (combined.includes(opp)) return -1;
      }

      let score = 0;
      for (const kw of targetKeywords) {
        if (combined.includes(kw)) {
          score += 10;
          break;
        }
      }

      // High boost for Enhanced / studio quality neural voices
      if (v.quality === Speech.VoiceQuality.Enhanced || (v as any).quality === 'Enhanced') {
        score += 20;
      }

      // Preference for US/UK English
      if (v.language.toLowerCase().includes('en-us') || v.language.toLowerCase().includes('en_us')) {
        score += 5;
      }

      return score;
    };

    let bestVoice: Speech.Voice | null = null;
    let highestScore = 0;

    for (const voice of englishVoices) {
      const score = scoreVoice(voice);
      if (score > highestScore) {
        highestScore = score;
        bestVoice = voice;
      }
    }

    cachedVoiceMap[gender] = bestVoice;
    return bestVoice;
  } catch (err) {
    console.warn('[speechService] Failed to query available voices:', err);
    cachedVoiceMap[gender] = null;
    return null;
  } finally {
    isVoiceScanning = false;
  }
}

/**
 * Dementia-friendly acoustic configuration tailored by voice gender:
 * - Rate: 0.85 (Gentle, patient, natural human conversation speed)
 * - Female Pitch: 1.00 (Warm, clear, comforting)
 * - Male Pitch: 0.92 (Deeper, grounding, clear resonance for age-related hearing loss)
 */
export function getGenderSpeechDefaults(gender: VoiceGender): { pitch: number; rate: number } {
  if (gender === 'male') {
    return {
      pitch: 0.92,
      rate: 0.85,
    };
  }

  return {
    pitch: 1.0,
    rate: 0.85,
  };
}

/**
 * Speaks a given text message with soothing, dementia-friendly human cadence.
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
    const isCurrentlySpeaking = await Speech.isSpeakingAsync();
    if (isCurrentlySpeaking) {
      await Speech.stop();
    }
  } catch {
    // Graceful fallback if isSpeakingAsync check fails
  }

  const currentGender = await getVoiceGender();
  const acousticDefaults = getGenderSpeechDefaults(currentGender);

  // Discover best neural system voice if voice is not manually specified
  let selectedVoiceId = options?.voice;
  if (!selectedVoiceId) {
    const matchedVoice = await findBestVoiceForGender(currentGender);
    if (matchedVoice) {
      selectedVoiceId = matchedVoice.identifier;
    }
  }

  const mergedOptions: SpeechOptions = {
    language: 'en-US',
    pitch: acousticDefaults.pitch,
    rate: acousticDefaults.rate,
    voice: selectedVoiceId,
    ...options,
  };

  Speech.speak(text, {
    language: mergedOptions.language,
    pitch: mergedOptions.pitch,
    rate: mergedOptions.rate,
    voice: mergedOptions.voice,
    onStart: mergedOptions.onStart,
    onDone: mergedOptions.onDone,
    onStopped: mergedOptions.onStopped,
    onError: mergedOptions.onError,
  });
}

/**
 * Plays a sample introductory sentence using the specified voice gender
 * so caregivers can preview the cadence and tone in Settings.
 */
export async function speakVoiceSample(
  gender: VoiceGender,
  callbacks?: { onStart?: () => void; onDone?: () => void; onStopped?: () => void; onError?: (err: any) => void }
): Promise<void> {
  const defaults = getGenderSpeechDefaults(gender);
  const matchedVoice = await findBestVoiceForGender(gender);

  const sampleSentence =
    gender === 'female'
      ? 'Hello. I am the soothing female voice for Memory Lane, here to bring gentle guidance and comfort.'
      : 'Hello. I am the calm male voice for Memory Lane, here to bring gentle guidance and comfort.';

  await speakCalmly(sampleSentence, {
    pitch: defaults.pitch,
    rate: defaults.rate,
    voice: matchedVoice ? matchedVoice.identifier : undefined,
    ...callbacks,
  });
}

/**
 * Formats a memory record into a warm, natural narrative suitable for readout.
 * Example: "This is Sarah and Leo, your Daughter and Grandson. Sarah is your daughter..."
 */
export function formatMemoryNarration(title: string, relationship?: string | null, story?: string | null): string {
  const cleanTitle = (title || '').trim();
  const cleanRel = (relationship || '').trim();
  const cleanStory = (story || '').trim();

  const parts: string[] = [];

  if (cleanTitle && cleanRel) {
    parts.push(`${cleanTitle}, your ${cleanRel}.`);
  } else if (cleanTitle && !cleanStory) {
    parts.push(cleanTitle);
  }

  if (cleanStory) {
    parts.push(cleanStory);
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
