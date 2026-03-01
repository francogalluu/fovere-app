import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Check, AlertTriangle } from 'lucide-react-native';
import { formatDateTitle } from '@/lib/dates';
import { ScoreRing } from '@/components/ScoreRing';
import { PROGRESS_COLORS } from '@/lib/progressColors';
import { C } from '@/lib/tokens';
import type { Habit } from '@/types/habit';

export interface DaySummaryHabit {
  habit: Habit;
  currentValue: number;
  isCompleted: boolean;
  isOverLimit?: boolean;
}

export interface DaySummarySection {
  title: string;
  habits: DaySummaryHabit[];
}

interface DaySummaryModalProps {
  visible: boolean;
  onClose: () => void;
  date: string;
  completed: number;
  total: number;
  overLimit?: number;
  sections: DaySummarySection[];
}

export function DaySummaryModal({
  visible,
  onClose,
  date,
  completed,
  total,
  overLimit = 0,
  sections,
}: DaySummaryModalProps) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const hasAnyHabits = sections.some((sec) => sec.habits.length > 0);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        <View style={s.header}>
          <Text style={s.title}>{formatDateTitle(date)}</Text>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [s.closeBtn, pressed && s.closeBtnPressed]}
            accessibilityLabel="Close"
          >
            <X size={24} color={C.text1} strokeWidth={2} />
          </Pressable>
        </View>

        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={s.hero}>
            <View style={s.heroLeft}>
              <Text style={s.heroLabel}>Completion</Text>
              {total > 0 ? (
                <Text style={s.heroSub}>
                  {completed} of {total} habits completed
                </Text>
              ) : (
                <Text style={s.heroSub}>No habits for this day</Text>
              )}
              {overLimit > 0 && (
                <Text style={s.overLimit}>
                  {overLimit} break {overLimit === 1 ? 'habit' : 'habits'} over limit
                </Text>
              )}
            </View>
            <View style={s.ringWrap}>
              <ScoreRing
                value={pct}
                size={100}
                strokeWidth={10}
                radius={40}
                labelStyle={s.ringLabel}
                labelStyleWhenFull={s.ringLabelFull}
              />
            </View>
          </View>

          {hasAnyHabits ? (
            <View style={s.listSection}>
              {sections.map(
                (section) =>
                  section.habits.length > 0 && (
                    <View key={section.title} style={s.categoryBlock}>
                      <Text style={s.sectionTitle}>{section.title}</Text>
                      <View style={s.list}>
                        {section.habits.map(({ habit, currentValue, isCompleted, isOverLimit: over }, index) => (
                          <View
                            key={habit.id}
                            style={[s.row, index === section.habits.length - 1 && s.rowLast]}
                          >
                            <View style={[s.iconWrap, isCompleted && !over && s.iconWrapDone]}>
                              <Text style={s.icon}>{habit.icon}</Text>
                            </View>
                            <View style={s.rowCenter}>
                              <Text style={s.habitName} numberOfLines={1}>
                                {habit.name}
                              </Text>
                              {habit.kind === 'numeric' && (
                                <Text style={[s.rowMeta, over && s.rowMetaDanger]}>
                                  {currentValue} / {habit.target}
                                  {habit.unit ? ` ${habit.unit}` : ''}
                                  {over ? ' · Over limit' : ''}
                                </Text>
                              )}
                            </View>
                            <View style={s.statusWrap}>
                              {isCompleted && !over ? (
                                <Check size={20} color={PROGRESS_COLORS.HIGH} strokeWidth={2.5} />
                              ) : over ? (
                                <AlertTriangle size={20} color={PROGRESS_COLORS.LOW} strokeWidth={2} />
                              ) : habit.kind === 'boolean' ? (
                                <View style={s.dot} />
                              ) : (
                                <Text style={s.pct}>{Math.min(100, Math.round((currentValue / habit.target) * 100))}%</Text>
                              )}
                            </View>
                          </View>
                        ))}
                      </View>
                    </View>
                  ),
              )}
            </View>
          ) : (
            <View style={s.empty}>
              <Text style={s.emptyText}>No habits for this day</Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bgSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.separatorLight,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: C.text1,
  },
  closeBtn: {
    padding: 8,
    marginRight: -8,
  },
  closeBtnPressed: {
    opacity: 0.6,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 24,
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  heroLeft: {
    flex: 1,
    paddingRight: 16,
  },
  heroLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: C.text2,
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  heroSub: {
    fontSize: 17,
    fontWeight: '500',
    color: C.text1,
  },
  overLimit: {
    fontSize: 13,
    fontWeight: '500',
    color: PROGRESS_COLORS.LOW,
    marginTop: 6,
  },
  ringWrap: {
    width: 100,
    height: 100,
  },
  ringLabel: {
    fontSize: 18,
    fontWeight: '700',
  },
  ringLabelFull: {
    fontSize: 15,
    fontWeight: '700',
  },
  listSection: {
    marginTop: 24,
    marginHorizontal: 20,
  },
  categoryBlock: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: C.text2,
    letterSpacing: 0.3,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  list: {
    borderRadius: 16,
    backgroundColor: '#fff',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.separatorLight,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconWrapDone: {
    backgroundColor: 'rgba(52, 199, 89, 0.12)',
  },
  icon: {
    fontSize: 20,
  },
  rowCenter: {
    flex: 1,
    minWidth: 0,
  },
  habitName: {
    fontSize: 16,
    fontWeight: '600',
    color: C.text1,
  },
  rowMeta: {
    fontSize: 13,
    color: C.text2,
    marginTop: 2,
  },
  rowMetaDanger: {
    color: PROGRESS_COLORS.LOW,
  },
  statusWrap: {
    width: 44,
    alignItems: 'flex-end',
  },
  pct: {
    fontSize: 13,
    fontWeight: '600',
    color: C.text2,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: C.separatorLight,
  },
  empty: {
    marginTop: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: C.text2,
  },
});
