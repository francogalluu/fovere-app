import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { getProgressColor } from '@/lib/progressColors';
import { formatDateTitle, isToday } from '@/lib/dates';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const RADIUS = 50;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const ANIM_DURATION_MS = 550;
const ANIM_EASING = Easing.out(Easing.ease);

interface ProgressHeroProps {
  selectedDate: string;  // YYYY-MM-DD
  completed: number;
  total: number;
  overLimit?: number;
  /** When true, animate ring and % from 0 to current value once. When false, show final value immediately. */
  animateFromZero?: boolean;
}

export function ProgressHero({
  selectedDate,
  completed,
  total,
  overLimit = 0,
  animateFromZero = false,
}: ProgressHeroProps) {
  const targetPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const progressColor = getProgressColor(targetPercentage);
  const title = isToday(selectedDate) ? 'Completed Today' : formatDateTitle(selectedDate);

  const animValue = useRef(new Animated.Value(0)).current;
  const [displayPercent, setDisplayPercent] = useState(animateFromZero ? 0 : targetPercentage);
  const hasAnimatedThisMount = useRef(false);

  // Sync ring and label to target when not in “first mount animation” phase
  useEffect(() => {
    if (!animateFromZero || hasAnimatedThisMount.current) {
      animValue.setValue(targetPercentage);
      setDisplayPercent(targetPercentage);
    }
  }, [animateFromZero, targetPercentage, animValue]);

  // One-time animation on mount when animateFromZero is true
  useEffect(() => {
    if (!animateFromZero || hasAnimatedThisMount.current) return;
    hasAnimatedThisMount.current = true;
    animValue.setValue(0);
    setDisplayPercent(0);

    const listenerId = animValue.addListener(({ value }) => {
      setDisplayPercent(Math.round(value));
    });

    const toValue = targetPercentage;
    Animated.timing(animValue, {
      toValue,
      duration: ANIM_DURATION_MS,
      easing: ANIM_EASING,
      useNativeDriver: false,
    }).start(() => {
      animValue.removeListener(listenerId);
      setDisplayPercent(toValue);
    });

    return () => {
      animValue.removeAllListeners();
    };
  }, [animateFromZero, targetPercentage]); // targetPercentage read at start; ref prevents re-run when date changes

  const strokeDashoffset = animValue.interpolate({
    inputRange: [0, 100],
    outputRange: [CIRCUMFERENCE, 0],
  });

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
        <Svg
          width={130}
          height={130}
          viewBox="0 0 130 130"
          style={{ transform: [{ rotate: '-90deg' }] }}
        >
          <Circle
            cx={65}
            cy={65}
            r={RADIUS}
            fill="none"
            stroke="#E5E5E7"
            strokeWidth={14}
          />
          <AnimatedCircle
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

        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <View style={styles.percentageCenter}>
            <Text style={[styles.percentageText, { color: displayPercent > 0 ? '#000000' : '#8E8E93' }]}>
              {displayPercent}%
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
  overLimitWarn: {
    fontSize: 13,
    fontWeight: '500',
    color: '#FF3B30',
    marginTop: 6,
  },
});
