import { useState } from 'react';
import { TopBar } from '../components/TopBar';

export default function HabitName() {
  const [name, setName] = useState('Morning Run');

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
        title="Habit Name"
      />

      <div className="px-4 pt-8">
        <div 
          className="rounded-2xl overflow-hidden"
          style={{ backgroundColor: '#fff' }}
        >
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter habit name"
            autoFocus
            className="w-full px-4 py-4 outline-none"
            style={{
              fontSize: '17px',
              color: '#1A1A1A',
              backgroundColor: 'transparent'
            }}
          />
        </div>
      </div>
    </div>
  );
}
