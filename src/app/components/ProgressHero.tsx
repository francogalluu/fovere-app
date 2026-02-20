import { getProgressColor } from '../utils/progressColors';

interface ProgressHeroProps {
  selectedDate?: Date;
}

export function ProgressHero({ selectedDate }: ProgressHeroProps = {}) {
  const percentage = 72;
  const completed = 4;
  const total = 5;
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const progressColor = getProgressColor(percentage);

  // Dynamic title based on selected date
  const today = new Date(2026, 1, 13); // Friday, Feb 13, 2026
  const getTitle = () => {
    if (!selectedDate) return 'Completed Today';
    
    const isToday = selectedDate.toDateString() === today.toDateString();
    if (isToday) return 'Completed Today';
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = selectedDate.toDateString() === yesterday.toDateString();
    if (isYesterday) return 'Yesterday';
    
    // Format as "Feb 11" for other dates
    return selectedDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

return (
  <div 
    className="mx-4 py-6 px-6 rounded-3xl relative"
    style={{ 
      background: 'rgba(255, 255, 255, 0.6)',          // semi-transparent glass base
      backdropFilter: 'blur(24px)',                    // glass blur
      WebkitBackdropFilter: 'blur(24px)',              // Safari support
      border: '1px solid rgba(255, 255, 255, 0.5)',    // soft light edge
      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.08)',    // floating depth
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
          {getTitle()}
        </div>
        <div 
          style={{ 
            fontSize: '17px',
            color: '#8E8E93',
            fontWeight: 400,
            lineHeight: '22px'
          }}
        >
          {completed} of {total} habits<br />completed
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
              r={radius}
              fill="none"
              stroke="#E5E5E7"
              strokeWidth="14"
            />
            {/* Progress circle */}
            <circle
              cx="65"
              cy="65"
              r={radius}
              fill="none"
              stroke={progressColor}
              strokeWidth="14"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
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
            {percentage}%
          </div>
        </div>
      </div>
    </div>
  );
}