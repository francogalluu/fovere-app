import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Check, ChevronRight, TriangleAlert } from 'lucide-react-native';
import { getProgressColor, PROGRESS_COLORS } from '@/lib/progressColors';
import { C } from '@/lib/tokens';
import { ScoreRing } from '@/components/ScoreRing';
import type { Habit } from '@/types/habit';

// ─── Props ────────────────────────────────────────────────────────────────────

interface HabitCardProps {
  habit: Habit;
  /** Pre-computed value for the viewed date/period */
  currentValue: number;
  /** Pre-computed completion flag */
  isCompleted: boolean;
  /** Whether the viewed date is in the future (read-only, disables interaction) */
  readOnly?: boolean;
  /** Navigate to HabitDetail */
  onPress: () => void;
  /** Compact layout (smaller card for home compact view) */
  compact?: boolean;
}

// ─── Icon ring constants (decorative ring around the habit icon) ──────────────

const ICON_WRAP = 56;
const ICON_INNER = 48;
const ICON_WRAP_COMPACT = 40;
const ICON_INNER_COMPACT = 34;
const ICON_R = 26;
const ICON_R_COMPACT = 18;
const ICON_CIRC = 2 * Math.PI * ICON_R;
const ICON_CIRC_COMPACT = 2 * Math.PI * ICON_R_COMPACT;

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Thin decorative arc drawn around the habit icon when pct > 0 and not complete */
function IconArc({ pct, color, compact }: { pct: number; color: string; compact?: boolean }) {
  const wrap = compact ? ICON_WRAP_COMPACT : ICON_WRAP;
  const r = compact ? ICON_R_COMPACT : ICON_R;
  const circ = compact ? ICON_CIRC_COMPACT : ICON_CIRC;
  const offset = circ * (1 - pct / 100);
  return (
    <Svg
      width={wrap}
      height={wrap}
      viewBox={`0 0 ${wrap} ${wrap}`}
      style={{ position: 'absolute', top: -4, left: -4, transform: [{ rotate: '-90deg' }] }}
    >
      <Circle
        cx={wrap / 2} cy={wrap / 2} r={r}
        fill="none" stroke={C.ring} strokeWidth={2}
      />
      <Circle
        cx={wrap / 2} cy={wrap / 2} r={r}
        fill="none" stroke={color} strokeWidth={2}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" opacity={0.4}
      />
    </Svg>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function HabitCard({
  habit,
  currentValue,
  isCompleted,
  readOnly = false,
  onPress,
  compact = false,
}: HabitCardProps) {
  const isBreak       = habit.goalType === 'break';
  const isOverLimit   = isBreak && currentValue > habit.target;
  const pct           = Math.min(100, Math.round((currentValue / habit.target) * 100));
  // Break habits under limit: show green (same as completed). Over/at limit: danger meter.
  const progressColor = isBreak && !isCompleted
    ? (pct >= 100 ? PROGRESS_COLORS.LOW : pct >= 50 ? PROGRESS_COLORS.MID : PROGRESS_COLORS.MID_LOW)
    : getProgressColor(pct);

  const cardStyle = compact ? [s.card, s.cardCompact] : s.card;
  const iconWrapStyle = compact ? [s.iconWrapper, s.iconWrapperCompact] : s.iconWrapper;
  const iconCircleStyle = compact ? [s.iconCircle, s.iconCircleCompact] : s.iconCircle;
  const nameStyle = compact ? [s.habitName, s.habitNameCompact] : s.habitName;
  const progressStyle = compact ? [s.progressText, s.progressTextCompact] : s.progressText;
  const ringSize = compact ? 36 : 48;
  const ringRadius = compact ? 15 : 20;
  const checkSize = compact ? 14 : 18;

  return (
    <Pressable
      onPress={readOnly ? undefined : onPress}
      disabled={readOnly}
      style={({ pressed }) => [
        cardStyle,
        !readOnly && pressed && { opacity: 0.85 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={habit.name}
      accessibilityState={{ disabled: readOnly }}
    >
      {/* ── Icon + decorative arc ──────────────────────────────────────── */}
      <View style={iconWrapStyle}>
        {pct > 0 && !isCompleted && (
          <IconArc pct={pct} color={progressColor} compact={compact} />
        )}
        <View style={[
          iconCircleStyle,
          // Green border when completed (build done, or break under limit). Red when break over limit.
          isCompleted && !isOverLimit && { borderColor: PROGRESS_COLORS.HIGH, borderWidth: 1.5 },
          isOverLimit && { borderColor: PROGRESS_COLORS.LOW, borderWidth: 1.5 },
        ]}>
          <Text style={compact ? [s.iconEmoji, s.iconEmojiCompact] : s.iconEmoji}>{habit.icon}</Text>
        </View>
      </View>

      {/* ── Name + progress text ───────────────────────────────────────── */}
      <View style={s.infoCol}>
        <Text style={nameStyle} numberOfLines={1}>{habit.name}</Text>
        {habit.kind === 'numeric' && (
          <Text style={[progressStyle, isOverLimit && { color: PROGRESS_COLORS.LOW }]}>
            {currentValue} / {habit.target}{habit.unit ? ` ${habit.unit}` : ''}
            {isOverLimit ? '  Over limit' : ''}
          </Text>
        )}
      </View>

      {/* ── Progress ring (right side) ─────────────────────────────────── */}
      {/* In compact view: ring only (no number/icon in center) to avoid text touching the ring. */}
      <ScoreRing
        value={isCompleted ? 100 : pct}
        size={ringSize}
        strokeWidth={compact ? 2.5 : 3}
        radius={ringRadius}
        strokeColor={isCompleted ? PROGRESS_COLORS.HIGH : progressColor}
        renderCenter={(displayPercent) =>
          compact
            ? null
            : isCompleted
              ? (
                  <Check size={checkSize} color={PROGRESS_COLORS.HIGH} strokeWidth={3} />
                )
              : isBreak && pct >= 100
                ? (
                    <TriangleAlert size={checkSize} color={PROGRESS_COLORS.LOW} strokeWidth={2.5} />
                  )
                : pct > 0
                  ? (
                      <Text style={[s.ringPct, { color: progressColor }]}>{displayPercent}%</Text>
                    )
                  : null
        }
      />

      {/* ── Chevron ───────────────────────────────────────────────────── */}
      <View style={[s.chevron, compact && s.chevronCompact, isCompleted && { opacity: 0.4 }]}>
        <ChevronRight size={compact ? 16 : 20} color={C.chevron} strokeWidth={2} />
      </View>
    </Pressable>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 24,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cardCompact: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginBottom: 6,
    shadowRadius: 8,
  },

  // Icon
  iconWrapper: {
    marginRight: 14,
    width: ICON_INNER,
    height: ICON_INNER,
    position: 'relative',
  },
  iconWrapperCompact: {
    marginRight: 10,
    width: ICON_INNER_COMPACT,
    height: ICON_INNER_COMPACT,
  },
  iconCircle: {
    width: ICON_INNER,
    height: ICON_INNER,
    borderRadius: ICON_INNER / 2,
    backgroundColor: C.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  iconCircleCompact: {
    width: ICON_INNER_COMPACT,
    height: ICON_INNER_COMPACT,
    borderRadius: ICON_INNER_COMPACT / 2,
  },
  iconEmoji: { fontSize: 26 },
  iconEmojiCompact: { fontSize: 20 },

  // Info column
  infoCol: { flex: 1, minWidth: 0 },
  habitName: {
    fontSize: 17,
    fontWeight: '600',
    color: C.text1,
    marginBottom: 2,
  },
  habitNameCompact: {
    fontSize: 15,
    marginBottom: 0,
  },
  progressText: {
    fontSize: 15,
    fontWeight: '400',
    color: C.text2,
  },
  progressTextCompact: {
    fontSize: 13,
  },

  // Ring center overlay
  ringCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  ringPct:    { fontSize: 12, fontWeight: '600' },
  ringPctCompact: { fontSize: 10 },

  // Chevron
  chevron: { marginLeft: 8 },
  chevronCompact: { marginLeft: 4 },
});
