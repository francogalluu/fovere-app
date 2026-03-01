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

  /** Compact home screen layout (smaller hero and habit cards for faster scanning). */
  compactHomeView: boolean;

  // ── Actions ────────────────────────────────────────────────────────────────
  setHapticFeedback: (enabled: boolean) => void;
  setWeekStartsOn: (day: WeekStartDay) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setCompactHomeView: (enabled: boolean) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Coerce a potentially-stringified boolean back to a real boolean.
 * AsyncStorage stores everything as strings; if stale data was written without
 * JSON.stringify, Zustand's JSON storage may rehydrate "true"/"false" strings
 * instead of booleans, which breaks Fabric's strict native prop type checks.
 */
function toBoolean(v: unknown, fallback: boolean): boolean {
  if (typeof v === 'boolean') return v;
  if (v === 'true'  || v === '1' || v === 1) return true;
  if (v === 'false' || v === '0' || v === 0) return false;
  return fallback;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      hapticFeedback: true,
      weekStartsOn: 1,          // Monday by default (matches legacy Settings screen)
      notificationsEnabled: false,
      compactHomeView: false,

      setHapticFeedback: (enabled) => set({ hapticFeedback: enabled }),
      setWeekStartsOn: (day) => set({ weekStartsOn: day }),
      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
      setCompactHomeView: (enabled) => set({ compactHomeView: enabled }),
    }),
    {
      name: 'fovere-settings',
      storage: createJSONStorage(() => appStorage),
      version: 1,

      // Coerce any stringified booleans produced by stale AsyncStorage data.
      // This runs after Zustand JSON-parses the stored string, so it catches
      // values like "true"/"false" that weren't stored via JSON.stringify.
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.hapticFeedback      = toBoolean(state.hapticFeedback,      true);
        state.notificationsEnabled = toBoolean(state.notificationsEnabled, false);
        // weekStartsOn must be 0 or 1 — clamp just in case
        const ws = Number(state.weekStartsOn);
        state.weekStartsOn = (ws === 0 || ws === 1 ? ws : 1) as WeekStartDay;
        state.compactHomeView = toBoolean(state.compactHomeView, false);

        if (__DEV__) {
          console.log('[settingsStore] rehydrated →', {
            hapticFeedback:      `${typeof state.hapticFeedback}(${state.hapticFeedback})`,
            notificationsEnabled: `${typeof state.notificationsEnabled}(${state.notificationsEnabled})`,
            weekStartsOn:        `${typeof state.weekStartsOn}(${state.weekStartsOn})`,
          });
        }
      },
    },
  ),
);
