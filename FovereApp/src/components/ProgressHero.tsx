import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { getProgressColor } from '@/lib/progressColors';
import { formatDateTitle, isToday } from '@/lib/dates';


interface ProgressHeroProps {
  selectedDate: string;  // YYYY-MM-DD
  completed: number;
  total: number;
}

const RADIUS = 50;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function ProgressHero({ selectedDate, completed, total }: ProgressHeroProps) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const strokeDashoffset = CIRCUMFERENCE * (1 - percentage / 100);
  const progressColor = getProgressColor(percentage);
  const title = isToday(selectedDate) ? 'Completed Today' : formatDateTitle(selectedDate);

  return (
    /*
     * Glassmorphism (backdrop-filter blur) is not available in React Native
     * without @react-native-community/blur. Using solid white + shadow as an
     * equivalent visual anchor. TODO M-post: swap to BlurView on iOS.
     */
    <View style={styles.card}>
      {/* Left: text content */}
      <View style={styles.leftContent}>
        <Text style={styles.title}>{title}</Text>
        {total > 0 ? (
          <Text style={styles.subtitle}>
            {completed} of {total} habits{'\n'}completed
          </Text>
        ) : (
          <Text style={styles.subtitle}>No habits yet.{'\n'}Add one below!</Text>
        )}
      </View>

      {/* Right: circular progress ring */}
      <View style={styles.ringContainer}>
        <Svg
          width={130}
          height={130}
          viewBox="0 0 130 130"
          style={{ transform: [{ rotate: '-90deg' }] }}
        >
          {/* Track */}
          <Circle
            cx={65}
            cy={65}
            r={RADIUS}
            fill="none"
            stroke="#E5E5E7"
            strokeWidth={14}
          />
          {/* Progress arc */}
          <Circle
            cx={65}
            cy={65}
            r={RADIUS}
            fill="none"
            stroke={progressColor}
            strokeWidth={14}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </Svg>

        {/* % label centered */}
        <View style={StyleSheet.absoluteFillObject}>
          <View style={styles.percentageCenter}>
            <Text style={[styles.percentageText, { color: percentage > 0 ? '#000000' : '#8E8E93' }]}>
              {percentage}%
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    paddingVertical: 24,
    paddingHorizontal: 24,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // Shadow (replaces glassmorphism backdrop — iOS only)
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
  percentageCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentageText: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.8,
  },
});
