import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Check, ChevronRight } from 'lucide-react-native';
import { getProgressColor, PROGRESS_COLORS } from '@/lib/progressColors';
import { C } from '@/lib/tokens';
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
}

// ─── Icon ring constants (decorative ring around the habit icon) ──────────────

const ICON_WRAP = 56; // outer size including ring overflow
const ICON_INNER = 48;
const ICON_R = 26;
const ICON_CIRC = 2 * Math.PI * ICON_R;

// ─── Status ring constants (right-side progress / completion indicator) ───────

const RING_SIZE = 48;
const RING_R = 20;
const RING_CIRC = 2 * Math.PI * RING_R;

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Thin decorative arc drawn around the habit icon when pct > 0 and not complete */
function IconArc({ pct, color }: { pct: number; color: string }) {
  const offset = ICON_CIRC * (1 - pct / 100);
  return (
    <Svg
      width={ICON_WRAP}
      height={ICON_WRAP}
      viewBox={`0 0 ${ICON_WRAP} ${ICON_WRAP}`}
      style={{ position: 'absolute', top: -4, left: -4, transform: [{ rotate: '-90deg' }] }}
    >
      <Circle
        cx={ICON_WRAP / 2} cy={ICON_WRAP / 2} r={ICON_R}
        fill="none" stroke={C.ring} strokeWidth={2}
      />
      <Circle
        cx={ICON_WRAP / 2} cy={ICON_WRAP / 2} r={ICON_R}
        fill="none" stroke={color} strokeWidth={2}
        strokeDasharray={ICON_CIRC} strokeDashoffset={offset}
        strokeLinecap="round" opacity={0.4}
      />
    </Svg>
  );
}

/**
 * Right-side status ring — purely visual, no interactive controls.
 *
 * Three states (matching web reference HabitCard exactly):
 *   completed   → full green ring + ✓ check
 *   in-progress → partial ring + "XX%" label
 *   0%          → track-only ring (empty)
 */
function ProgressRing({
  pct,
  isCompleted,
  progressColor,
}: {
  pct: number;
  isCompleted: boolean;
  progressColor: string;
}) {
  const offset = RING_CIRC * (1 - pct / 100);
  const ringColor = isCompleted ? PROGRESS_COLORS.HIGH : progressColor;

  return (
    <View style={{ width: RING_SIZE, height: RING_SIZE }}>
      <Svg
        width={RING_SIZE}
        height={RING_SIZE}
        viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
        style={{ transform: [{ rotate: '-90deg' }] }}
      >
        {/* Track */}
        <Circle
          cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_R}
          fill="none" stroke={C.ring} strokeWidth={3}
        />
        {/* Progress arc — only when pct > 0 */}
        {pct > 0 && (
          <Circle
            cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_R}
            fill="none" stroke={ringColor} strokeWidth={3}
            strokeDasharray={RING_CIRC} strokeDashoffset={offset}
            strokeLinecap="round"
          />
        )}
      </Svg>

      {/* Center content */}
      <View style={StyleSheet.absoluteFillObject}>
        <View style={s.ringCenter}>
          {isCompleted ? (
            <Check size={18} color={PROGRESS_COLORS.HIGH} strokeWidth={3} />
          ) : pct > 0 ? (
            <Text style={[s.ringPct, { color: progressColor }]}>
              {Math.round(pct)}%
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function HabitCard({
  habit,
  currentValue,
  isCompleted,
  readOnly = false,
  onPress,
}: HabitCardProps) {
  const pct          = Math.min(100, Math.round((currentValue / habit.target) * 100));
  const progressColor = getProgressColor(pct);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        s.card,
        isCompleted && s.cardCompleted,
        pressed && { opacity: 0.85 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={habit.name}
    >
      {/* ── Icon + decorative arc ──────────────────────────────────────── */}
      <View style={s.iconWrapper}>
        {pct > 0 && !isCompleted && (
          <IconArc pct={pct} color={progressColor} />
        )}
        <View style={[
          s.iconCircle,
          isCompleted && { borderColor: PROGRESS_COLORS.HIGH, borderWidth: 1.5 },
        ]}>
          <Text style={s.iconEmoji}>{habit.icon}</Text>
        </View>
      </View>

      {/* ── Name + progress text ───────────────────────────────────────── */}
      <View style={s.infoCol}>
        <Text style={s.habitName} numberOfLines={1}>{habit.name}</Text>
        {habit.kind === 'numeric' && (
          <Text style={s.progressText}>
            {currentValue} / {habit.target}{habit.unit ? ` ${habit.unit}` : ''}
          </Text>
        )}
      </View>

      {/* ── Progress ring (right side) ─────────────────────────────────── */}
      <ProgressRing pct={pct} isCompleted={isCompleted} progressColor={progressColor} />

      {/* ── Chevron ───────────────────────────────────────────────────── */}
      <View style={[s.chevron, isCompleted && { opacity: 0.4 }]}>
        <ChevronRight size={20} color={C.chevron} strokeWidth={2} />
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
    backgroundColor: C.bgCard,
    // Shadow matching web: box-shadow 0 12px 40px rgba(0,0,0,0.08)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cardCompleted: {
    opacity: 0.92,
  },

  // Icon
  iconWrapper: {
    marginRight: 14,
    width: ICON_INNER,
    height: ICON_INNER,
    position: 'relative',
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
  iconEmoji: { fontSize: 26 },

  // Info column
  infoCol: { flex: 1, minWidth: 0 },
  habitName: {
    fontSize: 17,
    fontWeight: '600',
    color: C.text1,
    marginBottom: 2,
  },
  progressText: {
    fontSize: 15,
    fontWeight: '400',
    color: C.text2,
  },

  // Ring center overlay
  ringCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  ringPct:    { fontSize: 12, fontWeight: '600' },

  // Chevron
  chevron: { marginLeft: 8 },
});
