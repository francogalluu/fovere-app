import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { TopBar } from '../components/TopBar';

export default function MeasureBy() {
  const [selectedTab, setSelectedTab] = useState<'time' | 'count' | 'custom'>('time');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(30);

  const formatTimeDisplay = () => {
    const parts = [];
    if (hours > 0) parts.push(`${hours} hr`);
    if (minutes > 0) parts.push(`${minutes} min`);
    return parts.length > 0 ? parts.join(' ') : '0 min';
  };

  const handleDone = () => {
    setShowTimePicker(false);
  };

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
        title="Measure By"
      />

      <div className="px-6 pt-6">
        {/* Segmented Navigator */}
        <div 
          className="flex rounded-xl p-1 mb-8"
          style={{ backgroundColor: '#F0F0F5' }}
        >
          {(['time', 'count', 'custom'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className="flex-1 py-2.5 rounded-lg transition-all"
              style={{
                backgroundColor: selectedTab === tab ? '#fff' : 'transparent',
                color: selectedTab === tab ? '#008080' : '#8E8E93',
                fontSize: '15px',
                fontWeight: 500,
                border: 'none',
                cursor: 'pointer',
                boxShadow: selectedTab === tab ? '0 1px 3px rgba(0, 0, 0, 0.08)' : 'none',
                textTransform: 'capitalize'
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content Area - Time Tab */}
        {selectedTab === 'time' && (
          <div>
            <div className="mb-6">
              <h2 
                style={{ 
                  fontSize: '24px',
                  fontWeight: 600,
                  color: '#1A1A1A',
                  marginBottom: '8px'
                }}
              >
                Time
              </h2>
              <p 
                style={{ 
                  fontSize: '15px',
                  color: '#8E8E93',
                  lineHeight: 1.5
                }}
              >
                Track duration in minutes or hours.
              </p>
            </div>

            {/* Target Time Row */}
            <div 
              className="rounded-2xl overflow-hidden"
              style={{ backgroundColor: '#fff' }}
            >
              <button
                onClick={() => setShowTimePicker(true)}
                className="w-full flex items-center justify-between px-5 py-4"
                style={{
                  backgroundColor: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <span style={{ fontSize: '17px', fontWeight: 400, color: '#1A1A1A' }}>
                  Target Time
                </span>
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: '17px', fontWeight: 400, color: '#8E8E93' }}>
                    {formatTimeDisplay()}
                  </span>
                  <ChevronRight className="w-5 h-5" style={{ color: '#C7C7CC' }} strokeWidth={2} />
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Content Area - Count Tab */}
        {selectedTab === 'count' && (
          <div>
            <div className="mb-6">
              <h2 
                style={{ 
                  fontSize: '24px',
                  fontWeight: 600,
                  color: '#1A1A1A',
                  marginBottom: '8px'
                }}
              >
                Count
              </h2>
              <p 
                style={{ 
                  fontSize: '15px',
                  color: '#8E8E93',
                  lineHeight: 1.5
                }}
              >
                Track number of completions.
              </p>
            </div>

            {/* Target Count Input */}
            <div className="mb-6">
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
                Target Count
              </div>
              <div 
                className="rounded-2xl p-4 flex items-center"
                style={{ backgroundColor: '#fff' }}
              >
                <input
                  type="number"
                  defaultValue={8}
                  className="flex-1 bg-transparent border-none outline-none"
                  style={{
                    fontSize: '17px',
                    fontWeight: 500,
                    color: '#1A1A1A'
                  }}
                />
              </div>
            </div>

            {/* Example */}
            <div 
              className="rounded-2xl p-4"
              style={{ backgroundColor: '#fff' }}
            >
              <div 
                style={{ 
                  fontSize: '14px',
                  color: '#8E8E93',
                  lineHeight: 1.5
                }}
              >
                Example: 8 glasses per day
              </div>
            </div>
          </div>
        )}

        {/* Content Area - Custom Tab */}
        {selectedTab === 'custom' && (
          <div>
            <div className="mb-6">
              <h2 
                style={{ 
                  fontSize: '24px',
                  fontWeight: 600,
                  color: '#1A1A1A',
                  marginBottom: '8px'
                }}
              >
                Custom
              </h2>
              <p 
                style={{ 
                  fontSize: '15px',
                  color: '#8E8E93',
                  lineHeight: 1.5
                }}
              >
                Define your own measurement unit.
              </p>
            </div>

            {/* Unit Name Input */}
            <div className="mb-4">
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
                Unit Name
              </div>
              <div 
                className="rounded-2xl p-4"
                style={{ backgroundColor: '#fff' }}
              >
                <input
                  type="text"
                  placeholder="e.g. pages, reps, sessions"
                  className="w-full bg-transparent border-none outline-none"
                  style={{
                    fontSize: '17px',
                    fontWeight: 400,
                    color: '#1A1A1A'
                  }}
                />
              </div>
            </div>

            {/* Numeric Target Input */}
            <div className="mb-6">
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
                Target
              </div>
              <div 
                className="rounded-2xl p-4 flex items-center"
                style={{ backgroundColor: '#fff' }}
              >
                <input
                  type="number"
                  defaultValue={20}
                  className="flex-1 bg-transparent border-none outline-none"
                  style={{
                    fontSize: '17px',
                    fontWeight: 500,
                    color: '#1A1A1A'
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Time Picker Modal */}
      {showTimePicker && (
        <>
          {/* Backdrop */}
          <div 
            onClick={() => setShowTimePicker(false)}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              zIndex: 50
            }}
          />

          {/* Modal Sheet */}
          <div 
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: '#F2F2F7',
              borderTopLeftRadius: '20px',
              borderTopRightRadius: '20px',
              paddingBottom: 'env(safe-area-inset-bottom)',
              zIndex: 51,
              maxWidth: '430px',
              margin: '0 auto'
            }}
          >
            {/* Header */}
            <div 
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: '0.5px solid #E5E5EA' }}
            >
              <div style={{ width: '60px' }} />
              <h3 style={{ fontSize: '17px', fontWeight: 600, color: '#1A1A1A' }}>
                Target Time
              </h3>
              <button
                onClick={handleDone}
                style={{
                  fontSize: '17px',
                  fontWeight: 500,
                  color: '#008080',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                Done
              </button>
            </div>

            {/* Picker */}
            <div className="flex items-center justify-center py-6">
              {/* Hours Column */}
              <div className="flex flex-col items-center" style={{ width: '100px' }}>
                <div 
                  style={{
                    height: '180px',
                    overflow: 'auto',
                    position: 'relative',
                    maskImage: 'linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)',
                    WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)'
                  }}
                >
                  <div style={{ paddingTop: '70px', paddingBottom: '70px' }}>
                    {Array.from({ length: 24 }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => setHours(i)}
                        style={{
                          width: '100%',
                          height: '40px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: hours === i ? '22px' : '17px',
                          fontWeight: hours === i ? 600 : 400,
                          color: hours === i ? '#1A1A1A' : '#8E8E93',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        {i}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ fontSize: '17px', color: '#8E8E93', marginTop: '8px' }}>
                  hr
                </div>
              </div>

              {/* Minutes Column */}
              <div className="flex flex-col items-center" style={{ width: '100px' }}>
                <div 
                  style={{
                    height: '180px',
                    overflow: 'auto',
                    position: 'relative',
                    maskImage: 'linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)',
                    WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)'
                  }}
                >
                  <div style={{ paddingTop: '70px', paddingBottom: '70px' }}>
                    {Array.from({ length: 60 }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => setMinutes(i)}
                        style={{
                          width: '100%',
                          height: '40px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: minutes === i ? '22px' : '17px',
                          fontWeight: minutes === i ? 600 : 400,
                          color: minutes === i ? '#1A1A1A' : '#8E8E93',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        {i}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ fontSize: '17px', color: '#8E8E93', marginTop: '8px' }}>
                  min
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}