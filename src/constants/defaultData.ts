import { MemoryRecord, ReminderRecord } from '../db/types';

export const INITIAL_MEMORIES: Omit<MemoryRecord, 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'mem_1',
    title: 'Sarah & Leo',
    relationship: 'Daughter & Grandson',
    story: 'Sarah is your loving daughter, and little Leo is your energetic grandson. They visit every Sunday afternoon and love making pancakes with you.',
    localImageUri: 'seed_memory_1', // Will use bundled fallback if local file does not exist yet
    isFavorite: 1,
    sortOrder: 0,
  },
  {
    id: 'mem_2',
    title: 'Rusty',
    relationship: 'Golden Retriever',
    story: 'Rusty is your loyal golden retriever. He loves morning walks in the park, chasing tennis balls, and resting his head on your lap.',
    localImageUri: 'seed_memory_2',
    isFavorite: 1,
    sortOrder: 1,
  },
  {
    id: 'mem_3',
    title: 'Trip to Lake Tahoe',
    relationship: 'Family Vacation',
    story: 'You and the whole family took a sunny summer trip to Lake Tahoe. You sat on the dock, drank warm tea, and watched the boats glide across the crystal blue water.',
    localImageUri: 'seed_memory_3',
    isFavorite: 0,
    sortOrder: 2,
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
  {
    id: 'rem_lunch',
    title: 'Warm Lunch',
    category: 'meal',
    timeOfDay: '12:30',
    spokenMessage: 'It is twelve thirty in the afternoon. Time to enjoy a delicious, warm lunch.',
    repeatDaily: 1,
    isEnabled: 1,
    isCompletedToday: 0,
  },
  {
    id: 'rem_hydration_afternoon',
    title: 'Afternoon Hydration',
    category: 'hydration',
    timeOfDay: '15:00',
    spokenMessage: 'Time for a nice glass of cool water or warm herbal tea to keep you feeling refreshed.',
    repeatDaily: 1,
    isEnabled: 1,
    isCompletedToday: 0,
  },
  {
    id: 'rem_family_call',
    title: 'Call Loved Ones',
    category: 'call',
    timeOfDay: '17:00',
    spokenMessage: 'It is five o\'clock. Let us give Sarah a call or say hello to family.',
    repeatDaily: 1,
    isEnabled: 1,
    isCompletedToday: 0,
  },
  {
    id: 'rem_evening_rest',
    title: 'Gentle Evening Rest',
    category: 'rest',
    timeOfDay: '20:30',
    spokenMessage: 'The day is winding down. Time to relax, dim the lights, and get ready for a restful night.',
    repeatDaily: 1,
    isEnabled: 1,
    isCompletedToday: 0,
  },
];
