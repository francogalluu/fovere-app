/**
 * Global Progress State Variable System
 * 
 * Progress / State tokens for unified color mapping across the entire app.
 * All progress indicators must reference these tokens.
 * 
 * USAGE RULES:
 * ✅ DO: Always use getProgressColor(percentage) for dynamic progress
 * ✅ DO: Use PROGRESS_COLORS.HIGH for static 100% completed states
 * ✅ DO: Import both getProgressColor and PROGRESS_COLORS when needed
 * ❌ DON'T: Hardcode progress colors anywhere in components
 * ❌ DON'T: Create new color logic - extend this file instead
 * 
 * CONSISTENCY GUARANTEE:
 * The same percentage will ALWAYS map to the same color everywhere in the app.
 * Example: 62% will always be Yellow/Amber (#D97706), never Green.
 */

// Progress / State Tokens
export const PROGRESS_COLORS = {
  NONE: '#E5E5E7',      // Progress / None - Light Gray (0%)
  LOW: '#DC2626',       // Progress / Low - Red (0-29%)
  MID_LOW: '#EA580C',   // Progress / Mid-Low - Orange (30-49%)
  MID: '#D97706',       // Progress / Mid - Yellow/Amber (50-69%) - High contrast
  HIGH: '#34C759',      // Progress / High - Green (70-100%)
} as const;

/**
 * Get progress color based on percentage
 * @param percentage - Progress percentage (0-100)
 * @returns Color hex code from Progress / State tokens
 */
export const getProgressColor = (percentage: number): string => {
  if (percentage >= 70) return PROGRESS_COLORS.HIGH;      // Green: 70-100%
  if (percentage >= 50) return PROGRESS_COLORS.MID;       // Yellow: 50-69%
  if (percentage >= 30) return PROGRESS_COLORS.MID_LOW;   // Orange: 30-49%
  if (percentage > 0) return PROGRESS_COLORS.LOW;         // Red: 0-29%
  return PROGRESS_COLORS.NONE;                            // Gray: 0%
};