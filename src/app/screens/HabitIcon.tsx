import { useState } from 'react';
import { TopBar } from '../components/TopBar';

const icons = [
  '🏃', '💧', '📚', '🧘', '🥗', '💤',
  '🏋️', '🚴', '🎨', '🎵', '✍️', '🌱',
  '☕', '🎯', '💪', '🌟', '❤️', '🧠',
  '🍎', '🌞', '🌙', '⚡', '🔥', '🎓'
];

export default function HabitIcon() {
  const [selected, setSelected] = useState('🏃');

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
        title="Choose Icon"
      />

      <div className="px-4 pt-8">
        <div className="grid grid-cols-6 gap-3">
          {icons.map((icon) => (
            <button
              key={icon}
              onClick={() => setSelected(icon)}
              className="aspect-square rounded-2xl flex items-center justify-center text-3xl"
              style={{
                backgroundColor: '#fff',
                border: selected === icon ? '2px solid #008080' : '2px solid transparent'
              }}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
