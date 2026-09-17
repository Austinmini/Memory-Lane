import { ImageSourcePropType } from 'react-native';
import { MemoryRecord, ReminderRecord } from '../db/types';

export const DEFAULT_MEMORY_IMAGES: Record<string, any> = {
  default_family: require('../../assets/defaults/family_portrait.jpg'),
  default_pet: require('../../assets/defaults/golden_retriever.jpg'),
  default_nature: require('../../assets/defaults/lake_tahoe.jpg'),
  // Backward compatibility with previous seed identifiers
  seed_memory_1: require('../../assets/defaults/family_portrait.jpg'),
  seed_memory_2: require('../../assets/defaults/golden_retriever.jpg'),
  seed_memory_3: require('../../assets/defaults/lake_tahoe.jpg'),
};

/**
 * Resolves an image source for React Native <Image source={...} />.
 * Returns bundled default asset if matching key, or { uri } if local sandbox file path,
 * or null if no valid image.
 */
export function resolveMemoryImageSource(uri?: string | null): ImageSourcePropType | null {
  if (!uri || typeof uri !== 'string') return null;
  const trimmed = uri.trim();
  if (!trimmed) return null;

  if (DEFAULT_MEMORY_IMAGES[trimmed]) {
    return DEFAULT_MEMORY_IMAGES[trimmed];
  }

  return { uri: trimmed };
}

export const INITIAL_MEMORIES: Omit<MemoryRecord, 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'mem_1',
    title: 'Sarah & Leo',
    relationship: 'Daughter & Grandson',
    story: 'Sarah is your loving daughter, and little Leo is your energetic grandson. They visit every Sunday afternoon and love making pancakes with you in the kitchen.',
    localImageUri: 'default_family',
    isFavorite: 1,
    sortOrder: 0,
  },
];

export const INITIAL_REMINDERS: Omit<ReminderRecord, 'createdAt' | 'updatedAt' | 'lastCompletedDate' | 'notificationId'>[] = [
  {
    id: 'rem_med_morning',
    title: 'Morning Medication',
    category: 'medication',
    timeOfDay: '08:30',
    spokenMessage: 'Good morning! It is time to take your morning medication with a fresh glass of water.',
    repeatDaily: 1,
    isEnabled: 1,
    isCompletedToday: 0,
  },
];

/**
 * Recommended full 7-routine schedule that caregivers can populate on-demand.
 */
export const RECOMMENDED_ROUTINES: Omit<ReminderRecord, 'createdAt' | 'updatedAt' | 'lastCompletedDate' | 'notificationId'>[] = [
  {
    id: 'rem_med_morning',
    title: 'Morning Medication',
    category: 'medication',
    timeOfDay: '08:30',
    spokenMessage: 'Good morning! It is time to take your morning medication with a fresh glass of water.',
    repeatDaily: 1,
    isEnabled: 1,
    isCompletedToday: 0,
  },
  {
    id: 'rem_hydration_morning',
    title: 'Mid-day Hydration',
    category: 'hydration',
    timeOfDay: '10:30',
    spokenMessage: 'Time for a gentle morning pause. Please drink a glass of fresh water to keep you feeling hydrated and energized.',
    repeatDaily: 1,
    isEnabled: 1,
    isCompletedToday: 0,
  },
  {
    id: 'rem_lunch',
    title: 'Warm Lunch',
    category: 'meal',
    timeOfDay: '12:30',
    spokenMessage: 'It is twelve thirty in the afternoon. Time to enjoy a delicious, nourishing lunch.',
    repeatDaily: 1,
    isEnabled: 1,
    isCompletedToday: 0,
  },
  {
    id: 'rem_afternoon_walk',
    title: 'Afternoon Walk & Fresh Air',
    category: 'rest',
    timeOfDay: '14:30',
    spokenMessage: 'The afternoon is lovely. Time for a peaceful stroll, some light stretching, or relaxing fresh air by the window.',
    repeatDaily: 1,
    isEnabled: 1,
    isCompletedToday: 0,
  },
  {
    id: 'rem_afternoon_tea',
    title: 'Afternoon Tea & Hydration',
    category: 'hydration',
    timeOfDay: '16:00',
    spokenMessage: 'Time for afternoon tea or a healthy snack. A warm cup of tea or water is ready for you.',
    repeatDaily: 1,
    isEnabled: 1,
    isCompletedToday: 0,
  },
  {
    id: 'rem_evening_dinner_meds',
    title: 'Evening Medication & Dinner',
    category: 'medication',
    timeOfDay: '18:30',
    spokenMessage: 'Good evening. It is time for a warm dinner and your evening medication.',
    repeatDaily: 1,
    isEnabled: 1,
    isCompletedToday: 0,
  },
  {
    id: 'rem_evening_rest',
    title: 'Gentle Evening Wind Down',
    category: 'rest',
    timeOfDay: '20:30',
    spokenMessage: 'The day is winding down. Time to relax in comfort, dim the lights, and prepare for a restful, peaceful night.',
    repeatDaily: 1,
    isEnabled: 1,
    isCompletedToday: 0,
  },
];
