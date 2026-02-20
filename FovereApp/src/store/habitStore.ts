import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { appStorage } from './storage';
import type { Habit, HabitEntry } from '@/types/habit';

// ─── Schema versioning ────────────────────────────────────────────────────────

const CURRENT_SCHEMA_VERSION = 1;

type SchemaVersion = 1;

// ─── State + actions interface ────────────────────────────────────────────────

interface HabitState {
  /** Bump when the persisted shape changes to trigger a migration */
  _schemaVersion: SchemaVersion;

  /**
   * The date currently viewed on the Home screen (YYYY-MM-DD).
   * Persisted so the user returns to the same date after a short background.
   * Resets to today whenever the user taps "today" in the WeekCalendar.
   */
  selectedDate: string;
  setSelectedDate: (date: string) => void;

  habits: Habit[];
  entries: HabitEntry[];

  // ── Habit CRUD ──────────────────────────────────────────────────────────────

  addHabit: (
    draft: Omit<Habit, 'id' | 'createdAt' | 'archivedAt' | 'sortOrder'>,
  ) => string;                              // returns the new habit id

  updateHabit: (id: string, patch: Partial<Omit<Habit, 'id' | 'createdAt'>>) => void;

  /**
   * Soft-delete: sets archivedAt to today's date string.
   * Archived habits are excluded from Home and entry flows but
   * kept for analytics history.
   */
  archiveHabit: (id: string) => void;

  unarchiveHabit: (id: string) => void;

  /**
   * Hard-delete: removes the habit AND all of its entries.
   * Only callable from the Archived Habits list in Settings.
   */
  deleteHabit: (id: string) => void;

  /** Reassign sortOrder values to match a reordered id array */
  reorderHabits: (orderedIds: string[]) => void;

  // ── Entry mutations ─────────────────────────────────────────────────────────

  /**
   * Upsert a log entry for a given habit + date.
   * Uses deterministic id = `${habitId}_${date}` so there can only
   * ever be one entry per habit per day.
   */
  logEntry: (habitId: string, date: string, value: number) => void;

  /**
   * Increment a numeric habit's entry by `step` (default 1).
   * Creates an entry at 0 + step if none exists yet.
   * No-op if the habit is boolean (use logEntry directly).
   */
  incrementEntry: (habitId: string, date: string, step?: number) => void;

  /**
   * Decrement a numeric habit's entry by `step` (default 1).
   * Clamps at 0 and removes the entry when it reaches 0.
   */
  decrementEntry: (habitId: string, date: string, step?: number) => void;

