/**
 * Shared bar chart with tooltip, pointer, and pan/drag behavior.
 * Used by Analytics and Calendar Weekly for identical look and interaction.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Animated as RNAnimated, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, runOnJS, type SharedValue } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { getProgressColor } from '@/lib/progressColors';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ChartBar = {
  key: string;
  label: string;
  percent: number;
  completed: number;
  target: number;
};

// ─── Constants ─────────────────────────────────────────────────────────────────

const TOOLTIP_MIN_WIDTH = 120;
const TOOLTIP_GAP_PX = 8;
const TOOLTIP_SAFE_MARGIN = 8;
const BUBBLE_CORNER_RADIUS = 10;
const ARROW_CORNER_CLEARANCE = 2;
const POINTER_BASE_HALF_WIDTH = 8;
const CHART_LEFT_PADDING = 0;
const CHART_RIGHT_PADDING = 0;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function safePercent(percent: number | null | undefined): number {
  const n = Number(percent);
  if (n !== n) return 0;
  return Math.max(0, Math.min(100, n));
}

function getBarGeometry(chartWidth: number, barCount: number) {
  const barSlotWidth = barCount > 0 ? (chartWidth - CHART_LEFT_PADDING - CHART_RIGHT_PADDING) / barCount : 0;
  const barCenterX = (index: number) => CHART_LEFT_PADDING + index * barSlotWidth + barSlotWidth / 2;
  return { barSlotWidth, barCenterX };
}

function getPointerScale(barCount: number): number {
  if (barCount <= 7) return 1.0;
  if (barCount <= 12) return 0.85;
  if (barCount <= 31) return 0.7;
  return 0.6;
}

function getBarHeightPx(percent: number, plotAreaHeightPx: number): number {
  const pct = safePercent(percent);
  const targetH = pct > 0 ? Math.max(pct, 15) : 8;
  const maxBarPx = plotAreaHeightPx - 20;
  return Math.max(0, (targetH / 100) * maxBarPx);
}

// ─── ChartTooltip ─────────────────────────────────────────────────────────────

function ChartTooltip({
  bar,
  index,
  chartWidth,
  barCount,
  chartAreaHeight,
  pointerX,
  screenWidth,
  chartScreenX,
  getTooltipDateLabel,
}: {
  bar: ChartBar;
  index: number;
  chartWidth: number;
  barCount: number;
  chartAreaHeight: number;
  pointerX: SharedValue<number>;
  screenWidth: number;
  chartScreenX: number;
  getTooltipDateLabel: (bar: ChartBar, index: number) => string;
}) {
  const [tooltipSize, setTooltipSize] = useState({ width: TOOLTIP_MIN_WIDTH, height: 56 });

  const pointerScale = getPointerScale(barCount);
  const arrowHalfWidth = POINTER_BASE_HALF_WIDTH * pointerScale;
  const arrowHeight = 6 * pointerScale;
  const width = Math.max(TOOLTIP_MIN_WIDTH, tooltipSize.width);

  const barHeightPx = getBarHeightPx(bar.percent, chartAreaHeight);
  const barTopYPx = chartAreaHeight - barHeightPx;
  const tooltipTopPx = barTopYPx - tooltipSize.height - TOOLTIP_GAP_PX - arrowHeight;

  const safeMargin = TOOLTIP_SAFE_MARGIN;
  const R = BUBBLE_CORNER_RADIUS;
  const minLeft = Math.max(0, safeMargin - chartScreenX);
  const maxLeft = screenWidth - safeMargin - width - chartScreenX;
  const minArrowCenter = R + arrowHalfWidth + ARROW_CORNER_CLEARANCE;
  const maxArrowCenter = width - R - arrowHalfWidth - ARROW_CORNER_CLEARANCE;

  const tooltipWrapperStyle = useAnimatedStyle(() => {
    const anchorX = pointerX.value;
    const left = Math.max(minLeft, Math.min(maxLeft, anchorX - width / 2));
    return { left };
  });
  const arrowStyle = useAnimatedStyle(() => {
    const anchorX = pointerX.value;
    const wrapperLeft = Math.max(minLeft, Math.min(maxLeft, anchorX - width / 2));
    const rawArrowCenter = anchorX - wrapperLeft;
    const arrowCenter = Math.max(minArrowCenter, Math.min(maxArrowCenter, rawArrowCenter));
    return { left: arrowCenter - arrowHalfWidth };
  });

  const dateLabel = getTooltipDateLabel(bar, index);
  const tooltipHeight = tooltipSize.height + arrowHeight;

  return (
    <Animated.View
      style={[
        styles.chartTooltipWrap,
        {
          position: 'absolute',
          top: tooltipTopPx,
          width,
          height: tooltipHeight,
          zIndex: 20,
        },
        tooltipWrapperStyle,
      ]}
      pointerEvents="none"
    >
      <View
        style={[styles.chartTooltip, { width }]}
        onLayout={e => {
          const { width: w, height: h } = e.nativeEvent.layout;
          setTooltipSize(prev => (prev.width === w && prev.height === h ? prev : { width: w, height: h }));
        }}
      >
        <Text style={styles.chartTooltipDate}>{dateLabel}</Text>
        <Text style={styles.chartTooltipPct}>{Math.round(safePercent(bar.percent))}%</Text>
        {bar.target > 0 && (
          <Text style={styles.chartTooltipDetail}>{bar.completed} of {bar.target}</Text>
        )}
      </View>
      <Animated.View
        style={[
          styles.chartTooltipPointer,
          {
            position: 'absolute',
            top: tooltipSize.height - 1,
            width: 0,
            height: 0,
            borderLeftWidth: arrowHalfWidth,
            borderRightWidth: arrowHalfWidth,
            borderTopWidth: arrowHeight,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderTopColor: '#1A1A1A',
          },
          arrowStyle,
        ]}
      />
    </Animated.View>
  );
}

// ─── BarWithTooltip ───────────────────────────────────────────────────────────

function BarWithTooltip({
  bar,
  index,
  chartAreaHeight = 220,
  axisLabel,
  isHighlighted,
  isToday,
  onPressIn,
  onPressOut,
}: {
  bar: ChartBar;
  index: number;
  chartAreaHeight?: number;
  axisLabel: string | null;
  isHighlighted: boolean;
  isToday: boolean;
  onPressIn: () => void;
  onPressOut: () => void;
}) {
  const MAX_BAR_PX = chartAreaHeight - 20;
  const animHeight = useRef(new RNAnimated.Value(0)).current;
  const pct = safePercent(bar.percent);
  const targetH = pct > 0 ? Math.max(pct, 15) : 8;
  const targetPx = Math.max(0, (targetH / 100) * MAX_BAR_PX);

  useEffect(() => {
    RNAnimated.timing(animHeight, {
      toValue: targetPx,
      duration: 280,
      useNativeDriver: false,
    }).start();
  }, [targetPx]);

  const color = getProgressColor(Math.round(pct));
  return (
    <Pressable
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={[styles.barCol, isHighlighted && styles.barColHighlighted]}
    >
      <View style={[styles.barWrapper, { height: chartAreaHeight }]}>
        <View style={styles.barGroup}>
          <View style={styles.barSpacer} />
          <RNAnimated.View
            style={[
              styles.bar,
              {
                height: animHeight,
                backgroundColor: color,
                borderTopLeftRadius: 3,
                borderTopRightRadius: 3,
                borderBottomLeftRadius: pct > 0 ? 2 : 3,
                borderBottomRightRadius: pct > 0 ? 2 : 3,
              },
            ]}
          />
        </View>
      </View>
      {axisLabel !== null ? (
        <Text style={[styles.barLabel, isToday && styles.barLabelToday]} numberOfLines={1}>
          {axisLabel}
        </Text>
      ) : (
        <View style={styles.barLabelPlaceholder} />
      )}
    </Pressable>
  );
}

// ─── BarChartWithTooltip ───────────────────────────────────────────────────────

export interface BarChartWithTooltipProps {
  bars: ChartBar[];
  chartAreaHeight?: number;
  getTooltipDateLabel: (bar: ChartBar, index: number) => string;
  todayIndex?: number | null;
  emptyMessage?: string;
  renderTopContent?: (layout: { width: number; height: number }) => React.ReactNode;
  barChartRowMonth?: boolean;
  /** Which bars show an x-axis label. If omitted, all bars show their label. */
  xAxisTickIndices?: Set<number>;
  /** Custom label for each bar (x-axis). If omitted, bar.label is used. */
  getAxisLabel?: (bar: ChartBar, index: number) => string;
}

