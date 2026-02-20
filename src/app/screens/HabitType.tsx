import { useState } from 'react';
import { Check } from 'lucide-react';
import { TopBar } from '../components/TopBar';

export default function HabitType() {
  const [selected, setSelected] = useState<'build' | 'break'>('build');

  return (
    <div 
      className="min-h-screen"
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

      <TopBar 
        leftAction="back"
        title="Habit Type"
      />

      <div className="px-4 pt-8">
        <button
          onClick={() => setSelected('build')}
          className="w-full p-6 rounded-2xl mb-4 relative"
          style={{
            backgroundColor: '#fff',
            border: selected === 'build' ? '2px solid #008080' : '2px solid transparent'
          }}
        >
          <div className="text-4xl mb-3">✨</div>
          <h3 
            style={{ 
              fontSize: '20px',
              fontWeight: 600,
              color: '#1A1A1A',
              marginBottom: '4px'
            }}
          >
            Build a Habit
          </h3>
          <p 
            style={{ 
              fontSize: '15px',
              color: '#666',
              lineHeight: '1.4'
            }}
          >
            Create a new positive habit to improve your daily routine
          </p>
          {selected === 'build' && (
            <div 
              className="absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center"
              style={{ backgroundColor: '#008080' }}
            >
              <Check className="w-4 h-4 text-white" strokeWidth={3} />
            </div>
          )}
        </button>

        <button
          onClick={() => setSelected('break')}
          className="w-full p-6 rounded-2xl relative"
          style={{
            backgroundColor: '#fff',
            border: selected === 'break' ? '2px solid #008080' : '2px solid transparent'
          }}
        >
          <div className="text-4xl mb-3">🚫</div>
          <h3 
            style={{ 
              fontSize: '20px',
              fontWeight: 600,
              color: '#1A1A1A',
              marginBottom: '4px'
            }}
          >
            Break a Habit
          </h3>
          <p 
            style={{ 
              fontSize: '15px',
              color: '#666',
              lineHeight: '1.4'
            }}
          >
            Track and reduce unwanted behaviors
          </p>
          {selected === 'break' && (
            <div 
              className="absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center"
              style={{ backgroundColor: '#008080' }}
            >
              <Check className="w-4 h-4 text-white" strokeWidth={3} />
            </div>
          )}
        </button>
      </div>
    </div>
  );
}
