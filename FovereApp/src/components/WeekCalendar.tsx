import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import {
  getWeekDates,
  getDayOfMonth,
  getDayOfWeekIndex,
  SHORT_DAY_LABELS,
  isToday,
  isFuture,
} from '@/lib/dates';
import { getProgressColor } from '@/lib/progressColors';


interface WeekCalendarProps {
  selectedDate: string;                        // YYYY-MM-DD
  completionByDate: Record<string, number>;    // YYYY-MM-DD → 0–100
  onDateSelect: (date: string) => void;
}

const RING_SIZE = 48;
const RADIUS = 20;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const STROKE_WIDTH = 2;
const CX = RING_SIZE / 2;
const CY = RING_SIZE / 2;

export function WeekCalendar({ selectedDate, completionByDate, onDateSelect }: WeekCalendarProps) {
  const weekDates = getWeekDates(selectedDate);

  return (
    <View style={styles.row}>
      {weekDates.map((date) => {
        const completion = completionByDate[date] ?? 0;
        const isSelected = date === selectedDate;
        const isTodayDate = isToday(date);
        const isFutureDate = isFuture(date);
        const ringColor = getProgressColor(completion);
        const dashOffset = CIRCUMFERENCE * (1 - completion / 100);
        const dayLabel = SHORT_DAY_LABELS[getDayOfWeekIndex(date)];
        const dayNumber = getDayOfMonth(date);

        return (
          <Pressable
            key={date}
            onPress={() => onDateSelect(date)}
            style={styles.dayItem}
            accessibilityLabel={`Select ${date}`}
          >
            {/* Day letter */}
            <Text style={[styles.dayLabel, isSelected ? styles.dayLabelActive : null]}>
              {dayLabel}
            </Text>

            {/* Circle area */}
            <View style={styles.circleWrapper}>
              {isSelected ? (
                /* Selected: filled teal disc */
                <Svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}>
                  <Circle cx={CX} cy={CY} r={RADIUS} fill="#008080" />
                </Svg>
              ) : (
                /* Other days: progress ring */
                <Svg
                  width={RING_SIZE}
                  height={RING_SIZE}
                  viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
                  style={{ transform: [{ rotate: '-90deg' }], opacity: isFutureDate ? 0.45 : 1 }}
                >
                  {/* Track */}
                  <Circle
                    cx={CX}
                    cy={CY}
                    r={RADIUS}
                    fill="none"
                    stroke="#E5E5E7"
                    strokeWidth={STROKE_WIDTH}
                  />
                  {/* Progress arc */}
                  {completion > 0 && (
                    <Circle
                      cx={CX}
                      cy={CY}
                      r={RADIUS}
                      fill="none"
                      stroke={ringColor}
                      strokeWidth={STROKE_WIDTH}
                      strokeDasharray={CIRCUMFERENCE}
                      strokeDashoffset={dashOffset}
                      strokeLinecap="round"
                    />
                  )}
                </Svg>
              )}

              {/* Date number centered inside the circle */}
              <View style={styles.dateOverlay}>
                <Text
                  style={[
                    styles.dateNumber,
                    isSelected ? styles.dateNumberSelected : null,
                    !isSelected && isFutureDate ? styles.dateNumberFaded : null,
                    !isSelected && isTodayDate ? styles.dateNumberToday : null,
                  ]}
                >
                  {dayNumber}
                </Text>
              </View>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dayItem: {
    alignItems: 'center',
    gap: 6,
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8E8E93',
    letterSpacing: 0.3,
  },
  dayLabelActive: {
    color: '#008080',
  },
  circleWrapper: {
    width: RING_SIZE,
    height: RING_SIZE,
    position: 'relative',
  },
  dateOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateNumber: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  dateNumberSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  dateNumberFaded: {
    opacity: 0.45,
  },
  dateNumberToday: {
    fontWeight: '700',
  },
});
