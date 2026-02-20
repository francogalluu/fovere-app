import { useState } from 'react';
import { TopBar } from '../components/TopBar';

export default function Reminder() {
  const [hour, setHour] = useState(6);
  const [minute, setMinute] = useState(30);
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM');

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
        title="Reminder Time"
      />

      <div className="px-4 pt-8 flex items-center justify-center" style={{ minHeight: '50vh' }}>
        <div 
          className="rounded-2xl p-8"
          style={{ backgroundColor: '#fff' }}
        >
          <div className="flex items-center justify-center gap-2">
            <input
              type="number"
              value={hour}
              onChange={(e) => setHour(Math.min(12, Math.max(1, parseInt(e.target.value) || 1)))}
              className="w-20 text-center outline-none"
              min="1"
              max="12"
              style={{
                fontSize: '48px',
                fontWeight: 300,
                color: '#1A1A1A'
              }}
            />
            <span style={{ fontSize: '48px', fontWeight: 300, color: '#1A1A1A' }}>:</span>
            <input
              type="number"
              value={minute.toString().padStart(2, '0')}
              onChange={(e) => setMinute(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
              className="w-20 text-center outline-none"
              min="0"
              max="59"
              style={{
                fontSize: '48px',
                fontWeight: 300,
                color: '#1A1A1A'
              }}
            />
            <div className="ml-2 flex flex-col gap-1">
              <button
                onClick={() => setPeriod('AM')}
                className="px-3 py-1 rounded-lg"
                style={{
                  fontSize: '17px',
                  fontWeight: 600,
                  backgroundColor: period === 'AM' ? '#008080' : '#E5E5EA',
                  color: period === 'AM' ? '#fff' : '#666'
                }}
              >
                AM
              </button>
              <button
                onClick={() => setPeriod('PM')}
                className="px-3 py-1 rounded-lg"
                style={{
                  fontSize: '17px',
                  fontWeight: 600,
                  backgroundColor: period === 'PM' ? '#008080' : '#E5E5EA',
                  color: period === 'PM' ? '#fff' : '#666'
                }}
              >
                PM
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
