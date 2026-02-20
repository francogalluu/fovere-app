import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Check, ChevronRight, Minus, Plus } from 'lucide-react-native';
import { getProgressColor, PROGRESS_COLORS } from '@/lib/progressColors';
import type { Habit } from '@/types/habit';

// ─── Props ────────────────────────────────────────────────────────────────────

interface HabitCardProps {
  habit: Habit;
  /** Pre-computed value for the viewed date/period */
  currentValue: number;
  /** Pre-computed completion flag */
  isCompleted: boolean;
  /** Whether the viewed date is in the future (read-only) */
  readOnly?: boolean;
  /** Navigate to HabitDetail */
  onPress: () => void;
  /** Boolean habit: toggle done/undone */
  onToggle?: () => void;
  /** Numeric habit: increase value by 1 */
  onIncrement?: () => void;
  /** Numeric habit: decrease value by 1 */
  onDecrement?: () => void;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const ICON_RING_SIZE = 56;
const ICON_INNER = 48;
const ICON_R = 26;
const ICON_CIRC = 2 * Math.PI * ICON_R;

const STAT_RING_SIZE = 48;
const STAT_R = 20;
const STAT_CIRC = 2 * Math.PI * STAT_R;

/** Small decorative progress ring drawn around the habit icon */
function IconProgressRing({ percentage, color }: { percentage: number; color: string }) {
  const dashOffset = ICON_CIRC * (1 - percentage / 100);
  return (
    <Svg
      width={ICON_RING_SIZE}
      height={ICON_RING_SIZE}
      viewBox={`0 0 ${ICON_RING_SIZE} ${ICON_RING_SIZE}`}
      style={{ position: 'absolute', top: -4, left: -4, transform: [{ rotate: '-90deg' }] }}
    >
      <Circle
        cx={ICON_RING_SIZE / 2} cy={ICON_RING_SIZE / 2} r={ICON_R}
        fill="none" stroke="#E5E5E5" strokeWidth={2}
      />
      <Circle
        cx={ICON_RING_SIZE / 2} cy={ICON_RING_SIZE / 2} r={ICON_R}
        fill="none" stroke={color} strokeWidth={2}
        strokeDasharray={ICON_CIRC} strokeDashoffset={dashOffset}
        strokeLinecap="round" opacity={0.4}
      />
    </Svg>
  );
}

/** Right-side status ring: shows %, checkmark (completed), or empty ring (boolean incomplete) */
function StatusRing({
  habit,
  currentValue,
  isCompleted,
  progressPercentage,
  progressColor,
  onToggle,
  onIncrement,
  onDecrement,
  readOnly,
}: {
  habit: Habit;
  currentValue: number;
  isCompleted: boolean;
  progressPercentage: number;
  progressColor: string;
  onToggle?: () => void;
  onIncrement?: () => void;
  onDecrement?: () => void;
  readOnly?: boolean;
}) {
  const dashOffset = STAT_CIRC * (1 - progressPercentage / 100);
  const disabledDecrement = (readOnly ?? false) || currentValue <= 0;
  const disabledIncrement = readOnly ?? false;

  if (habit.kind === 'numeric') {
    // Numeric habit: show "−  value  +" controls
    return (
      <View style={styles.numericControls}>
        <Pressable
          onPress={onDecrement}
          disabled={disabledDecrement}
          hitSlop={8}
          style={[styles.numericBtn, disabledDecrement ? styles.numericBtnDisabled : null]}
          accessibilityLabel="Decrease"
        >
          <Minus size={16} color={currentValue > 0 && !readOnly ? '#1A1A1A' : '#C7C7CC'} strokeWidth={2.5} />
        </Pressable>

        <View style={styles.numericValueBox}>
          <Text style={[styles.numericValue, isCompleted ? { color: PROGRESS_COLORS.HIGH } : null]}>
            {currentValue}
          </Text>
          {habit.unit ? <Text style={styles.numericUnit}>/{habit.target}{habit.unit}</Text> : null}
        </View>

        <Pressable
          onPress={onIncrement}
          disabled={disabledIncrement}
          hitSlop={8}
          style={[styles.numericBtn, disabledIncrement ? styles.numericBtnDisabled : null]}
          accessibilityLabel="Increase"
        >
          <Plus size={16} color={readOnly ? '#C7C7CC' : '#1A1A1A'} strokeWidth={2.5} />
        </Pressable>
      </View>
    );
  }

  // Boolean habit: circular SVG ring with check or % label
  return (
    <Pressable
      onPress={readOnly ? undefined : onToggle}
      hitSlop={8}
      accessibilityLabel={isCompleted ? 'Mark incomplete' : 'Mark complete'}
    >
      <View style={{ width: STAT_RING_SIZE, height: STAT_RING_SIZE }}>
        <Svg
          width={STAT_RING_SIZE}
          height={STAT_RING_SIZE}
          viewBox={`0 0 ${STAT_RING_SIZE} ${STAT_RING_SIZE}`}
          style={{ transform: [{ rotate: '-90deg' }] }}
        >
          <Circle
            cx={STAT_RING_SIZE / 2} cy={STAT_RING_SIZE / 2} r={STAT_R}
            fill="none" stroke="#E5E5E5" strokeWidth={3}
          />
          {progressPercentage > 0 && (
            <Circle
              cx={STAT_RING_SIZE / 2} cy={STAT_RING_SIZE / 2} r={STAT_R}
              fill="none" stroke={isCompleted ? PROGRESS_COLORS.HIGH : progressColor}
              strokeWidth={3}
              strokeDasharray={STAT_CIRC}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
            />
          )}
        </Svg>
        <View style={StyleSheet.absoluteFillObject}>
          <View style={styles.statRingCenter}>
            {isCompleted ? (
              <Check size={18} color={PROGRESS_COLORS.HIGH} strokeWidth={3} />
            ) : (
              <Text style={[styles.statPercent, { color: progressColor }]}>
                {Math.round(progressPercentage)}%
              </Text>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function HabitCard({
  habit,
  currentValue,
  isCompleted,
  readOnly = false,
  onPress,
  onToggle,
  onIncrement,
  onDecrement,
}: HabitCardProps) {
  const progressPercentage = Math.min(100, Math.round((currentValue / habit.target) * 100));
  const progressColor = getProgressColor(progressPercentage);

  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, isCompleted ? styles.cardCompleted : null]}
      accessibilityRole="button"
      accessibilityLabel={habit.name}
    >
      {/* Icon + optional decorative progress ring */}
      <View style={styles.iconWrapper}>
        {progressPercentage > 0 && !isCompleted && (
          <IconProgressRing percentage={progressPercentage} color={progressColor} />
        )}
        <View style={[
          styles.iconCircle,
          isCompleted ? { borderColor: PROGRESS_COLORS.HIGH, borderWidth: 1.5 } : null,
        ]}>
          <Text style={styles.iconEmoji}>{habit.icon}</Text>
        </View>
      </View>

      {/* Name + progress label */}
      <View style={styles.infoColumn}>
        <Text style={styles.habitName} numberOfLines={1}>{habit.name}</Text>
        {habit.kind === 'numeric' && (
          <Text style={styles.progressLabel}>
            {currentValue} / {habit.target} {habit.unit ?? ''}
          </Text>
        )}
      </View>

      {/* Right action area: status ring (boolean) or ± controls (numeric) */}
      <StatusRing
        habit={habit}
        currentValue={currentValue}
        isCompleted={isCompleted}
        progressPercentage={progressPercentage}
        progressColor={progressColor}
        onToggle={onToggle}
        onIncrement={onIncrement}
        onDecrement={onDecrement}
        readOnly={readOnly}
      />

      {/* Chevron — wrap in View so marginLeft/opacity never reach lucide's SVG children */}
      <View style={{ marginLeft: 6, opacity: isCompleted ? 0.4 : 1 }}>
        <ChevronRight size={20} color="#C7C7CC" strokeWidth={2} />
      </View>
    </Pressable>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
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
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cardCompleted: {
    opacity: 0.92,
  },
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
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  iconEmoji: {
    fontSize: 26,
  },
  infoColumn: {
    flex: 1,
    minWidth: 0,
  },
  habitName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '400',
    color: '#8E8E93',
  },
  statRingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statPercent: {
    fontSize: 11,
    fontWeight: '600',
  },
  numericControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  numericBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numericBtnDisabled: {
    opacity: 0.4,
  },
  numericValueBox: {
    alignItems: 'center',
    minWidth: 44,
  },
  numericValue: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  numericUnit: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '400',
  },
});
