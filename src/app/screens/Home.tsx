import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { WeekCalendar } from '../components/WeekCalendar';
import { ProgressHero } from '../components/ProgressHero';
import { SwipeableHabitCard } from '../components/SwipeableHabitCard';
import { BottomNav } from '../components/BottomNav';

// Mock habit data for different dates
const habitDataByDate: Record<string, any> = {
  '2026-02-09': {
    daily: [
      { id: 1, icon: '🏃', name: 'Morning Run', current: 30, target: 30, unit: 'min', completed: true },
      { id: 2, icon: '💧', name: 'Drink Water', current: 8, target: 8, unit: 'glasses', completed: true },
      { id: 3, icon: '📚', name: 'Read', current: 30, target: 30, unit: 'min', completed: true },
    ],
    weekly: [
      { id: 4, icon: '🧘', name: 'Yoga Class', current: 1, target: 3, unit: 'times' },
    ]
  },
  '2026-02-10': {
    daily: [
      { id: 1, icon: '🏃', name: 'Morning Run', current: 30, target: 30, unit: 'min', completed: true },
      { id: 2, icon: '💧', name: 'Drink Water', current: 8, target: 8, unit: 'glasses', completed: true },
      { id: 3, icon: '📚', name: 'Read', current: 30, target: 30, unit: 'min', completed: true },
    ],
    weekly: [
      { id: 4, icon: '🧘', name: 'Yoga Class', current: 1, target: 3, unit: 'times' },
    ]
  },
  '2026-02-11': {
    daily: [
      { id: 1, icon: '🏃', name: 'Morning Run', current: 20, target: 30, unit: 'min' },
      { id: 2, icon: '💧', name: 'Drink Water', current: 5, target: 8, unit: 'glasses' },
      { id: 3, icon: '📚', name: 'Read', current: 30, target: 30, unit: 'min', completed: true },
    ],
    weekly: [
      { id: 4, icon: '🧘', name: 'Yoga Class', current: 2, target: 3, unit: 'times' },
    ]
  },
  '2026-02-12': {
    daily: [
      { id: 1, icon: '🏃', name: 'Morning Run', current: 15, target: 30, unit: 'min' },
      { id: 2, icon: '💧', name: 'Drink Water', current: 4, target: 8, unit: 'glasses' },
      { id: 3, icon: '📚', name: 'Read', current: 15, target: 30, unit: 'min' },
    ],
    weekly: [
      { id: 4, icon: '🧘', name: 'Yoga Class', current: 2, target: 3, unit: 'times' },
    ]
  },
  '2026-02-13': {
    daily: [
      { id: 1, icon: '🏃', name: 'Morning Run', current: 15, target: 30, unit: 'min' },
      { id: 2, icon: '💧', name: 'Drink Water', current: 5, target: 8, unit: 'glasses' },
      { id: 3, icon: '📚', name: 'Read', current: 30, target: 30, unit: 'min', completed: true },
    ],
    weekly: [
      { id: 4, icon: '🧘', name: 'Yoga Class', current: 2, target: 3, unit: 'times' },
    ]
  },
  '2026-02-14': {
    daily: [
      { id: 1, icon: '🏃', name: 'Morning Run', current: 0, target: 30, unit: 'min' },
      { id: 2, icon: '💧', name: 'Drink Water', current: 0, target: 8, unit: 'glasses' },
      { id: 3, icon: '📚', name: 'Read', current: 0, target: 30, unit: 'min' },
    ],
    weekly: [
      { id: 4, icon: '🧘', name: 'Yoga Class', current: 2, target: 3, unit: 'times' },
    ]
  },
  '2026-02-15': {
    daily: [
      { id: 1, icon: '🏃', name: 'Morning Run', current: 0, target: 30, unit: 'min' },
      { id: 2, icon: '💧', name: 'Drink Water', current: 0, target: 8, unit: 'glasses' },
      { id: 3, icon: '📚', name: 'Read', current: 0, target: 30, unit: 'min' },
    ],
    weekly: [
      { id: 4, icon: '🧘', name: 'Yoga Class', current: 2, target: 3, unit: 'times' },
    ]
  }
};

