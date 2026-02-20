import { useState } from 'react';
import { Check } from 'lucide-react';
import { TopBar } from '../components/TopBar';

type FrequencyOption = 'daily' | 'weekly' | 'monthly';

export default function Frequency() {
  const [selected, setSelected] = useState<FrequencyOption>('daily');

  const options: { id: FrequencyOption; label: string }[] = [
    { id: 'daily', label: 'Daily goal' },
    { id: 'weekly', label: 'Weekly goal' },
    { id: 'monthly', label: 'Monthly goal' },
  ];

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

      <TopBar 
        leftAction="back"
        title="Frequency"
      />

      {/* Main Content */}
      <div className="px-6 pt-6">
        {/* Section Label */}
        <div 
          style={{ 
            fontSize: '13px',
            fontWeight: 500,
            color: '#8E8E93',
            marginBottom: '8px',
            textTransform: 'uppercase',
            letterSpacing: '0.02em'
          }}
        >
          Period
        </div>

        {/* Options Container */}
        <div 
          className="rounded-2xl overflow-hidden"
          style={{ backgroundColor: '#fff' }}
        >
          {options.map((option, index) => (
            <div key={option.id}>
              <button
                onClick={() => setSelected(option.id)}
                className="w-full flex items-center justify-between px-5 py-4"
                style={{
                  backgroundColor: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <span 
                  style={{ 
                    fontSize: '17px',
                    fontWeight: 400,
                    color: selected === option.id ? '#1A1A1A' : '#666'
                  }}
                >
                  {option.label}
                </span>
                {selected === option.id && (
                  <Check 
                    className="w-5 h-5" 
                    style={{ color: '#008080' }}
                    strokeWidth={2.5}
                  />
                )}
              </button>
              {/* Divider - Don't show after last item */}
              {index < options.length - 1 && (
                <div 
                  style={{ 
                    height: '0.5px',
                    backgroundColor: '#E5E5EA',
                    marginLeft: '20px'
                  }} 
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}