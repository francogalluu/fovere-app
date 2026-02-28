/**
 * Wizard draft store — holds in-progress new/edit habit state across all wizard steps.
 * NOT persisted: resets when the app is killed.
 */
import { create } from 'zustand';
import type { Habit } from '@/types/habit';

interface WizardState {
  /** null = creating a new habit; set = editing an existing one */
  habitId: string | null;

  goalType: 'build' | 'break';
  name: string;
  icon: string;
  kind: 'boolean' | 'numeric';
  frequency: 'daily' | 'weekly' | 'monthly';
  target: number;
  unit: string;
  reminderEnabled: boolean;
  reminderTime: string; // "HH:MM" 24-hour

  // ── Setters ────────────────────────────────────────────────────────────────
  reset: () => void;
  loadHabit: (habit: Habit) => void;
  /** Pre-fill wizard from a predetermined habit (no habitId). */
  loadPredetermined: (draft: {
    name: string;
    icon: string;
    goalType: 'build' | 'break';
    kind: 'boolean' | 'numeric';
    frequency: 'daily' | 'weekly' | 'monthly';
    target: number;
    unit?: string;
  }) => void;
  setGoalType: (v: 'build' | 'break') => void;
  setName: (v: string) => void;
  setIcon: (v: string) => void;
  setKind: (v: 'boolean' | 'numeric') => void;
  setFrequency: (v: 'daily' | 'weekly' | 'monthly') => void;
  setTarget: (v: number) => void;
  setUnit: (v: string) => void;
  setReminderEnabled: (v: boolean) => void;
  setReminderTime: (v: string) => void;
}

const DEFAULTS: Omit<WizardState, keyof Pick<WizardState,
  'reset' | 'loadHabit' | 'setGoalType' | 'setName' | 'setIcon' |
  'setKind' | 'setFrequency' | 'setTarget' | 'setUnit' |
  'setReminderEnabled' | 'setReminderTime'
>> = {
  habitId:         null,
  goalType:        'build',
  name:            '',
  icon:            '⭐',
  kind:            'boolean',
  frequency:       'daily',
  target:          1,
  unit:            '',
  reminderEnabled: false,
  reminderTime:    '08:00',
};

export const useWizardStore = create<WizardState>()((set) => ({
  ...DEFAULTS,

  reset: () => set(DEFAULTS),

  loadHabit: (habit) => set({
    habitId:         habit.id,
    goalType:        habit.goalType ?? 'build',
    name:            habit.name,
    icon:            habit.icon,
    kind:            habit.kind,
    frequency:       habit.frequency,
    target:          habit.target,
    unit:            habit.unit ?? '',
    reminderEnabled: !!habit.reminderTime,
    reminderTime:    habit.reminderTime ?? '08:00',
  }),

  loadPredetermined: (draft) => set({
    habitId:         null,
    goalType:        draft.goalType,
    name:            draft.name,
    icon:            draft.icon,
    kind:            draft.kind,
    frequency:       draft.frequency,
    target:          draft.target,
    unit:            draft.unit ?? '',
    reminderEnabled: false,
    reminderTime:    DEFAULTS.reminderTime,
  }),

  setGoalType:        (goalType)        => set({ goalType }),
  setName:            (name)            => set({ name }),
  setIcon:            (icon)            => set({ icon }),
  setKind:            (kind)            => set({ kind }),
  setFrequency:       (frequency)       => set({ frequency }),
  setTarget:          (target)          => set({ target }),
  setUnit:            (unit)            => set({ unit }),
  setReminderEnabled: (reminderEnabled) => set({ reminderEnabled }),
  setReminderTime:    (reminderTime)    => set({ reminderTime }),
}));
