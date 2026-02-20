import React, { useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { HabitCard } from './HabitCard';
import { C } from '@/lib/tokens';
import type { Habit } from '@/types/habit';

interface SwipeableHabitCardProps {
  habit: Habit;
  currentValue: number;
  isCompleted: boolean;
  readOnly: boolean;
  onPress: () => void;
  /** Called when the swipe action is confirmed — caller decides logEntry vs deleteEntry */
  onComplete: () => void;
}

function RightActions({ isCompleted }: { isCompleted: boolean }) {
  return (
    <View style={s.rightAction}>
      <Text style={s.actionText}>{isCompleted ? 'Undo' : 'Done'}</Text>
    </View>
  );
}

export function SwipeableHabitCard({
  habit,
  currentValue,
  isCompleted,
  readOnly,
  onPress,
  onComplete,
}: SwipeableHabitCardProps) {
  const swipeRef = useRef<Swipeable>(null);

  const handleSwipeOpen = () => {
    onComplete();
    // Close after a brief moment so the user sees the action
    setTimeout(() => swipeRef.current?.close(), 250);
  };

  return (
    <Swipeable
      ref={swipeRef}
      renderRightActions={() => <RightActions isCompleted={isCompleted} />}
      onSwipeableOpen={handleSwipeOpen}
      rightThreshold={60}
      overshootRight={false}
      enabled={!readOnly}
    >
      <HabitCard
        habit={habit}
        currentValue={currentValue}
        isCompleted={isCompleted}
        readOnly={readOnly}
        onPress={onPress}
      />
    </Swipeable>
  );
}

const s = StyleSheet.create({
  rightAction: {
    width: 90,
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: C.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
