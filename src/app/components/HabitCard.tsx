import { Check, ChevronRight } from 'lucide-react';
import { getProgressColor, PROGRESS_COLORS } from '../utils/progressColors';

type HabitCardProps = {
  icon: string;
  name: string;
  time?: string;
  completed?: boolean;
  current?: number;
  target?: number;
  unit?: string;
  onClick?: () => void;
};

export function HabitCard({ icon, name, time, completed, current, target, unit = 'min', onClick }: HabitCardProps) {
  const hasProgress = current !== undefined && target !== undefined;
  const progressPercentage = hasProgress ? (current / target) * 100 : 0;
  const isFullyCompleted = completed || progressPercentage === 100;
  const progressColor = getProgressColor(progressPercentage);
  
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center p-5 rounded-3xl mb-3"
      style={{ 
        background: 'rgba(255, 255, 255, 0.6)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(255, 255, 255, 0.5)',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.08)',
        textAlign: 'left',
        cursor: 'pointer',
        opacity: isFullyCompleted ? 0.92 : 1
      }}
    >
      {/* Icon with optional progress ring */}
      <div className="relative mr-4">
        {/* Subtle progress ring background */}
        {hasProgress && progressPercentage > 0 && !isFullyCompleted && (
          <svg 
            width="56" 
            height="56" 
            viewBox="0 0 56 56" 
            style={{ 
              position: 'absolute',
              top: '-4px',
              left: '-4px',
              transform: 'rotate(-90deg)'
            }}
          >
            <circle
              cx="28"
              cy="28"
              r="26"
              fill="none"
              stroke="#E5E5E5"
              strokeWidth="2"
            />
            <circle
              cx="28"
              cy="28"
              r="26"
              fill="none"
              stroke={progressColor}
              strokeWidth="2"
              strokeDasharray={2 * Math.PI * 26}
              strokeDashoffset={2 * Math.PI * 26 * (1 - progressPercentage / 100)}
              strokeLinecap="round"
              style={{ opacity: 0.4 }}
            />
          </svg>
        )}
        
        {/* Icon container */}
        <div 
          className="w-12 h-12 rounded-full flex items-center justify-center relative"
          style={{ 
            backgroundColor: '#fff',
            fontSize: '26px',
            border: isFullyCompleted ? `1.5px solid ${PROGRESS_COLORS.HIGH}` : 'none',
            boxShadow: isFullyCompleted ? '0 0 8px rgba(52, 199, 89, 0.15)' : 'none'
          }}
        >
          {icon}
        </div>
      </div>

      {/* Habit info */}
      <div className="flex-1 min-w-0">
        <div 
          className="truncate"
          style={{ 
            fontSize: '17px',
            fontWeight: 600,
            color: '#1A1A1A',
            marginBottom: '4px'
          }}
        >
          {name}
        </div>
        {hasProgress && (
          <>
            <div 
              style={{ 
                fontSize: '15px',
                color: '#8E8E93',
                fontWeight: 400
              }}
            >
              {current} / {target} {unit}
            </div>
          </>
        )}
        {!hasProgress && time && (
          <div 
            style={{ 
              fontSize: '15px',
              color: '#8E8E93',
              fontWeight: 400
            }}
          >
            {time}
          </div>
        )}
      </div>

      {/* Refined circular indicator */}
      <div className="ml-2 flex items-center">
        {completed || isFullyCompleted ? (
          <div className="relative w-12 h-12">
            <svg 
              width="48" 
              height="48" 
              viewBox="0 0 48 48" 
              style={{ 
                transform: 'rotate(-90deg)',
                filter: 'drop-shadow(0 0 8px rgba(52, 199, 89, 0.3))'
              }}
            >
              <circle
                cx="24"
                cy="24"
                r="20"
                fill="none"
                stroke="#E5E5E5"
                strokeWidth="3"
              />
              <circle
                cx="24"
                cy="24"
                r="20"
                fill="none"
                stroke={PROGRESS_COLORS.HIGH}
                strokeWidth="3"
                strokeDasharray={2 * Math.PI * 20}
                strokeDashoffset={0}
                strokeLinecap="round"
              />
            </svg>
            <div 
              className="absolute inset-0 flex items-center justify-center"
              style={{ 
                color: PROGRESS_COLORS.HIGH
              }}
            >
              <Check className="w-5 h-5" strokeWidth={3} />
            </div>
          </div>
        ) : hasProgress ? (
          <div className="relative w-12 h-12">
            <svg 
              width="48" 
              height="48" 
              viewBox="0 0 48 48" 
              style={{ 
                transform: 'rotate(-90deg)',
                filter: 'drop-shadow(0 0 4px rgba(52, 199, 89, 0.2))'
              }}
            >
              <circle
                cx="24"
                cy="24"
                r="20"
                fill="none"
                stroke="#E5E5E5"
                strokeWidth="3"
              />
              <circle
                cx="24"
                cy="24"
                r="20"
                fill="none"
                stroke={progressColor}
                strokeWidth="3"
                strokeDasharray={2 * Math.PI * 20}
                strokeDashoffset={2 * Math.PI * 20 * (1 - progressPercentage / 100)}
                strokeLinecap="round"
              />
            </svg>
            <div 
              className="absolute inset-0 flex items-center justify-center"
              style={{ 
                fontSize: '12px',
                fontWeight: 600,
                color: progressColor
              }}
            >
              {Math.round(progressPercentage)}%
            </div>
          </div>
        ) : (
          <div 
            className="w-9 h-9 rounded-full"
            style={{ 
              border: '2px solid #E5E5E5',
              backgroundColor: 'transparent'
            }}
          />
        )}
      </div>

      {/* Chevron indicator */}
      <div className="ml-2 flex items-center">
        <ChevronRight 
          className="w-5 h-5" 
          style={{ 
            color: '#C7C7CC',
            opacity: isFullyCompleted ? 0.4 : 1
          }}
          strokeWidth={2}
        />
      </div>
    </button>
  );
}