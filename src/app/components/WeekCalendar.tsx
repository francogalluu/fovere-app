import { getProgressColor } from '../utils/progressColors';

interface WeekCalendarProps {
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
}

export function WeekCalendar({ selectedDate, onDateSelect }: WeekCalendarProps = {}) {
  const days = [
    { date: 9, day: 'MON', completionRate: 100 },
    { date: 10, day: 'TUE', completionRate: 100 },
    { date: 11, day: 'WED', completionRate: 65 },
    { date: 12, day: 'THU', completionRate: 45 },
    { date: 13, day: 'FRI', isToday: true, completionRate: 0 },
    { date: 14, day: 'SAT', completionRate: 0 },
    { date: 15, day: 'SUN', completionRate: 0 },
  ];

  const today = new Date(2026, 1, 13); // Friday, Feb 13, 2026

  return (
    <div className="px-4 py-4">
      <div className="flex justify-between items-center">
        {days.map((day, idx) => {
          const ringColor = getProgressColor(day.completionRate);
          const strokeWidth = 2;
          const radius = 20;
          const circumference = 2 * Math.PI * radius;
          const dashOffset = circumference * (1 - day.completionRate / 100);
          const isFuture = idx > days.findIndex(d => d.isToday);
          const isCompleted = day.completionRate === 100;
          const isTodayCompleted = day.isToday && isCompleted;
          
          // Check if this day is selected
          const dayDate = new Date(2026, 1, day.date);
          const isSelected = selectedDate && dayDate.toDateString() === selectedDate.toDateString();

          return (
            <button
              key={idx}
              onClick={() => onDateSelect?.(dayDate)}
              className="flex flex-col items-center gap-2"
              style={{ cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
            >
              <span 
                className="text-xs tracking-wider"
                style={{ 
                  color: isSelected ? '#008080' : '#8E8E93',
                  fontWeight: 600,
                  fontSize: '11px'
                }}
              >
                {day.day}
              </span>
              <div className="relative">
                {isSelected ? (
                  // Selected day: Filled circle
                  <svg 
                    width="48" 
                    height="48" 
                    viewBox="0 0 48 48"
                    style={{ 
                      filter: isCompleted ? 'drop-shadow(0 0 8px rgba(52, 199, 89, 0.3))' : 'none'
                    }}
                  >
                    <circle
                      cx="24"
                      cy="24"
                      r={radius}
                      fill="#008080"
                    />
                  </svg>
                ) : (
                  // Other days: Progress ring
                  <svg 
                    width="48" 
                    height="48" 
                    viewBox="0 0 48 48" 
                    style={{ 
                      transform: 'rotate(-90deg)',
                      opacity: isFuture ? 0.65 : 1
                    }}
                  >
                    <circle
                      cx="24"
                      cy="24"
                      r={radius}
                      fill="none"
                      stroke={ringColor}
                      strokeWidth={strokeWidth}
                      strokeDasharray={circumference}
                      strokeDashoffset={dashOffset}
                      strokeLinecap="round"
                    />
                  </svg>
                )}
                {/* Date number centered */}
                <div 
                  className="absolute inset-0 flex items-center justify-center"
                  style={{
                    color: isSelected ? '#FFFFFF' : '#1A1A1A',
                    fontWeight: isSelected ? 600 : 500,
                    fontSize: '16px',
                    opacity: isFuture && !isSelected ? 0.65 : 1
                  }}
                >
                  {day.date}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}