import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { TopBar } from '../components/TopBar';

export default function Target() {
  const location = useLocation();
  const habitType = (location.state as { habitType?: 'build' | 'break' })?.habitType || 'build';
  const title = habitType === 'build' ? 'Target' : 'Limit';
  
  const [value, setValue] = useState('30');
  const [unit, setUnit] = useState('minutes');

  const units = ['minutes', 'hours', 'times', 'glasses', 'pages'];

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
        title={title}
      />

      <div className="px-4 pt-8">
        {/* Value Input */}
        <div 
          className="rounded-2xl overflow-hidden mb-6"
          style={{ backgroundColor: '#fff' }}
        >
          <div className="px-4 py-3">
            <label 
              className="block mb-2"
              style={{ fontSize: '13px', color: '#6D6D72' }}
            >
              Value
            </label>
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full outline-none"
              style={{
                fontSize: '34px',
                fontWeight: 600,
                color: '#1A1A1A'
              }}
            />
          </div>
        </div>

        {/* Unit Selector */}
        <div 
          className="rounded-2xl overflow-hidden"
          style={{ backgroundColor: '#fff' }}
        >
          {units.map((u, idx) => (
            <button
              key={u}
              onClick={() => setUnit(u)}
              className="w-full flex items-center justify-between px-4 py-4"
              style={{
                borderBottom: idx < units.length - 1 ? '1px solid rgba(0, 0, 0, 0.06)' : 'none',
                backgroundColor: unit === u ? '#F2F2F7' : 'transparent'
              }}
            >
              <span style={{ fontSize: '17px', color: '#1A1A1A' }}>
                {u}
              </span>
              {unit === u && (
                <div 
                  className="w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: '#008080' }}
                >
                  <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                    <path d="M1 5L4 8L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}