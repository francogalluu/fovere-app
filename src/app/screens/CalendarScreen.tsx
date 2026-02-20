import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Link2, Flame, CalendarCheck } from 'lucide-react';
import { useState } from 'react';
import { BottomNav } from '../components/BottomNav';
import { getProgressColor } from '../utils/progressColors';

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const weekDaysShort = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Mock completion data: key is date string, value is completion percentage
const completionData: Record<string, number> = {
  // January 2026
  '2026-01-01': 0,
  '2026-01-02': 100,
  '2026-01-03': 100,
  '2026-01-04': 0,
  '2026-01-05': 75,
  '2026-01-06': 50,
  '2026-01-07': 100,
  '2026-01-08': 100,
  '2026-01-09': 100,
  '2026-01-10': 25,
  '2026-01-11': 0,
  '2026-01-12': 100,
  '2026-01-13': 80,
  '2026-01-14': 100,
  '2026-01-15': 100,
  '2026-01-16': 100,
  '2026-01-17': 45,
  '2026-01-18': 0,
  '2026-01-19': 100,
  '2026-01-20': 100,
  '2026-01-21': 65,
  '2026-01-22': 100,
  '2026-01-23': 30,
  '2026-01-24': 100,
  '2026-01-25': 0,
  '2026-01-26': 100,
  '2026-01-27': 100,
  '2026-01-28': 90,
  '2026-01-29': 100,
  '2026-01-30': 55,
  '2026-01-31': 100,
  // February 2026
  '2026-02-01': 100,
  '2026-02-02': 75,
  '2026-02-03': 100,
  '2026-02-04': 50,
  '2026-02-05': 100,
  '2026-02-06': 0,
  '2026-02-07': 100,
  '2026-02-08': 100,
  '2026-02-09': 66,
  '2026-02-10': 100,
  '2026-02-11': 100,
  '2026-02-12': 100,
  '2026-02-13': 40, // today (Friday)
};

// Weekly data by month
const weeklyDataByMonth: Record<string, any[]> = {
  '2026-01': [
    { day: 'Mon', date: 26, month: 0, completion: 100 },
    { day: 'Tue', date: 27, month: 0, completion: 100 },
    { day: 'Wed', date: 28, month: 0, completion: 90 },
    { day: 'Thu', date: 29, month: 0, completion: 100 },
    { day: 'Fri', date: 30, month: 0, completion: 55 },
    { day: 'Sat', date: 31, month: 0, completion: 100 },
    { day: 'Sun', date: 1, month: 1, completion: 100 },
  ],
  '2026-02': [
    { day: 'Mon', date: 9, month: 1, completion: 66 },
    { day: 'Tue', date: 10, month: 1, completion: 100 },
    { day: 'Wed', date: 11, month: 1, completion: 100 },
    { day: 'Thu', date: 12, month: 1, completion: 100 },
    { day: 'Fri', date: 13, month: 1, completion: 40 },
    { day: 'Sat', date: 14, month: 1, completion: 0 },
    { day: 'Sun', date: 15, month: 1, completion: 0 },
  ]
};

// Habit data by month
const habitDataByMonth: Record<string, any[]> = {
  '2026-01': [
    { icon: '📚', name: 'Read', value: '465 pages' },
    { icon: '🏃', name: 'Morning Run', value: '240 minutes' },
    { icon: '💧', name: 'Drink Water', value: '152 glasses' },
    { icon: '🧘', name: 'Yoga', value: '12 sessions' },
  ],
  '2026-02': [
    { icon: '📚', name: 'Read', value: '320 pages' },
    { icon: '🏃', name: 'Morning Run', value: '180 minutes' },
    { icon: '💧', name: 'Drink Water', value: '104 glasses' },
    { icon: '🧘', name: 'Yoga', value: '8 sessions' },
  ]
};

