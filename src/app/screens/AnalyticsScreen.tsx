import { ChevronDown, Flame, CalendarCheck } from 'lucide-react';
import { useState } from 'react';
import { BottomNav } from '../components/BottomNav';
import { getProgressColor } from '../utils/progressColors';

// Mock data
const habits = [
  { id: 'all', name: 'All habits', icon: null },
  { id: 'read', name: 'Reading', icon: '📚' },
  { id: 'workout', name: 'Workout', icon: '💪' },
  { id: 'meditation', name: 'Meditation', icon: '🧘' },
  { id: 'water', name: 'Water', icon: '💧' },
];

// Mock weekly bar data for all habits
const weeklyData = [
  { day: 'Mon', value: 3, max: 5 },
  { day: 'Tue', value: 2, max: 5 },
  { day: 'Wed', value: 4, max: 5 },
  { day: 'Thu', value: 5, max: 5 },
  { day: 'Fri', value: 3, max: 5 },
  { day: 'Sat', value: 2, max: 5 },
  { day: 'Sun', value: 0, max: 5 },
];

// Mock weekly bar data for Reading habit (pages read)
const readingWeeklyData = [
  { day: 'Mon', value: 45, max: 60 },
  { day: 'Tue', value: 32, max: 60 },
  { day: 'Wed', value: 60, max: 60 },
  { day: 'Thu', value: 50, max: 60 },
  { day: 'Fri', value: 38, max: 60 },
  { day: 'Sat', value: 55, max: 60 },
  { day: 'Sun', value: 40, max: 60 },
];

// Calculate total completed
const totalCompleted = weeklyData.reduce((sum, d) => sum + d.value, 0);
const totalPagesRead = readingWeeklyData.reduce((sum, d) => sum + d.value, 0);

