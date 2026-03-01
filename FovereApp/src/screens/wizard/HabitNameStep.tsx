import React, { useLayoutEffect, useRef } from 'react';
import {
  View, Text, TextInput, Pressable,
  StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { WizardStackParamList } from '@/navigation/types';
import { useTheme } from '@/context/ThemeContext';
import { useWizardStore } from '@/store/wizardStore';

type Props = NativeStackScreenProps<WizardStackParamList, 'HabitName'>;

export default function HabitNameStep({ navigation }: Props) {
  const { colors } = useTheme();
  const name    = useWizardStore(s => s.name);
  const setName = useWizardStore(s => s.setName);
  const inputRef = useRef<TextInput>(null);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Habit Name',
      headerRight: () => (
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Text style={[s.doneBtn, { color: colors.teal }]}>Done</Text>
        </Pressable>
      ),
    });
  }, [navigation, colors.teal]);

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.bgSecondary }]} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={s.container}>
          <Text style={[s.helper, { color: colors.text2 }]}>Give your habit a clear, motivating name.</Text>

          <View style={[s.inputCard, { backgroundColor: colors.bgCard }]}>
            <TextInput
              ref={inputRef}
              style={[s.input, { color: colors.text1 }]}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Morning Run"
              placeholderTextColor={colors.chevron}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={() => navigation.goBack()}
              maxLength={40}
            />
          </View>

          <Text style={[s.counter, { color: colors.chevron }]}>{name.length} / 40</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:      { flex: 1 },
  doneBtn:   { fontSize: 17, fontWeight: '600' },

  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  helper: {
    fontSize: 15,
    marginBottom: 16,
    paddingLeft: 4,
  },
  inputCard: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  input: {
    fontSize: 17,
    paddingVertical: 14,
    minHeight: 48,
  },
  counter: {
    fontSize: 13,
    textAlign: 'right',
    marginTop: 8,
    paddingRight: 4,
  },
});
