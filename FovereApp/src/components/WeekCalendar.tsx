import React, { useRef, useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
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

const RING_SIZE = 48;
const RADIUS = 20;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const STROKE_WIDTH = 2;
const CX = RING_SIZE / 2;
const CY = RING_SIZE / 2;

interface WeekCalendarProps {
  /** When provided, show multiple weeks in a horizontal scroll; otherwise single week. */
  weeks?: string[][];
  selectedDate: string;
  completionByDate: Record<string, number>;
  onDateSelect: (date: string) => void;
}

export function WeekCalendar({
  weeks: weeksProp,
  selectedDate,
  completionByDate,
  onDateSelect,
}: WeekCalendarProps) {
  const scrollRef = useRef<ScrollView>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const weeks = weeksProp ?? [getWeekDates(selectedDate)];

  const weekIndexForDate = weeks.findIndex(w => w.includes(selectedDate));
  useEffect(() => {
    if (weeks.length <= 1 || weekIndexForDate < 0 || containerWidth <= 0) return;
    scrollRef.current?.scrollTo({
      x: weekIndexForDate * containerWidth,
      animated: false,
    });
  }, [selectedDate, weekIndexForDate, weeks.length, containerWidth]);

  const renderDay = (date: string, fillWeek?: boolean) => {
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
        style={[styles.dayItem, fillWeek && styles.dayItemFill]}
        accessibilityLabel={`Select ${date}`}
      >
        <Text style={[styles.dayLabel, isSelected ? styles.dayLabelActive : null]}>
          {dayLabel}
        </Text>
        <View style={styles.circleWrapper}>
          {isSelected ? (
            <Svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}>
              <Circle cx={CX} cy={CY} r={RADIUS} fill="#008080" />
            </Svg>
          ) : (
            <Svg
              width={RING_SIZE}
              height={RING_SIZE}
              viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
              style={{ transform: [{ rotate: '-90deg' }], opacity: isFutureDate ? 0.45 : 1 }}
            >
              <Circle cx={CX} cy={CY} r={RADIUS} fill="none" stroke="#E5E5E7" strokeWidth={STROKE_WIDTH} />
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
  };

  if (weeks.length > 1) {
    return (
      <View
        style={styles.scrollWrap}
        onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
      >
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          decelerationRate="fast"
        >
          {weeks.map((weekDates) => (
            <View
              key={weekDates[0]}
              style={[styles.row, styles.weekColumn, containerWidth > 0 && { width: containerWidth }]}
            >
              {weekDates.map((date) => renderDay(date, true))}
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.row}>
      {weeks[0].map((date) => renderDay(date))}
    </View>
  );
}

const styles = StyleSheet.create({
  scrollWrap: {
    width: '100%',
  },
  scrollContent: {
    paddingVertical: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  weekColumn: {
    justifyContent: 'space-between',
  },
  dayItem: {
    alignItems: 'center',
    gap: 6,
  },
  dayItemFill: {
    flex: 1,
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
