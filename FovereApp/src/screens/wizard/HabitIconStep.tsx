import React, { useLayoutEffect } from 'react';
import { View, Text, Pressable, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { WizardStackParamList } from '@/navigation/types';
import { useWizardStore } from '@/store/wizardStore';
import { C } from '@/lib/tokens';

type Props = NativeStackScreenProps<WizardStackParamList, 'HabitIcon'>;

const EMOJIS = [
  '⭐', '🏃', '💧', '📚', '🧘', '🏋️', '🚴', '🍎',
  '😴', '💊', '🎵', '✍️', '🌟', '❤️', '🎯', '🏆',
  '🍵', '🥗', '🚶', '🧹', '💻', '📝', '🎸', '🌱',
  '🧪', '🦷', '🏊', '🤸', '🧠', '💪', '🎓', '🌅',
  '🥤', '🥦', '🍳', '🏌️', '🎾', '⚽', '🏀', '📱',
  '🧶', '🖌️', '🎨', '🧩', '♟️', '🎲', '📸', '✈️',
];

const NUM_COLS = 6;

export default function HabitIconStep({ navigation }: Props) {
  const icon    = useWizardStore(s => s.icon);
  const setIcon = useWizardStore(s => s.setIcon);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Icon',
      headerRight: () => (
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Text style={s.doneBtn}>Done</Text>
        </Pressable>
      ),
    });
  }, [navigation]);

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <Text style={s.helper}>Choose an emoji to represent your habit.</Text>
      <FlatList
        data={EMOJIS}
        keyExtractor={(e) => e}
        numColumns={NUM_COLS}
        contentContainerStyle={s.grid}
        renderItem={({ item }) => {
          const selected = item === icon;
          return (
            <Pressable
              onPress={() => setIcon(item)}
              style={({ pressed }) => [
                s.cell,
                selected && s.cellActive,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text style={s.emoji}>{item}</Text>
              {selected && (
                <View style={s.checkBadge}>
                  <Check size={10} color="#fff" strokeWidth={3} />
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
  safe:  { flex: 1, backgroundColor: '#F2F2F7' },
  doneBtn: { fontSize: 17, fontWeight: '600', color: C.teal },

  helper: {
    fontSize: 15,
    color: C.text2,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
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
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellActive: {
    backgroundColor: C.tealSoft,
    borderWidth: 2,
    borderColor: C.teal,
  },
  emoji: { fontSize: 28 },
  checkBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: C.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
