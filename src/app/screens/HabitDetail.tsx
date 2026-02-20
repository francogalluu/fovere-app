import { useState } from 'react';
import { ChevronLeft, Minus, Plus } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

// Mock habit data
const habitData: Record<string, any> = {
  '1': { icon: '🏃', name: 'Morning Run', current: 15, target: 30, unit: 'min', frequency: 'Daily', measureType: 'Time' },
  '2': { icon: '💧', name: 'Drink Water', current: 5, target: 8, unit: 'glasses', frequency: 'Daily', measureType: 'Count' },
  '3': { icon: '📚', name: 'Read', current: 20, target: 30, unit: 'min', frequency: 'Daily', measureType: 'Time' },
  '4': { icon: '🧘', name: 'Yoga Class', current: 2, target: 3, unit: 'times', frequency: 'Weekly', measureType: 'Count' },
};

export default function HabitDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const habit = habitData[id || '1'];

  const [current, setCurrent] = useState(habit.current);

  const progressPercentage = (current / habit.target) * 100;
  const circumference = 2 * Math.PI * 80;

  const handleIncrement = () => {
    if (current < habit.target) {
      setCurrent(current + 1);
    }
  };

  const handleDecrement = () => {
    if (current > 0) {
      setCurrent(current - 1);
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{ 
        backgroundColor: '#F2F2F7',
        maxWidth: '430px',
        margin: '0 auto'
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

      {/* Top Bar */}
      <div 
        className="flex items-center justify-between px-4 h-11"
        style={{ borderBottom: '1px solid rgba(0, 0, 0, 0.08)' }}
      >
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1 py-2"
          style={{ color: '#008080', fontSize: '17px' }}
        >
          <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
          Back
        </button>

        <h2 
          className="absolute left-1/2 -translate-x-1/2"
          style={{ 
            fontSize: '17px',
            fontWeight: 600,
            color: '#1A1A1A'
          }}
        >
          {habit.name}
        </h2>

        <button
          onClick={() => navigate(`/edit-habit/${id}`)}
          className="py-2"
          style={{ color: '#008080', fontSize: '17px' }}
        >
          Edit
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center pt-8 pb-8">
        {/* Large Progress Ring */}
        <div className="relative mb-3">
          <svg width="220" height="220" viewBox="0 0 220 220" style={{ transform: 'rotate(-90deg)' }}>
            <circle
              cx="110"
              cy="110"
              r="80"
              fill="none"
              stroke="#E5E5E5"
              strokeWidth="12"
            />
            <circle
              cx="110"
              cy="110"
              r="80"
              fill="none"
              stroke="#008080"
              strokeWidth="12"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progressPercentage / 100)}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.3s ease' }}
            />
          </svg>
          
          {/* Progress Text */}
          <div 
            className="absolute inset-0 flex flex-col items-center justify-center"
          >
            <div style={{ fontSize: '48px', fontWeight: 300, color: '#1A1A1A', lineHeight: 1 }}>
              {current}<span style={{ fontSize: '32px', color: '#999' }}>/{habit.target}</span>
            </div>
            <div style={{ fontSize: '15px', color: '#999', marginTop: '4px' }}>
              {habit.unit}
            </div>
          </div>
        </div>

        <div 
          style={{ 
            fontSize: '17px',
            color: '#666',
            marginBottom: '24px'
          }}
        >
          Today's Goal
        </div>

        {/* Plus/Minus Controls */}
        <div className="flex items-center justify-center gap-6 mb-8">
          <button
            onClick={handleDecrement}
            disabled={current === 0}
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ 
              backgroundColor: '#fff',
              opacity: current === 0 ? 0.3 : 1
            }}
          >
            <Minus className="w-6 h-6" style={{ color: '#008080' }} strokeWidth={2.5} />
          </button>

          <div 
            style={{ 
              fontSize: '56px',
              fontWeight: 300,
              color: '#1A1A1A',
              minWidth: '90px',
              textAlign: 'center'
            }}
          >
            {current}
          </div>

          <button
            onClick={handleIncrement}
            disabled={current === habit.target}
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ 
              backgroundColor: '#008080',
              opacity: current === habit.target ? 0.3 : 1
            }}
          >
            <Plus className="w-6 h-6 text-white" strokeWidth={2.5} />
          </button>
        </div>

        {/* Info Section */}
        <div className="w-full px-4 space-y-3 mb-8">
          <div 
            className="flex items-center justify-between p-4 rounded-2xl"
            style={{ backgroundColor: '#fff' }}
          >
            <span style={{ fontSize: '17px', color: '#666' }}>Frequency</span>
            <span style={{ fontSize: '17px', color: '#1A1A1A', fontWeight: 500 }}>{habit.frequency}</span>
          </div>

          <div 
            className="flex items-center justify-between p-4 rounded-2xl"
            style={{ backgroundColor: '#fff' }}
          >
            <span style={{ fontSize: '17px', color: '#666' }}>Measurement</span>
            <span style={{ fontSize: '17px', color: '#1A1A1A', fontWeight: 500 }}>{habit.measureType}</span>
          </div>

          <div 
            className="flex items-center justify-between p-4 rounded-2xl"
            style={{ backgroundColor: '#fff' }}
          >
            <span style={{ fontSize: '17px', color: '#666' }}>Target</span>
            <span style={{ fontSize: '17px', color: '#1A1A1A', fontWeight: 500 }}>{habit.target} {habit.unit}</span>
          </div>
        </div>

        {/* Delete Button */}
        <button
          className="w-full px-4"
          style={{ marginTop: 'auto' }}
        >
          <div 
            className="py-4 rounded-2xl"
            style={{ backgroundColor: '#fff' }}
          >
            <span style={{ fontSize: '17px', color: '#FF3B30' }}>Delete Habit</span>
          </div>
        </button>
      </div>
    </div>
  );
}