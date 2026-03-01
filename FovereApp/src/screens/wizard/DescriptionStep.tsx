import React, { useLayoutEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { WizardStackParamList } from '@/navigation/types';
import { useTheme } from '@/context/ThemeContext';
import { useWizardStore } from '@/store/wizardStore';

type Props = NativeStackScreenProps<WizardStackParamList, 'Description'>;

export default function DescriptionStep({ navigation }: Props) {
  const { colors } = useTheme();
  const description = useWizardStore((s) => s.description);
  const setDescription = useWizardStore((s) => s.setDescription);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Description',
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
          <Text style={[s.helper, { color: colors.text2 }]}>
            Add an optional note about this habit. It will appear on the habit detail screen.
          </Text>

          <View style={[s.inputCard, { backgroundColor: colors.bgCard }]}>
            <TextInput
              style={[s.input, { color: colors.text1 }]}
              value={description}
              onChangeText={setDescription}
              placeholder="e.g. Run for at least 30 minutes before work"
              placeholderTextColor={colors.text4}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
            />
          </View>

          <Text style={[s.counter, { color: colors.text4 }]}>{description.length} / 500</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  doneBtn: { fontSize: 17, fontWeight: '600' },

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
    paddingVertical: 12,
  },
  input: {
    fontSize: 17,
    minHeight: 120,
    paddingVertical: 4,
  },
  counter: {
    fontSize: 13,
    textAlign: 'right',
    marginTop: 8,
    paddingRight: 4,
  },
});
