/**
 * HabitSourceStep — first screen when adding a habit.
 * Shows "+ Create a custom habit" button, search bar, and predetermined habits by category.
 * Tapping a predetermined habit pre-fills the wizard and navigates to HabitType.
 */
import React, { useLayoutEffect, useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, ChevronRight } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { WizardStackParamList } from '@/navigation/types';

import { useWizardStore } from '@/store/wizardStore';
import {
  PREDETERMINED_CATEGORIES,
  searchPredetermined,
  type PredeterminedHabit,
} from '@/lib/predeterminedHabits';
import { C, R } from '@/lib/tokens';

type Props = NativeStackScreenProps<WizardStackParamList, 'HabitSource'>;

export default function HabitSourceStep({ navigation }: Props) {
  const { reset, loadPredetermined } = useWizardStore();
  const [query, setQuery] = useState('');

  const categories = useMemo(
    () => searchPredetermined(query),
    [query],
  );

  const handleCancel = useCallback(() => {
    reset();
    navigation.getParent()?.goBack();
  }, [reset, navigation]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <Pressable onPress={handleCancel} hitSlop={12} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      ),
      headerRight: () => null,
    });
  }, [navigation, handleCancel]);

  const handleCreateCustom = useCallback(() => {
    reset();
    navigation.navigate('HabitType');
  }, [reset, navigation]);

  const handleSelectPredetermined = useCallback(
    (habit: PredeterminedHabit) => {
      loadPredetermined({
        name: habit.name,
        icon: habit.icon,
        goalType: habit.goalType,
        kind: habit.kind,
        frequency: habit.frequency,
        target: habit.target,
        unit: habit.unit,
      });
      navigation.navigate('HabitType');
    },
    [loadPredetermined, navigation],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            onPress={handleCreateCustom}
            style={({ pressed }) => [styles.createCustomBtn, pressed && styles.createCustomBtnPressed]}
          >
            <Plus size={20} color="#fff" strokeWidth={2.5} />
            <Text style={styles.createCustomText}>Create a custom habit</Text>
          </Pressable>

          <View style={styles.searchWrap}>
            <TextInput
              placeholder="Search habits"
              placeholderTextColor={C.text4}
              value={query}
              onChangeText={setQuery}
              style={styles.searchInput}
            />
          </View>

          {categories.map((cat) => (
            <View key={cat.title} style={styles.category}>
              <Text style={styles.categoryTitle}>{cat.title}</Text>
              <View style={styles.card}>
                {cat.habits.map((habit, index) => (
                  <Pressable
                    key={habit.id}
                    onPress={() => handleSelectPredetermined(habit)}
                    style={({ pressed }) => [
                      styles.habitRow,
                      index === cat.habits.length - 1 && styles.habitRowLast,
                      pressed && styles.habitRowPressed,
                    ]}
                  >
                    <Text style={styles.habitIcon}>{habit.icon}</Text>
                    <Text style={styles.habitName} numberOfLines={1}>
                      {habit.name}
                    </Text>
                    <ChevronRight size={18} color={C.chevron} />
                  </Pressable>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bgSecondary,
  },
  keyboard: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  cancelText: {
    color: C.teal,
    fontSize: 17,
  },
  createCustomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.teal,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: R.cardSm,
    marginBottom: 16,
  },
  createCustomBtnPressed: {
    opacity: 0.9,
  },
  createCustomText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  searchWrap: {
    marginBottom: 20,
  },
  searchInput: {
    backgroundColor: C.bgCard,
    borderRadius: R.cardSm,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: C.text1,
  },
  category: {
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: C.text2,
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: C.bgCard,
    borderRadius: R.cardSm,
    overflow: 'hidden',
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.separatorLight,
  },
  habitRowLast: {
    borderBottomWidth: 0,
  },
  habitRowPressed: {
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  habitIcon: {
    fontSize: 24,
    marginRight: 12,
    width: 32,
    textAlign: 'center',
  },
  habitName: {
    flex: 1,
    fontSize: 17,
    color: C.text1,
  },
});
