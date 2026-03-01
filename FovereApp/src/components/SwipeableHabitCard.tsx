import React, { useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Trash2 } from 'lucide-react-native';
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
  /** Called when user confirms delete after swiping right and tapping Delete */
  onDelete?: () => void;
  /** Called when user chooses "Pause" instead of delete — caller should archive the habit */
  onPause?: () => void;
  /** Compact layout (smaller card for home compact view) */
  compact?: boolean;
}

function RightActions({ isCompleted }: { isCompleted: boolean }) {
  return (
    <View style={[s.rightAction, isCompleted && s.rightActionUndo]}>
      <Text style={s.actionText}>{isCompleted ? 'Undo' : 'Done'}</Text>
    </View>
  );
}

function LeftActions({ onDelete }: { onDelete: () => void }) {
  return (
    <View style={s.leftAction}>
      <Pressable
        onPress={onDelete}
        style={({ pressed }) => [s.deleteBtn, pressed && { opacity: 0.8 }]}
        accessibilityRole="button"
        accessibilityLabel="Delete habit"
      >
        <Trash2 size={22} color="#fff" strokeWidth={2} />
        <Text style={s.actionText}>Delete</Text>
      </Pressable>
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
  onDelete,
  onPause,
  compact = false,
}: SwipeableHabitCardProps) {
  const swipeRef = useRef<Swipeable>(null);
  const pendingActionRef = useRef<'complete' | 'undo' | null>(null);

  const handleRightOpen = () => {
    pendingActionRef.current = isCompleted ? 'undo' : 'complete';
    swipeRef.current?.close();
  };

  const handleSwipeClose = () => {
    if (!pendingActionRef.current) return;
    pendingActionRef.current = null;
    onComplete();
  };

  const showDeleteAlert = () => {
    swipeRef.current?.close();
    const buttons: Array<{ text: string; style?: 'cancel' | 'destructive' | 'default'; onPress?: () => void }> = [
      { text: 'Cancel', style: 'cancel' },
    ];
    if (onPause) {
      buttons.push({ text: 'Pause', onPress: () => onPause() });
    }
    // "Delete" is a soft-delete: hide from Home from today onward, keep history.
    buttons.push({ text: 'Delete', style: 'destructive', onPress: () => onDelete?.() });
    Alert.alert(
      'Delete habit',
      `Are you sure you want to delete "${habit.name}"? It will be removed from your Home screen from today onward, but its past history will stay in Calendar and Analytics.${onPause ? ' You can also pause it to hide it and resume later.' : ''}`,
      buttons
    );
  };

  const handleLeftOpen = () => {
    showDeleteAlert();
  };

  return (
    <Swipeable
      ref={swipeRef}
      renderRightActions={() => <RightActions isCompleted={isCompleted} />}
      renderLeftActions={onDelete ? () => <LeftActions onDelete={showDeleteAlert} /> : undefined}
      onSwipeableLeftOpen={onDelete ? handleLeftOpen : undefined}
      onSwipeableRightOpen={handleRightOpen}
      onSwipeableClose={handleSwipeClose}
      rightThreshold={42}
      leftThreshold={40}
      overshootRight={false}
      overshootLeft={false}
      enabled={!readOnly}
      containerStyle={s.swipeContainer}
      childrenContainerStyle={[s.swipeChildren, compact && s.swipeChildrenCompact]}
    >
      <HabitCard
        habit={habit}
        currentValue={currentValue}
        isCompleted={isCompleted}
        readOnly={readOnly}
        onPress={onPress}
        compact={compact}
      />
    </Swipeable>
  );
}

const s = StyleSheet.create({
  swipeContainer: {
    overflow: 'visible',
  },
  swipeChildren: {
    overflow: 'visible',
  },
  swipeChildrenCompact: {
    marginBottom: 4,
  },
  rightAction: {
    width: 90,
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: C.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  rightActionUndo: {
    backgroundColor: C.danger,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  leftAction: {
    width: 90,
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: C.danger,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  deleteBtn: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
});