const weeklyHabitDataByPeriod: Record<string, any[]> = {
  '2026-01-26': [
    { icon: '📚', name: 'Read', value: '95 pages' },
    { icon: '🏃', name: 'Morning Run', value: '50 minutes' },
    { icon: '💧', name: 'Drink Water', value: '35 glasses' },
    { icon: '🧘', name: 'Yoga', value: '3 sessions' },
  ],
  '2026-02-09': [
    { icon: '📚', name: 'Read', value: '85 pages' },
    { icon: '🏃', name: 'Morning Run', value: '45 minutes' },
    { icon: '💧', name: 'Drink Water', value: '28 glasses' },
    { icon: '🧘', name: 'Yoga', value: '2 sessions' },
  ]
};

export default function CalendarScreen() {
  const [view, setView] = useState<'weekly' | 'monthly'>('monthly');
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 1, 1)); // February 2026
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date(2026, 1, 9)); // Feb 9, 2026
  const today = new Date(2026, 1, 13); // Friday, Feb 13, 2026

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days in the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const days = getDaysInMonth(currentMonth);

  const isToday = (date: Date | null) => {
    if (!date) return false;
    return date.toDateString() === today.toDateString();
  };

  const isTodayInCurrentMonth = () => {
    return currentMonth.getMonth() === today.getMonth() && 
           currentMonth.getFullYear() === today.getFullYear();
  };

  const isFuture = (date: Date | null) => {
    if (!date) return false;
    return date > today;
  };

  const getCompletion = (date: Date | null) => {
    if (!date) return 0;
    const dateStr = date.toISOString().split('T')[0];
    return completionData[dateStr] || 0;
  };

  const isCompleted = (date: Date | null) => {
    return getCompletion(date) === 100;
  };

  const monthYear = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Navigate months
  const handlePrevMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() - 1);
    // Only allow going back to January 2026
    if (newMonth.getFullYear() === 2026 && newMonth.getMonth() >= 0) {
      setCurrentMonth(newMonth);
    }
  };

  const handleNextMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + 1);
    // Only allow going forward to current month
    if (newMonth <= today) {
      setCurrentMonth(newMonth);
    }
  };

  const handlePrevWeek = () => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(newWeekStart.getDate() - 7);
    // Only allow navigating to weeks that have data
    if (newWeekStart.getFullYear() === 2026 && newWeekStart.getMonth() >= 0) {
      setCurrentWeekStart(newWeekStart);
    }
  };

  const handleNextWeek = () => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(newWeekStart.getDate() + 7);
    // Only allow going forward to current week or earlier
    if (newWeekStart <= today) {
      setCurrentWeekStart(newWeekStart);
    }
  };

  // Calculate monthly stats for current month only
  const getMonthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  const currentMonthKey = getMonthKey(currentMonth);
  
  const monthCompletionData = Object.entries(completionData).filter(([dateStr]) => 
    dateStr.startsWith(currentMonthKey)
  );
  
  const completedDaysInMonth = monthCompletionData.filter(([, value]) => value === 100).length;
  const totalTrackedDaysInMonth = monthCompletionData.length;
  const monthlyCompletionPercentage = totalTrackedDaysInMonth > 0 
    ? Math.round((completedDaysInMonth / totalTrackedDaysInMonth) * 100) 
    : 0;

  // Calculate weekly stats dynamically based on currentWeekStart
  const getWeekDays = () => {
    const days = [];
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const completion = completionData[dateStr] || 0;
      
      days.push({
        day: dayNames[i],
        date: date.getDate(),
        month: date.getMonth(),
        year: date.getFullYear(),
        completion,
        fullDate: date
      });
    }
    
    return days;
  };
  
  const weeklyData = getWeekDays();
  const weeklyCompletedDays = weeklyData.filter(d => d.completion === 100).length;
  const weeklyCompletionPercentage = weeklyData.length > 0 
    ? Math.round((weeklyData.reduce((sum, d) => sum + d.completion, 0) / weeklyData.length))
    : 0;

  // Calculate week label
  const weekEnd = new Date(currentWeekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekLabel = currentWeekStart.getMonth() === weekEnd.getMonth()
    ? `${currentWeekStart.toLocaleDateString('en-US', { month: 'short' })} ${currentWeekStart.getDate()} - ${weekEnd.getDate()}, ${currentWeekStart.getFullYear()}`
    : `${currentWeekStart.toLocaleDateString('en-US', { month: 'short' })} ${currentWeekStart.getDate()} - ${weekEnd.toLocaleDateString('en-US', { month: 'short' })} ${weekEnd.getDate()}, ${currentWeekStart.getFullYear()}`;

  const habitData = view === 'monthly' 
    ? habitDataByMonth[`${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`] || []
    : weeklyHabitDataByPeriod[`${currentWeekStart.getFullYear()}-${String(currentWeekStart.getMonth() + 1).padStart(2, '0')}-${String(currentWeekStart.getDate()).padStart(2, '0')}`] || [];

  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{ 
        backgroundColor: '#F2F2F7',
        maxWidth: '430px',
        margin: '0 auto',
        position: 'relative'
      }}
    >
      {/* Status Bar */}
      <div 
        className="flex items-center justify-between px-6 pt-3 pb-2"
        style={{ paddingTop: 'max(12px, env(safe-area-inset-top))', backgroundColor: '#F2F2F7' }}
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
      <div className="px-6 pt-4 pb-4">
        <h1 
          style={{ 
            fontSize: '34px',
            fontWeight: 700,
            color: '#1A1A1A',
            letterSpacing: '-0.02em',
            marginBottom: '12px'
          }}
        >
          Calendar
        </h1>

        {/* View Toggle - Segmented Control */}
        <div 
          className="flex rounded-lg p-1 mb-4"
          style={{ backgroundColor: '#E5E5E5' }}
        >
          <button
            onClick={() => setView('weekly')}
            className="flex-1 py-2 rounded-md transition-all"
            style={{
              backgroundColor: view === 'weekly' ? '#fff' : 'transparent',
              color: view === 'weekly' ? '#008080' : '#666',
              fontSize: '15px',
              fontWeight: 500,
              boxShadow: view === 'weekly' ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none'
            }}
          >
            Weekly
          </button>
          <button
            onClick={() => setView('monthly')}
            className="flex-1 py-2 rounded-md transition-all"
            style={{
              backgroundColor: view === 'monthly' ? '#fff' : 'transparent',
              color: view === 'monthly' ? '#008080' : '#666',
              fontSize: '15px',
              fontWeight: 500,
              boxShadow: view === 'monthly' ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none'
            }}
          >
            Monthly
          </button>
        </div>

        {/* Month/Year with navigation (only for monthly view) */}
        {view === 'monthly' && (
          <div className="flex items-center justify-between">
            <button className="p-2" style={{ color: '#008080' }} onClick={handlePrevMonth}>
              <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
            </button>
            
            <div style={{ fontSize: '17px', fontWeight: 600, color: '#1A1A1A' }}>
              {monthYear}
            </div>

            <button className="p-2" style={{ color: '#008080' }} onClick={handleNextMonth}>
              <ChevronRight className="w-5 h-5" strokeWidth={2.5} />
            </button>
          </div>
        )}

        {/* Week navigation (only for weekly view) */}
        {view === 'weekly' && (
          <div className="flex items-center justify-between">
            <button className="p-2" style={{ color: '#008080' }} onClick={handlePrevWeek}>
              <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
            </button>
            
            <div style={{ fontSize: '17px', fontWeight: 600, color: '#1A1A1A' }}>
              {weekLabel}
            </div>

            <button className="p-2" style={{ color: '#008080' }} onClick={handleNextWeek}>
              <ChevronRight className="w-5 h-5" strokeWidth={2.5} />
            </button>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="px-4 pb-32">
        {/* Monthly View */}
        {view === 'monthly' && (
          <>
            <div 
              className="rounded-2xl p-4"
              style={{ backgroundColor: '#fff' }}
            >
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-2 mb-3">
                {daysOfWeek.map(day => (
                  <div 
                    key={day}
                    className="text-center"
                    style={{ 
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#999',
                      padding: '8px 0'
                    }}
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar days */}
              <div className="grid grid-cols-7 gap-2">
                {days.map((date, index) => {
                  if (!date) {
                    return <div key={`empty-${index}`} />;
                  }

                  const dayIsToday = isToday(date);
                  const showTodayIndicator = dayIsToday && isTodayInCurrentMonth();
                  const dayIsFuture = isFuture(date);
                  const completion = getCompletion(date);
                  
                  const ringColor = getProgressColor(completion);
                  const radius = 14;
                  const circumference = 2 * Math.PI * radius;
                  const dashOffset = circumference * (1 - completion / 100);

                  return (
                    <div
                      key={index}
                      className="flex items-center justify-center"
                      style={{
                        opacity: dayIsFuture ? 0.5 : 1,
                        aspectRatio: '1'
                      }}
                    >
                      <div className="relative" style={{ width: '40px', height: '40px' }}>
                        {showTodayIndicator ? (
                          // Today indicator: Filled green circle
                          <>
                            <svg 
                              width="40" 
                              height="40" 
                              viewBox="0 0 40 40"
                              style={{
                                display: 'block',
                                filter: 'drop-shadow(0 2px 4px rgba(52, 199, 89, 0.2))'
                              }}
                            >
                              <circle
                                cx="20"
                                cy="20"
                                r="20"
                                fill="#34C759"
                              />
                            </svg>
                            {/* Date number centered */}
                            <div 
                              className="absolute inset-0 flex items-center justify-center"
                              style={{
                                color: '#FFFFFF',
                                fontWeight: 600,
                                fontSize: '15px',
                                pointerEvents: 'none'
                              }}
                            >
                              {date.getDate()}
                            </div>
                          </>
                        ) : (
                          // Other days: Progress ring
                          <>
                            <svg 
                              width="40" 
                              height="40" 
                              viewBox="0 0 40 40" 
                              style={{ transform: 'rotate(-90deg)' }}
                            >
                              <circle
                                cx="20"
                                cy="20"
                                r={radius}
                                fill="none"
                                stroke={ringColor}
                                strokeWidth={2}
                                strokeDasharray={circumference}
                                strokeDashoffset={dashOffset}
                                strokeLinecap="round"
                              />
                            </svg>
                            {/* Date number centered */}
                            <div 
                              className="absolute inset-0 flex items-center justify-center"
                              style={{
                                color: '#1A1A1A',
                                fontWeight: 400,
                                fontSize: '15px',
                                pointerEvents: 'none'
                              }}
                            >
                              {date.getDate()}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Monthly Summary */}
            <div className="mt-6">
              {/* Card 1: Monthly Performance - Matching Home Card Style */}
              <div 
                className="rounded-3xl py-6 px-6 mb-3"
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
                      Monthly completion
                    </div>
                    <div 
                      style={{ 
                        fontSize: '17px',
                        color: '#8E8E93',
                        fontWeight: 400,
                        lineHeight: '22px'
                      }}
                    >
                      {completedDaysInMonth} of {totalTrackedDaysInMonth} days<br />completed
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
                        stroke={getProgressColor(monthlyCompletionPercentage)}
                        strokeWidth="14"
                        strokeDasharray={2 * Math.PI * 50}
                        strokeDashoffset={2 * Math.PI * 50 * (1 - monthlyCompletionPercentage / 100)}
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
                      {monthlyCompletionPercentage}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Streak & Consistency */}
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
                      {completedDaysInMonth}
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
          </>
        )}

        {/* Weekly View */}
        {view === 'weekly' && (
          <>
            <div 
              className="rounded-2xl p-6"
              style={{ backgroundColor: '#fff' }}
            >
              {/* Weekly Performance Graph */}
              <div className="flex items-end justify-between gap-3" style={{ height: '200px' }}>
                {weeklyData.map((day, index) => {
                  const dayIsToday = isToday(day.fullDate);
                  const showTodayIndicator = dayIsToday && (currentWeekStart <= today && today <= weekEnd);
                  const barHeight = day.completion;
                  const barColor = getProgressColor(day.completion);

                  return (
                    <div 
                      key={index}
                      className="flex-1 flex flex-col items-center justify-end gap-2"
                    >
                      {/* Bar with percentage label */}
                      <div className="relative w-full flex items-end" style={{ height: '160px' }}>
                        {barHeight > 0 && (
                          <>
                            {/* Percentage label */}
                            <div 
                              className="absolute w-full text-center"
                              style={{ 
                                bottom: `calc(${barHeight}% + 4px)`,
                                fontSize: '13px',
                                fontWeight: 400,
                                color: barColor
                              }}
                            >
                              {barHeight}%
                            </div>
                            
                            {/* Bar */}
                            <div 
                              className="w-full rounded-lg transition-all"
                              style={{ 
                                height: `${barHeight}%`,
                                backgroundColor: barColor
                              }}
                            />
                          </>
                        )}
                        
                        {/* Empty state for 0% */}
                        {barHeight === 0 && (
                          <div 
                            className="w-full rounded-lg"
                            style={{ 
                              height: '4px',
                              backgroundColor: barColor,
                              opacity: 0.5
                            }}
                          />
                        )}
                      </div>
                      
                      {/* Day label */}
                      <div 
                        style={{ 
                          fontSize: '12px',
                          fontWeight: showTodayIndicator ? 600 : 400,
                          color: showTodayIndicator ? '#34C759' : '#999'
                        }}
                      >
                        {day.day}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Weekly Summary */}
            <div className="mt-6">
              {/* Card 1: Weekly Performance - Matching Monthly Card Style */}
              <div 
                className="rounded-3xl py-6 px-6 mb-3"
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
                      Weekly completion
                    </div>
                    <div 
                      style={{ 
                        fontSize: '17px',
                        color: '#8E8E93',
                        fontWeight: 400,
                        lineHeight: '22px'
                      }}
                    >
                      {weeklyCompletedDays} of {weeklyData.length} days<br />completed
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
                        stroke={getProgressColor(weeklyCompletionPercentage)}
                        strokeWidth="14"
                        strokeDasharray={2 * Math.PI * 50}
                        strokeDashoffset={2 * Math.PI * 50 * (1 - weeklyCompletionPercentage / 100)}
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
                      {weeklyCompletionPercentage}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Streak & Consistency */}
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
                      {weeklyCompletedDays}
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
          </>
        )}

        {/* Habit Breakdown Section */}
        <div className="mt-4">
          <h2 
            style={{ 
              fontSize: '22px',
              fontWeight: 600,
              color: '#1A1A1A',
              marginBottom: '12px',
              paddingLeft: '4px'
            }}
          >
            {view === 'monthly' ? 'This Month' : 'This Week'}
          </h2>

          <div 
            className="rounded-2xl p-4"
            style={{ backgroundColor: '#fff' }}
          >
            {habitData.map((habit, index) => (
              <div
                key={index}
                className="flex items-center py-3 px-2"
                style={{
                  borderBottom: index < habitData.length - 1 ? '1px solid #F2F2F7' : 'none'
                }}
              >
                {/* Icon */}
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center mr-3"
                  style={{ 
                    backgroundColor: '#F7F7F8',
                    fontSize: '20px'
                  }}
                >
                  {habit.icon}
                </div>

                {/* Habit name */}
                <div className="flex-1">
                  <div 
                    style={{ 
                      fontSize: '15px',
                      fontWeight: 500,
                      color: '#1A1A1A'
                    }}
                  >
                    {habit.name}
                  </div>
                </div>

                {/* Value */}
                <div 
                  style={{ 
                    fontSize: '15px',
                    fontWeight: 400,
                    color: '#666'
                  }}
                >
                  {habit.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}