export default function AnalyticsScreen() {
  const [selectedHabit, setSelectedHabit] = useState('all');
  const [timePeriod, setTimePeriod] = useState<'week' | 'month' | '30days' | 'all'>('week');

  const selectedHabitData = habits.find(h => h.id === selectedHabit);

  // Get time period label
  const getTimePeriodLabel = () => {
    switch (timePeriod) {
      case 'week': return 'This week';
      case 'month': return 'This month';
      case '30days': return 'Last 30 days';
      case 'all': return 'All time';
    }
  };

  // Get completion card title based on time period
  const getCompletionTitle = () => {
    if (selectedHabit === 'read') return 'Reading completion';
    
    switch (timePeriod) {
      case 'week': return 'Weekly completion';
      case 'month': return 'Monthly completion';
      case '30days': return 'Last 30 days';
      case 'all': return 'Overall completion';
    }
  };

  // Mock completion percentages based on time period
  const getCompletionPercentage = () => {
    if (selectedHabit === 'read') return 85;
    
    switch (timePeriod) {
      case 'week': return 85;
      case 'month': return 78;
      case '30days': return 81;
      case 'all': return 73;
    }
  };

  const getCompletionText = () => {
    if (selectedHabit === 'read') return '17 of 20 sessions';
    
    switch (timePeriod) {
      case 'week': return '19 of 22 habits';
      case 'month': return '82 of 105 habits';
      case '30days': return '95 of 117 habits';
      case 'all': return '450 of 615 habits';
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{ 
        backgroundColor: '#F9F9F9',
        maxWidth: '430px',
        margin: '0 auto',
        position: 'relative'
      }}
    >
      {/* Status Bar */}
      <div 
        className="flex items-center justify-between px-6 pt-3 pb-2"
        style={{ paddingTop: 'max(12px, env(safe-area-inset-top))', backgroundColor: '#F9F9F9' }}
      >
        <div style={{ fontSize: '15px', fontWeight: 600 }}>9:41</div>
        <div className="flex items-center gap-1">
          <svg width="17" height="12" viewBox="0 0 17 12" fill="none">
            <rect width="15" height="12" rx="2.5" fill="#1A1A1A"/>
            <rect x="15.5" y="4" width="1.5" height="4" rx="0.75" fill="#1A1A1A"/>
          </svg>
        </div>
      </div>

      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <h1 
          style={{ 
            fontSize: '34px',
            fontWeight: 700,
            color: '#1A1A1A',
            letterSpacing: '-0.02em',
            marginBottom: '20px'
          }}
        >
          Analytics
        </h1>

        {/* Habit Pills - Horizontal Scrollable */}
        <div 
          className="flex gap-2 overflow-x-auto pb-2"
          style={{ 
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          {habits.map((habit) => (
            <button
              key={habit.id}
              onClick={() => setSelectedHabit(habit.id)}
              className="px-4 py-2.5 rounded-full whitespace-nowrap transition-all flex items-center gap-2"
              style={{
                backgroundColor: selectedHabit === habit.id ? 'rgba(0, 128, 128, 0.12)' : '#EFEFEF',
                color: selectedHabit === habit.id ? '#008080' : '#8E8E93',
                fontSize: '15px',
                fontWeight: selectedHabit === habit.id ? 600 : 500,
                border: 'none',
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
              {habit.icon && <span>{habit.icon}</span>}
              <span>{habit.name}</span>
            </button>
          ))}
        </div>

        {/* Time Period Pills */}
        <div 
          className="flex gap-2 overflow-x-auto pb-2 mt-2"
          style={{ 
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          {[
            { id: 'week', label: 'This week' },
            { id: 'month', label: 'This month' },
            { id: '30days', label: 'Last 30 days' },
            { id: 'all', label: 'All time' }
          ].map((period) => (
            <button
              key={period.id}
              onClick={() => setTimePeriod(period.id as any)}
              className="px-4 py-2.5 rounded-full whitespace-nowrap transition-all"
              style={{
                backgroundColor: timePeriod === period.id ? 'rgba(0, 128, 128, 0.12)' : '#EFEFEF',
                color: timePeriod === period.id ? '#008080' : '#8E8E93',
                fontSize: '15px',
                fontWeight: timePeriod === period.id ? 600 : 500,
                border: 'none',
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pb-32">
        {/* Hero Metric - Horizontal Progress Card */}
        <div className="mb-8">
          <div 
            className="rounded-3xl py-6 px-6"
            style={{ 
              background: 'rgba(255, 255, 255, 0.6)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255, 255, 255, 0.5)',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.08)',
            }}
          >
            <div className="flex items-center justify-between">
              
              {/* Left Side: Text Content */}
              <div className="flex flex-col">
                <div 
                  style={{ 
                    fontSize: '22px',
                    color: '#000000',
                    fontWeight: 700,
                    marginBottom: '6px',
                    letterSpacing: '-0.02em'
                  }}
                >
                  {getCompletionTitle()}
                </div>
                <div 
                  style={{ 
                    fontSize: '17px',
                    color: '#8E8E93',
                    fontWeight: 400,
                    lineHeight: '22px'
                  }}
                >
                  {getCompletionText()}<br />completed
                </div>
              </div>

              {/* Right Side: Circular Progress Ring */}
              <div className="relative flex-shrink-0" style={{ width: '130px', height: '130px' }}>
                <svg 
                  width="130" 
                  height="130" 
                  viewBox="0 0 130 130"
                  style={{ 
                    transform: 'rotate(-90deg)',
                    filter: 'drop-shadow(0 4px 16px rgba(52, 199, 89, 0.25))'
                  }}
                >
                  {/* Background circle */}
                  <circle
                    cx="65"
                    cy="65"
                    r={50}
                    fill="none"
                    stroke="#E5E5E7"
                    strokeWidth="14"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="65"
                    cy="65"
                    r={50}
                    fill="none"
                    stroke={getProgressColor(getCompletionPercentage())}
                    strokeWidth="14"
                    strokeDasharray={2 * Math.PI * 50}
                    strokeDashoffset={2 * Math.PI * 50 * (1 - getCompletionPercentage() / 100)}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                  />
                </svg>
                
                {/* Percentage centered inside ring */}
                <div 
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ 
                    fontSize: '30px',
                    fontWeight: 700,
                    lineHeight: 1,
                    color: '#000000',
                    letterSpacing: '-0.03em'
                  }}
                >
                  {getCompletionPercentage()}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Bar Section */}
        <div className="mb-8">
          {/* Section Header */}
          <h2 
            className="mb-4"
            style={{ 
              fontSize: '20px',
              fontWeight: 600,
              color: '#1A1A1A'
            }}
          >
            {selectedHabit === 'read' ? 'Pages read' : 'Habits completed'}
          </h2>

          {/* Bar Chart Card */}
          <div 
            className="rounded-3xl p-6"
            style={{ 
              backgroundColor: '#fff',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
            }}
          >
            {/* Total completed */}
            <div className="mb-6">
              <div 
                style={{ 
                  fontSize: '40px',
                  fontWeight: 700,
                  color: '#1A1A1A',
                  lineHeight: 1,
                  letterSpacing: '-0.02em',
                  marginBottom: '4px'
                }}
              >
                {selectedHabit === 'read' ? totalPagesRead : totalCompleted}
              </div>
              <div 
                style={{ 
                  fontSize: '13px',
                  color: '#8E8E93',
                  fontWeight: 400
                }}
              >
                {selectedHabit === 'read' ? 'Pages read this week' : 'Total completed habits'}
              </div>
            </div>

            {/* Bar Chart */}
            <div className="flex items-end justify-between gap-2.5" style={{ height: '180px' }}>
              {(selectedHabit === 'read' ? readingWeeklyData : weeklyData).map((data, index) => {
                const heightPercent = (data.value / data.max) * 100;
                const minHeight = 8; // Minimum height for inactive days
                const actualHeight = data.value > 0 ? Math.max(heightPercent, 15) : minHeight;
                
                return (
                  <div key={index} className="flex-1 flex flex-col items-center justify-end" style={{ height: '100%' }}>
                    <div className="flex flex-col items-center justify-end w-full" style={{ height: 'calc(100% - 20px)' }}>
                      {/* Bar */}
                      <div 
                        className="w-full transition-all"
                        style={{ 
                          height: `${actualHeight}%`,
                          backgroundColor: data.value > 0 ? '#34C759' : '#E8E8ED',
                          borderRadius: '8px',
                          borderTopLeftRadius: '8px',
                          borderTopRightRadius: '8px',
                          borderBottomLeftRadius: data.value > 0 ? '4px' : '8px',
                          borderBottomRightRadius: data.value > 0 ? '4px' : '8px'
                        }}
                      />
                    </div>
                    {/* Day label */}
                    <div 
                      style={{ 
                        fontSize: '12px',
                        color: '#8E8E93',
                        fontWeight: 500,
                        marginTop: '8px'
                      }}
                    >
                      {data.day}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Streak & Days Metrics (Only when Reading is selected) */}
        {selectedHabit === 'read' && (
          <div className="mb-8">
            <div 
              className="rounded-2xl p-6"
              style={{ 
                backgroundColor: '#fff',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
              }}
            >
              <div className="flex items-start justify-around gap-4">
                {/* Left: Current streak */}
                <div className="flex flex-col items-center">
                  {/* Flame icon with soft orange background */}
                  <div 
                    className="flex items-center justify-center mb-3"
                    style={{ 
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(255, 159, 10, 0.08)'
                    }}
                  >
                    <Flame 
                      className="w-6 h-6" 
                      strokeWidth={2}
                      style={{ color: '#FF9F0A' }}
                    />
                  </div>
                  
                  {/* Number */}
                  <div 
                    style={{ 
                      fontSize: '48px',
                      fontWeight: 700,
                      color: '#1A1A1A',
                      lineHeight: 1,
                      marginBottom: '8px'
                    }}
                  >
                    5
                  </div>
                  
                  {/* Label */}
                  <div 
                    style={{ 
                      fontSize: '15px',
                      color: '#8E8E93',
                      fontWeight: 400
                    }}
                  >
                    Current streak
                  </div>
                </div>

                {/* Right: Days completed */}
                <div className="flex flex-col items-center">
                  {/* Calendar-check icon with soft green background */}
                  <div 
                    className="flex items-center justify-center mb-3"
                    style={{ 
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(52, 199, 89, 0.08)'
                    }}
                  >
                    <CalendarCheck 
                      className="w-6 h-6" 
                      strokeWidth={2}
                      style={{ color: '#34C759' }}
                    />
                  </div>
                  
                  {/* Number */}
                  <div 
                    style={{ 
                      fontSize: '48px',
                      fontWeight: 700,
                      color: '#1A1A1A',
                      lineHeight: 1,
                      marginBottom: '8px'
                    }}
                  >
                    8
                  </div>
                  
                  {/* Label */}
                  <div 
                    style={{ 
                      fontSize: '15px',
                      color: '#8E8E93',
                      fontWeight: 400
                    }}
                  >
                    Days completed
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Habit Heatmap Section - Always visible */}
        <div className="mb-8">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 
              style={{ 
                fontSize: '20px',
                fontWeight: 600,
                color: '#1A1A1A'
              }}
            >
              Habit heatmap
            </h2>
            <div
              className="px-3 py-1.5 rounded-full"
              style={{
                backgroundColor: '#EFEFEF',
                fontSize: '13px',
                color: '#8E8E93',
                fontWeight: 500
              }}
            >
              Mar
            </div>
          </div>

          {/* Heatmap Card */}
          <div 
            className="rounded-3xl p-6"
            style={{ 
              backgroundColor: '#fff',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
            }}
          >
            {/* Day labels */}
            <div className="flex justify-between mb-4 px-1">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                <div 
                  key={i}
                  style={{ 
                    fontSize: '12px',
                    color: '#8E8E93',
                    fontWeight: 500,
                    width: '32px',
                    textAlign: 'center'
                  }}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Heatmap grid - 5 weeks */}
            <div className="space-y-2">
              {[...Array(5)].map((_, weekIndex) => (
                <div key={weekIndex} className="flex gap-2 justify-between">
                  {[...Array(7)].map((_, dayIndex) => {
                    // Mock intensity
                    const intensity = Math.random();
                    let bgColor = '#E5E5E7'; // No activity
                    if (intensity > 0.7) bgColor = '#34C759'; // High (Apple green)
                    else if (intensity > 0.5) bgColor = '#FF9F0A'; // Medium (iOS orange)
                    else if (intensity > 0.3) bgColor = '#FFD60A'; // Low (iOS yellow)
                    
                    return (
                      <div
                        key={dayIndex}
                        className="rounded-lg"
                        style={{
                          width: '32px',
                          height: '32px',
                          backgroundColor: bgColor
                        }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-end gap-2 mt-6">
              <span style={{ fontSize: '11px', color: '#8E8E93' }}>Less</span>
              <div className="flex gap-1.5">
                {[
                  '#E5E5E7',
                  '#FFD60A',
                  '#FF9F0A',
                  '#34C759'
                ].map((color, i) => (
                  <div
                    key={i}
                    className="rounded"
                    style={{
                      width: '14px',
                      height: '14px',
                      backgroundColor: color
                    }}
                  />
                ))}
              </div>
              <span style={{ fontSize: '11px', color: '#8E8E93' }}>More</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}