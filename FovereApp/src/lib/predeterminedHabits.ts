/**
 * Predetermined habits shown in "Add a new habit" picker.
 * Tapping one pre-fills the create-habit wizard.
 */
export interface PredeterminedHabit {
  id: string;
  name: string;
  icon: string;
  goalType: 'build' | 'break';
  kind: 'boolean' | 'numeric';
  frequency: 'daily' | 'weekly' | 'monthly';
  target: number;
  unit?: string;
}

export interface PredeterminedCategory {
  title: string;
  habits: PredeterminedHabit[];
}

export const PREDETERMINED_CATEGORIES: PredeterminedCategory[] = [
  {
    title: 'Healthy habits',
    habits: [
      { id: 'drink-water', name: 'Drink water', icon: '💧', goalType: 'build', kind: 'numeric', frequency: 'daily', target: 8, unit: 'glasses' },
      { id: 'eat-vegetables', name: 'Eat vegetables', icon: '🥕', goalType: 'build', kind: 'numeric', frequency: 'daily', target: 2, unit: 'servings' },
      { id: 'brush-teeth', name: 'Brush teeth', icon: '🦷', goalType: 'build', kind: 'boolean', frequency: 'daily', target: 1 },
      { id: 'take-vitamins', name: 'Take vitamins', icon: '💊', goalType: 'build', kind: 'boolean', frequency: 'daily', target: 1 },
      { id: 'floss', name: 'Floss', icon: '🧵', goalType: 'build', kind: 'boolean', frequency: 'daily', target: 1 },
      { id: 'meditate', name: 'Meditate', icon: '🧘', goalType: 'build', kind: 'numeric', frequency: 'daily', target: 10, unit: 'min' },
      { id: 'stretch', name: 'Stretch', icon: '🤸', goalType: 'build', kind: 'numeric', frequency: 'daily', target: 5, unit: 'min' },
      { id: 'sleep-early', name: 'Sleep by 10pm', icon: '😴', goalType: 'build', kind: 'boolean', frequency: 'daily', target: 1 },
      { id: 'no-screens-bed', name: 'No screens before bed', icon: '📵', goalType: 'build', kind: 'boolean', frequency: 'daily', target: 1 },
      { id: 'green-vegetable', name: 'Eat a green vegetable', icon: '🥬', goalType: 'build', kind: 'boolean', frequency: 'daily', target: 1 },
    ],
  },
  {
    title: 'Fitness & movement',
    habits: [
      { id: 'morning-run', name: 'Morning run', icon: '🏃', goalType: 'build', kind: 'numeric', frequency: 'daily', target: 30, unit: 'min' },
      { id: 'take-walk', name: 'Take a walk', icon: '🚶', goalType: 'build', kind: 'numeric', frequency: 'daily', target: 20, unit: 'min' },
      { id: 'yoga', name: 'Yoga', icon: '🧘‍♀️', goalType: 'build', kind: 'numeric', frequency: 'daily', target: 15, unit: 'min' },
      { id: 'gym', name: 'Gym / workout', icon: '🏋️', goalType: 'build', kind: 'numeric', frequency: 'weekly', target: 3, unit: 'times' },
      { id: 'steps', name: 'Hit step goal', icon: '👟', goalType: 'build', kind: 'numeric', frequency: 'daily', target: 10000, unit: 'steps' },
      { id: 'stairs', name: 'Take the stairs', icon: '🪜', goalType: 'build', kind: 'boolean', frequency: 'daily', target: 1 },
      { id: 'stretch-daily', name: 'Stretch', icon: '🙆', goalType: 'build', kind: 'numeric', frequency: 'daily', target: 5, unit: 'min' },
      { id: 'plank', name: 'Plank', icon: '💪', goalType: 'build', kind: 'numeric', frequency: 'daily', target: 1, unit: 'min' },
      { id: 'pushups', name: 'Push-ups', icon: '🦾', goalType: 'build', kind: 'numeric', frequency: 'daily', target: 20, unit: 'reps' },
    ],
  },
  {
    title: 'Mind & learning',
    habits: [
      { id: 'read', name: 'Read', icon: '📚', goalType: 'build', kind: 'numeric', frequency: 'daily', target: 20, unit: 'min' },
      { id: 'journal', name: 'Journal', icon: '📔', goalType: 'build', kind: 'boolean', frequency: 'daily', target: 1 },
      { id: 'learn-language', name: 'Practice language', icon: '🗣️', goalType: 'build', kind: 'numeric', frequency: 'daily', target: 15, unit: 'min' },
      { id: 'no-phone-morning', name: 'No phone first hour', icon: '☀️', goalType: 'build', kind: 'boolean', frequency: 'daily', target: 1 },
      { id: 'gratitude', name: 'Gratitude list', icon: '🙏', goalType: 'build', kind: 'boolean', frequency: 'daily', target: 1 },
      { id: 'podcast', name: 'Listen to podcast', icon: '🎧', goalType: 'build', kind: 'numeric', frequency: 'daily', target: 1, unit: 'episode' },
      { id: 'course', name: 'Study / course', icon: '📖', goalType: 'build', kind: 'numeric', frequency: 'daily', target: 30, unit: 'min' },
    ],
  },
  {
    title: 'Break habits',
    habits: [
      { id: 'reduce-social-media', name: 'Reduce social media', icon: '📱', goalType: 'break', kind: 'numeric', frequency: 'daily', target: 60, unit: 'min' },
      { id: 'reduce-alcohol', name: 'Reduce alcohol', icon: '🍺', goalType: 'break', kind: 'numeric', frequency: 'daily', target: 1, unit: 'drinks' },
      { id: 'eat-fewer-sweets', name: 'Eat fewer sweets', icon: '🍰', goalType: 'break', kind: 'numeric', frequency: 'daily', target: 1, unit: 'servings' },
      { id: 'no-soda', name: 'No soda', icon: '🥤', goalType: 'break', kind: 'boolean', frequency: 'daily', target: 1 },
      { id: 'no-smoking', name: 'No smoking', icon: '🚭', goalType: 'break', kind: 'boolean', frequency: 'daily', target: 1 },
      { id: 'limit-caffeine', name: 'Limit caffeine', icon: '☕', goalType: 'break', kind: 'numeric', frequency: 'daily', target: 2, unit: 'cups' },
      { id: 'no-late-snack', name: 'No late-night snacking', icon: '🌙', goalType: 'break', kind: 'boolean', frequency: 'daily', target: 1 },
      { id: 'reduce-sugar', name: 'Reduce added sugar', icon: '🍬', goalType: 'break', kind: 'numeric', frequency: 'daily', target: 25, unit: 'g' },
      { id: 'screen-time', name: 'Limit screen time', icon: '📺', goalType: 'break', kind: 'numeric', frequency: 'daily', target: 120, unit: 'min' },
    ],
  },
  {
    title: 'Productivity & home',
    habits: [
      { id: 'make-bed', name: 'Make bed', icon: '🛏️', goalType: 'build', kind: 'boolean', frequency: 'daily', target: 1 },
      { id: 'tidy-10min', name: 'Tidy 10 minutes', icon: '🧹', goalType: 'build', kind: 'numeric', frequency: 'daily', target: 10, unit: 'min' },
      { id: 'plan-day', name: 'Plan the day', icon: '📋', goalType: 'build', kind: 'boolean', frequency: 'daily', target: 1 },
      { id: 'inbox-zero', name: 'Inbox zero', icon: '📧', goalType: 'build', kind: 'boolean', frequency: 'daily', target: 1 },
      { id: 'no-procrastinate', name: 'Do hardest task first', icon: '🐸', goalType: 'build', kind: 'boolean', frequency: 'daily', target: 1 },
      { id: 'deep-work', name: 'Deep work block', icon: '🎯', goalType: 'build', kind: 'numeric', frequency: 'daily', target: 90, unit: 'min' },
      { id: 'laundry', name: 'Do laundry', icon: '👕', goalType: 'build', kind: 'boolean', frequency: 'weekly', target: 1 },
    ],
  },
  {
    title: 'Social & creativity',
    habits: [
      { id: 'call-family', name: 'Call family or friend', icon: '📞', goalType: 'build', kind: 'boolean', frequency: 'weekly', target: 2, unit: 'calls' },
      { id: 'creative-time', name: 'Creative time', icon: '🎨', goalType: 'build', kind: 'numeric', frequency: 'daily', target: 30, unit: 'min' },
      { id: 'write', name: 'Write', icon: '✍️', goalType: 'build', kind: 'numeric', frequency: 'daily', target: 500, unit: 'words' },
      { id: 'practice-instrument', name: 'Practice instrument', icon: '🎸', goalType: 'build', kind: 'numeric', frequency: 'daily', target: 20, unit: 'min' },
      { id: 'get-outside', name: 'Get outside', icon: '🌳', goalType: 'build', kind: 'numeric', frequency: 'daily', target: 30, unit: 'min' },
    ],
  },
];

export function searchPredetermined(query: string): PredeterminedCategory[] {
  const q = query.trim().toLowerCase();
  if (!q) return PREDETERMINED_CATEGORIES;
  const result: PredeterminedCategory[] = [];
  for (const cat of PREDETERMINED_CATEGORIES) {
    const matches = cat.habits.filter(h => h.name.toLowerCase().includes(q));
    if (matches.length > 0) result.push({ title: cat.title, habits: matches });
  }
  return result;
}