  /** Remove the log entry for a habit on a specific date */
  deleteEntry: (habitId: string, date: string) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Inline helper — avoids a circular import with lib/dates
const todayDateString = (): string => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const entryId = (habitId: string, date: string) => `${habitId}_${date}`;

// ─── Store ────────────────────────────────────────────────────────────────────

export const useHabitStore = create<HabitState>()(
  persist(
    (set, get) => ({
      _schemaVersion: CURRENT_SCHEMA_VERSION,
      habits: [],
      entries: [],

      selectedDate: todayDateString(),
      setSelectedDate: (date) => set({ selectedDate: date }),

      // ── addHabit ────────────────────────────────────────────────────────────
      addHabit: (draft) => {
        const id = Date.now().toString();
        const today = todayDateString();
        const activeCount = get().habits.filter(h => h.archivedAt === null).length;

        const newHabit: Habit = {
          ...draft,
          id,
          createdAt: today,
          archivedAt: null,
          sortOrder: activeCount,
        };

        set(s => ({ habits: [...s.habits, newHabit] }));
        return id;
      },

      // ── updateHabit ─────────────────────────────────────────────────────────
      updateHabit: (id, patch) =>
        set(s => ({
          habits: s.habits.map(h => (h.id === id ? { ...h, ...patch } : h)),
        })),

      // ── archiveHabit ────────────────────────────────────────────────────────
      archiveHabit: (id) =>
        set(s => ({
          habits: s.habits.map(h =>
            h.id === id ? { ...h, archivedAt: todayDateString() } : h,
          ),
        })),

      // ── unarchiveHabit ──────────────────────────────────────────────────────
      unarchiveHabit: (id) => {
        const activeCount = get().habits.filter(h => h.archivedAt === null).length;
        set(s => ({
          habits: s.habits.map(h =>
            h.id === id
              ? { ...h, archivedAt: null, sortOrder: activeCount }
              : h,
          ),
        }));
      },

      // ── deleteHabit (hard) ──────────────────────────────────────────────────
      deleteHabit: (id) =>
        set(s => ({
          habits: s.habits.filter(h => h.id !== id),
          entries: s.entries.filter(e => e.habitId !== id),
        })),

      // ── reorderHabits ───────────────────────────────────────────────────────
      reorderHabits: (orderedIds) =>
        set(s => ({
          habits: s.habits.map(h => {
            const idx = orderedIds.indexOf(h.id);
            return idx === -1 ? h : { ...h, sortOrder: idx };
          }),
        })),

      // ── logEntry ────────────────────────────────────────────────────────────
      logEntry: (habitId, date, value) => {
        const id = entryId(habitId, date);
        const entry: HabitEntry = {
          id,
          habitId,
          date,
          value,
          loggedAt: new Date().toISOString(),
        };
        // Remove any existing entry for this habit+date and push the new one
        set(s => ({
          entries: [...s.entries.filter(e => e.id !== id), entry],
        }));
      },

      // ── incrementEntry ──────────────────────────────────────────────────────
      incrementEntry: (habitId, date, step = 1) => {
        const id = entryId(habitId, date);
        const existing = get().entries.find(e => e.id === id);
        const newValue = (existing?.value ?? 0) + step;

        const entry: HabitEntry = {
          id,
          habitId,
          date,
          value: newValue,
          loggedAt: new Date().toISOString(),
        };
        set(s => ({
          entries: [...s.entries.filter(e => e.id !== id), entry],
        }));
      },

      // ── decrementEntry ──────────────────────────────────────────────────────
      decrementEntry: (habitId, date, step = 1) => {
        const id = entryId(habitId, date);
        const existing = get().entries.find(e => e.id === id);
        const newValue = Math.max(0, (existing?.value ?? 0) - step);

        if (newValue === 0) {
          // Remove the entry entirely when it hits 0
          set(s => ({ entries: s.entries.filter(e => e.id !== id) }));
        } else {
          const entry: HabitEntry = {
            id,
            habitId,
            date,
            value: newValue,
            loggedAt: new Date().toISOString(),
          };
          set(s => ({
            entries: [...s.entries.filter(e => e.id !== id), entry],
          }));
        }
      },

      // ── deleteEntry ─────────────────────────────────────────────────────────
      deleteEntry: (habitId, date) => {
        const id = entryId(habitId, date);
        set(s => ({ entries: s.entries.filter(e => e.id !== id) }));
      },
    }),

    {
      name: 'fovere-habits',
      storage: createJSONStorage(() => appStorage),

      // Runs on EVERY rehydration (not just schema upgrades).
      // Coerces any numeric fields that stale AsyncStorage data might have
      // stored as strings (pre-createJSONStorage era), so that
      // Number("5") → 5 and Number(null) → 0 → handled below.
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (Array.isArray(state.habits)) {
          state.habits = state.habits.map(h => ({
            ...h,
            target:    Number(h.target),
            sortOrder: Number(h.sortOrder),
            archivedAt: h.archivedAt ?? null,
          }));
        }
        if (Array.isArray(state.entries)) {
          state.entries = state.entries.map(e => ({
            ...e,
            value: Number(e.value),
          }));
        }
      },

      // Schema migration — runs once when the persisted version is older
      version: CURRENT_SCHEMA_VERSION,
      migrate: (persisted: unknown, fromVersion: number): HabitState => {
        // When we add fields in future versions, transform here:
        // if (fromVersion < 2) { ... add new fields to persisted habits }
        console.warn(`[HabitStore] migrating schema from v${fromVersion} → v${CURRENT_SCHEMA_VERSION}`);
        const s = persisted as HabitState;
        // Coerce any habits that might have numeric fields stored as strings
        if (Array.isArray(s?.habits)) {
          s.habits = s.habits.map(h => ({
            ...h,
            target: Number(h.target),
            sortOrder: Number(h.sortOrder),
            archivedAt: h.archivedAt ?? null,
          }));
        }
        if (Array.isArray(s?.entries)) {
          s.entries = s.entries.map(e => ({
            ...e,
            value: Number(e.value),
          }));
        }
        return s;
      },
    },
  ),
);

// ─── Selectors ────────────────────────────────────────────────────────────────
// Pure functions: pass the store state as argument so they can be used both
// inside `useHabitStore(selector)` calls and in standalone lib functions.

/** Active (non-archived) habits sorted by sortOrder */
export const selectActiveHabits = (s: HabitState): Habit[] =>
  s.habits
    .filter(h => h.archivedAt === null)
    .sort((a, b) => a.sortOrder - b.sortOrder);

/** Archived habits, newest first */
export const selectArchivedHabits = (s: HabitState): Habit[] =>
  s.habits
    .filter(h => h.archivedAt !== null)
    .sort((a, b) => (b.archivedAt! > a.archivedAt! ? 1 : -1));

/** All entries for a specific calendar date */
export const selectEntriesForDate =
  (date: string) =>
  (s: HabitState): HabitEntry[] =>
    s.entries.filter(e => e.date === date);

/** All entries in an inclusive date range [from, to] */
export const selectEntriesInRange =
  (from: string, to: string) =>
  (s: HabitState): HabitEntry[] =>
    s.entries.filter(e => e.date >= from && e.date <= to);

/** Single entry for a habit on a specific date, or undefined */
export const selectEntry =
  (habitId: string, date: string) =>
  (s: HabitState): HabitEntry | undefined =>
    s.entries.find(e => e.id === `${habitId}_${date}`);

/** Logged value for a habit on a date (0 if no entry) */
export const selectEntryValue =
  (habitId: string, date: string) =>
  (s: HabitState): number =>
    s.entries.find(e => e.id === `${habitId}_${date}`)?.value ?? 0;

/** Whether a habit is completed for a specific date */
export const selectIsCompleted =
  (habit: Habit, date: string) =>
  (s: HabitState): boolean => {
    const value = selectEntryValue(habit.id, date)(s);
    return value >= habit.target;
  };