export function BarChartWithTooltip({
  bars,
  chartAreaHeight = 220,
  getTooltipDateLabel,
  todayIndex = null,
  emptyMessage = 'No data for this period',
  renderTopContent,
  barChartRowMonth = false,
  xAxisTickIndices: xAxisTickIndicesProp,
  getAxisLabel,
}: BarChartWithTooltipProps) {
  const [pressedBarIndex, setPressedBarIndex] = useState<number | null>(null);
  const [chartLayout, setChartLayout] = useState({ width: 0, height: 0 });
  const [chartScreenX, setChartScreenX] = useState(0);
  const chartContainerRef = useRef<View>(null);

  const chartPointerX = useSharedValue(0);
  const sharedChartScreenX = useSharedValue(0);
  const sharedChartWidth = useSharedValue(0);
  const sharedBarSlotWidth = useSharedValue(0);
  const sharedBarCount = useSharedValue(0);
  const sharedLastReportedIndex = useSharedValue(-1);

  const barGeometry = React.useMemo(
    () => getBarGeometry(chartLayout.width, bars.length),
    [chartLayout.width, bars.length],
  );

  const snapChartPointerToBar = useCallback(
    (index: number) => {
      setPressedBarIndex(index);
      if (bars.length > 0) chartPointerX.value = barGeometry.barCenterX(index);
    },
    [bars.length, barGeometry],
  );

  useEffect(() => {
    sharedChartScreenX.value = chartScreenX;
    sharedChartWidth.value = chartLayout.width;
    sharedBarSlotWidth.value = barGeometry.barSlotWidth;
    sharedBarCount.value = bars.length;
  }, [chartScreenX, chartLayout.width, barGeometry.barSlotWidth, bars.length]);

  useEffect(() => {
    if (pressedBarIndex !== null && bars.length > 0) {
      chartPointerX.value = barGeometry.barCenterX(pressedBarIndex);
    }
  }, [pressedBarIndex, bars.length, barGeometry]);

  const hasChartData = bars.some(b => b.target > 0);
  const xAxisTickIndices = React.useMemo(
    () => xAxisTickIndicesProp ?? new Set(bars.map((_, i) => i)),
    [xAxisTickIndicesProp, bars.length],
  );
  const getBarAxisLabel = React.useCallback(
    (bar: ChartBar, index: number) => (getAxisLabel ? getAxisLabel(bar, index) : bar.label),
    [getAxisLabel],
  );

  if (bars.length === 0) {
    return (
      <View style={styles.barEmpty}>
        <Text style={styles.barEmptyText}>{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <View
      ref={chartContainerRef}
      style={styles.barChartContainer}
      onLayout={e => {
        const layout = e.nativeEvent.layout;
        setChartLayout(layout);
        chartContainerRef.current?.measureInWindow((x: number) => setChartScreenX(x));
      }}
    >
      {renderTopContent && chartLayout.width > 0 && renderTopContent(chartLayout)}
      {pressedBarIndex !== null && bars[pressedBarIndex] && chartLayout.width > 0 && (
        <ChartTooltip
          bar={bars[pressedBarIndex]}
          index={pressedBarIndex}
          chartWidth={chartLayout.width}
          barCount={bars.length}
          chartAreaHeight={chartAreaHeight}
          pointerX={chartPointerX}
          screenWidth={Dimensions.get('window').width}
          chartScreenX={chartScreenX}
          getTooltipDateLabel={getTooltipDateLabel}
        />
      )}
      <GestureDetector
        gesture={Gesture.Pan()
          .enabled(hasChartData && bars.length > 0)
          .minDistance(8)
          .onStart(ev => {
            'worklet';
            const x = ev.absoluteX - sharedChartScreenX.value;
            const barSlotWidth = sharedBarSlotWidth.value;
            const barCount = sharedBarCount.value;
            if (barSlotWidth <= 0 || barCount <= 0) return;
            const idx = Math.round((x - CHART_LEFT_PADDING) / barSlotWidth);
            const clamped = Math.max(0, Math.min(barCount - 1, idx));
            chartPointerX.value = CHART_LEFT_PADDING + clamped * barSlotWidth + barSlotWidth / 2;
            sharedLastReportedIndex.value = clamped;
            runOnJS(setPressedBarIndex)(clamped);
          })
          .onUpdate(ev => {
            'worklet';
            const x = ev.absoluteX - sharedChartScreenX.value;
            const barSlotWidth = sharedBarSlotWidth.value;
            const barCount = sharedBarCount.value;
            if (barSlotWidth <= 0 || barCount <= 0) return;
            const idx = Math.round((x - CHART_LEFT_PADDING) / barSlotWidth);
            const clamped = Math.max(0, Math.min(barCount - 1, idx));
            if (clamped !== sharedLastReportedIndex.value) {
              sharedLastReportedIndex.value = clamped;
              chartPointerX.value = CHART_LEFT_PADDING + clamped * barSlotWidth + barSlotWidth / 2;
              runOnJS(setPressedBarIndex)(clamped);
            }
          })
          .onEnd(ev => {
            'worklet';
            const x = ev.absoluteX - sharedChartScreenX.value;
            const barSlotWidth = sharedBarSlotWidth.value;
            const barCount = sharedBarCount.value;
            if (barSlotWidth <= 0 || barCount <= 0) return;
            const idx = Math.round((x - CHART_LEFT_PADDING) / barSlotWidth);
            const clamped = Math.max(0, Math.min(barCount - 1, idx));
            runOnJS(snapChartPointerToBar)(clamped);
          })}
      >
        <View style={[styles.barChartRow, barChartRowMonth && styles.barChartRowMonth]}>
          {bars.map((bar, i) => (
            <BarWithTooltip
              key={bar.key}
              bar={bar}
              index={i}
              chartAreaHeight={chartAreaHeight}
              axisLabel={xAxisTickIndices.has(i) ? getBarAxisLabel(bar, i) : null}
              isHighlighted={pressedBarIndex === i}
              isToday={todayIndex !== null && todayIndex !== undefined && i === todayIndex}
              onPressIn={() => setPressedBarIndex(i)}
              onPressOut={() => setPressedBarIndex(null)}
            />
          ))}
        </View>
      </GestureDetector>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  barChartContainer: { position: 'relative', width: '100%', overflow: 'visible' },
  barChartRow: { flexDirection: 'row', alignItems: 'flex-end', minHeight: 240, width: '100%' },
  barChartRowMonth: { minHeight: 260 },
  barCol: { flex: 1, alignItems: 'center', marginHorizontal: 2 },
  barColHighlighted: { backgroundColor: 'rgba(0,0,0,0.04)', borderRadius: 8 },
  barWrapper: { width: '100%', justifyContent: 'flex-end', alignItems: 'center' },
  barGroup: { width: '100%', height: '100%', justifyContent: 'flex-end', alignItems: 'center' },
  barSpacer: { flex: 1, minHeight: 4 },
  bar: { width: '75%', maxWidth: 48, borderTopLeftRadius: 8, borderTopRightRadius: 8 },
  barLabel: { fontSize: 11, color: '#8E8E93', fontWeight: '500', marginTop: 6 },
  barLabelPlaceholder: { height: 18, marginTop: 6 },
  barLabelToday: { color: '#34C759' },
  barEmpty: { minHeight: 200, justifyContent: 'center', alignItems: 'center' },
  barEmptyText: { fontSize: 15, color: '#8E8E93' },
  chartTooltipWrap: {
    position: 'absolute',
    minWidth: TOOLTIP_MIN_WIDTH,
    zIndex: 20,
    alignItems: 'stretch',
  },
  chartTooltip: {
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    minWidth: TOOLTIP_MIN_WIDTH,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  chartTooltipDate: { fontSize: 12, color: 'rgba(255,255,255,0.9)', marginBottom: 2 },
  chartTooltipPct: { fontSize: 22, fontWeight: '700', color: '#fff', letterSpacing: -0.5 },
  chartTooltipDetail: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  chartTooltipPointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#1A1A1A',
  },
});
