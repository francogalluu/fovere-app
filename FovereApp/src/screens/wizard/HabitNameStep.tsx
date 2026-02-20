import React, { useLayoutEffect, useRef } from 'react';
import {
  View, Text, TextInput, Pressable,
  StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { WizardStackParamList } from '@/navigation/types';
import { useWizardStore } from '@/store/wizardStore';
import { C } from '@/lib/tokens';

type Props = NativeStackScreenProps<WizardStackParamList, 'HabitName'>;

export default function HabitNameStep({ navigation }: Props) {
  const name    = useWizardStore(s => s.name);
  const setName = useWizardStore(s => s.setName);
  const inputRef = useRef<TextInput>(null);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Habit Name',
      headerRight: () => (
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Text style={s.doneBtn}>Done</Text>
        </Pressable>
      ),
    });
  }, [navigation]);

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={s.container}>
          <Text style={s.helper}>Give your habit a clear, motivating name.</Text>

          <View style={s.inputCard}>
            <TextInput
              ref={inputRef}
              style={s.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Morning Run"
              placeholderTextColor="#C7C7CC"
              autoFocus
              returnKeyType="done"
              onSubmitEditing={() => navigation.goBack()}
              maxLength={40}
            />
          </View>

          <Text style={s.counter}>{name.length} / 40</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: '#F2F2F7' },
  doneBtn:   { fontSize: 17, fontWeight: '600', color: C.teal },

  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  helper: {
    fontSize: 15,
    color: C.text2,
    marginBottom: 16,
    paddingLeft: 4,
  },
  inputCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  input: {
    fontSize: 17,
    color: '#1A1A1A',
    paddingVertical: 14,
    minHeight: 48,
  },
  counter: {
    fontSize: 13,
    color: '#C7C7CC',
    textAlign: 'right',
    marginTop: 8,
    paddingRight: 4,
  },
});
