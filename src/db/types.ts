export interface MemoryRecord {
  id: string;
  title: string;
  relationship: string;
  story: string;
  localImageUri: string;
  isFavorite: number; // 0 or 1
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
}

export type ReminderCategory = 'medication' | 'meal' | 'hydration' | 'call' | 'rest' | 'custom';

export interface ReminderRecord {
  id: string;
  title: string;
  category: ReminderCategory;
  timeOfDay: string; // 'HH:mm' 24hr format, e.g. '08:30'
  spokenMessage: string;
  repeatDaily: number; // 0 or 1
  isEnabled: number; // 0 or 1
  isCompletedToday: number; // 0 or 1
  lastCompletedDate: string | null; // 'YYYY-MM-DD'
  notificationId: string | null;
  createdAt: number;
  updatedAt: number;
}
