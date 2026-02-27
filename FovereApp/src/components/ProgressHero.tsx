import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatDateTitle, isToday } from '@/lib/dates';
import { ScoreRing } from '@/components/ScoreRing';

interface ProgressHeroProps {
  selectedDate: string;  // YYYY-MM-DD
  completed: number;
  total: number;
  overLimit?: number;
}

export function ProgressHero({
  selectedDate,
  completed,
  total,
  overLimit = 0,
}: ProgressHeroProps) {
  const targetPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const title = isToday(selectedDate) ? 'Completed Today' : formatDateTitle(selectedDate);

  return (
    <View style={styles.card}>
      <View style={styles.leftContent}>
        <Text style={styles.title}>{title}</Text>
        {total > 0 ? (
          <Text style={styles.subtitle}>
            {completed} of {total} habits{'\n'}completed
          </Text>
        ) : (
          <Text style={styles.subtitle}>No habits yet.{'\n'}Add one below!</Text>
        )}
        {overLimit > 0 && (
          <Text style={styles.overLimitWarn}>
            {overLimit} break {overLimit === 1 ? 'habit' : 'habits'} over limit
          </Text>
        )}
      </View>

      <View style={styles.ringContainer}>
        <ScoreRing
          value={targetPercentage}
          size={130}
          strokeWidth={14}
          radius={50}
          animationSlot="home"
          labelStyle={styles.percentageText}
          labelStyleWhenFull={styles.percentageTextFull}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 0,
    paddingVertical: 24,
    paddingHorizontal: 24,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  leftContent: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 6,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 17,
    fontWeight: '400',
    color: '#8E8E93',
    lineHeight: 22,
  },
  ringContainer: {
    width: 130,
    height: 130,
    flexShrink: 0,
  },
  percentageText: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.8,
  },
  percentageTextFull: {
    fontSize: 22,
    letterSpacing: -0.5,
  },
  overLimitWarn: {
    fontSize: 13,
    fontWeight: '500',
    color: '#FF3B30',
    marginTop: 6,
  },
});