export default function Home() {
  const navigate = useNavigate();
  const today = new Date(2026, 1, 13); // Friday, Feb 13, 2026
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [completedHabits, setCompletedHabits] = useState<Set<number>>(new Set());

  const handleComplete = (habitId: number) => {
    setCompletedHabits(prev => new Set(prev).add(habitId));
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setCompletedHabits(new Set()); // Reset completion state when changing dates
  };

  // Get habit data for selected date
  const dateKey = selectedDate.toISOString().split('T')[0];
  const habitsForDate = habitDataByDate[dateKey] || habitDataByDate['2026-02-13'];
  
  // Check if selected date is in the future
  const isFutureDate = selectedDate > today;
  const isToday = selectedDate.toDateString() === today.toDateString();
  const isYesterday = new Date(today.getTime() - 86400000).toDateString() === selectedDate.toDateString();
  
  // Format title based on selected date
  const getTitle = () => {
    if (isToday) return 'Today';
    if (isYesterday) return 'Yesterday';
    return selectedDate.toLocaleDateString('en-US', { day: 'numeric', month: 'long' });
  };

  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{ 
        backgroundColor: '#fff',
        maxWidth: '430px',
        margin: '0 auto',
        position: 'relative'
      }}
    >
      {/* Status Bar */}
      <div 
        className="flex items-center justify-between px-6 pt-3 pb-2"
        style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}
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
      <div className="flex items-center justify-between px-6 pt-4 pb-2">
        <h1 
          style={{ 
            fontSize: '34px',
            fontWeight: 700,
            color: '#1A1A1A',
            letterSpacing: '-0.02em'
          }}
        >
          Fovere
        </h1>
        <button 
          onClick={() => navigate('/new-habit')}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ backgroundColor: '#008080' }}
        >
          <Plus className="w-5 h-5 text-white" strokeWidth={2.5} />
        </button>
      </div>

      {/* Week Calendar */}
      <div className="mt-2">
        <WeekCalendar selectedDate={selectedDate} onDateSelect={handleDateSelect} />
      </div>

      {/* Progress Hero */}
      <div className="mt-4">
        <ProgressHero selectedDate={selectedDate} />
      </div>

      {/* Today's Habits Section */}
      <div className="flex-1 px-6 mt-6 pb-32">
        <div className="flex items-center gap-3 mb-4">
          <h2 
            style={{ 
              fontSize: '22px',
              fontWeight: 600,
              color: '#1A1A1A'
            }}
          >
            {getTitle()}'s Habits
          </h2>
          {!isToday && (
            <div
              style={{
                fontSize: '13px',
                fontWeight: 500,
                color: '#8E8E93',
                backgroundColor: '#F2F2F7',
                padding: '4px 10px',
                borderRadius: '12px'
              }}
            >
              {isFutureDate ? 'Upcoming' : 'Past'}
            </div>
          )}
        </div>
        
        <div style={{ paddingLeft: '2px', paddingRight: '2px', opacity: isFutureDate ? 0.5 : 1 }}>
          {habitsForDate.daily.map((habit: any) => (
            <SwipeableHabitCard
              key={habit.id}
              id={habit.id}
              icon={habit.icon}
              name={habit.name}
              current={habit.current}
              target={habit.target}
              unit={habit.unit}
              onClick={() => !isFutureDate && navigate(`/habit/${habit.id}`)}
              onComplete={!isFutureDate ? handleComplete : undefined}
              isCompleted={completedHabits.has(habit.id) || habit.completed}
            />
          ))}
        </div>

        {/* Weekly Habits Section */}
        <h2 
          style={{ 
            fontSize: '22px',
            fontWeight: 600,
            color: '#1A1A1A',
            marginTop: '32px',
            marginBottom: '16px'
          }}
        >
          Weekly Habits
        </h2>
        
        <div style={{ paddingLeft: '2px', paddingRight: '2px', opacity: isFutureDate ? 0.5 : 1 }}>
          {habitsForDate.weekly.map((habit: any) => (
            <SwipeableHabitCard
              key={habit.id}
              id={habit.id}
              icon={habit.icon}
              name={habit.name}
              current={habit.current}
              target={habit.target}
              unit={habit.unit}
              onClick={() => !isFutureDate && navigate(`/habit/${habit.id}`)}
              onComplete={!isFutureDate ? handleComplete : undefined}
              isCompleted={completedHabits.has(habit.id)}
            />
          ))}
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}