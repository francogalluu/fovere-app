import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { appStorage } from './storage';

// ─── Types ────────────────────────────────────────────────────────────────────

/** 0 = Sunday, 1 = Monday (matches date-fns weekStartsOn) */
export type WeekStartDay = 0 | 1;

interface SettingsState {
  /** Haptic feedback on habit completion / swipe actions */
  hapticFeedback: boolean;

  /**
   * Which day the week starts on.
   * 0 = Sunday (US default), 1 = Monday (ISO 8601 / European default)
   */
  weekStartsOn: WeekStartDay;

  /**
   * Whether the user has granted notification permissions and enabled reminders.
   * Flipped to true after the first permission grant in M10.
   */
  notificationsEnabled: boolean;

  // ── Actions ────────────────────────────────────────────────────────────────
  setHapticFeedback: (enabled: boolean) => void;
  setWeekStartsOn: (day: WeekStartDay) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      hapticFeedback: true,
      weekStartsOn: 1,          // Monday by default (matches legacy Settings screen)
      notificationsEnabled: false,

      setHapticFeedback: (enabled) => set({ hapticFeedback: enabled }),
      setWeekStartsOn: (day) => set({ weekStartsOn: day }),
      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
    }),
    {
      name: 'fovere-settings',
      storage: createJSONStorage(() => appStorage),
      version: 1,
    },
  ),
);
