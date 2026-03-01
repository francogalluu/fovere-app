import React, { useLayoutEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, FlatList, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { WizardStackParamList } from '@/navigation/types';
import { useWizardStore } from '@/store/wizardStore';
import { useTheme } from '@/context/ThemeContext';
import { searchEmojis } from '@/lib/emojiPickerData';

type Props = NativeStackScreenProps<WizardStackParamList, 'HabitIcon'>;

const NUM_COLS = 6;

export default function HabitIconStep({ navigation }: Props) {
  const { colors } = useTheme();
  const icon    = useWizardStore(s => s.icon);
  const setIcon = useWizardStore(s => s.setIcon);
  const [query, setQuery] = useState('');

  const emojis = useMemo(() => searchEmojis(query), [query]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Icon',
      headerRight: () => (
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Text style={[s.doneBtn, { color: colors.teal }]}>Done</Text>
        </Pressable>
      ),
    });
  }, [navigation, colors.teal]);

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.bgSecondary }]} edges={['bottom']}>
      <Text style={[s.helper, { color: colors.text2 }]}>Choose an emoji to represent your habit.</Text>
      <TextInput
        placeholder="Search emojis (e.g. water, run, book)"
        placeholderTextColor={colors.text4}
        value={query}
        onChangeText={setQuery}
        style={[s.searchInput, { backgroundColor: colors.bgCard, color: colors.text1 }]}
      />
      <FlatList
        data={emojis}
        keyExtractor={(item) => item.emoji}
        numColumns={NUM_COLS}
        contentContainerStyle={s.grid}
        renderItem={({ item }) => {
          const selected = item.emoji === icon;
          return (
            <Pressable
              onPress={() => setIcon(item.emoji)}
              style={({ pressed }) => [
                s.cell,
                { backgroundColor: colors.bgCard },
                selected && [s.cellActive, { backgroundColor: colors.tealSoft, borderColor: colors.teal }],
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text style={s.emoji}>{item.emoji}</Text>
              {selected && (
                <View style={[s.checkBadge, { backgroundColor: colors.teal }]}>
                  <Check size={10} color={colors.white} strokeWidth={3} />
                </View>
              )}
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}

const CELL = 52;

const s = StyleSheet.create({
  safe:  { flex: 1 },
  doneBtn: { fontSize: 17, fontWeight: '600' },

  helper: {
    fontSize: 15,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  searchInput: {
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  grid: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  cell: {
    width:  CELL,
    height: CELL,
    margin: 4,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellActive: {
    borderWidth: 2,
  },
  emoji: { fontSize: 28 },
  checkBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
