import { BottomNav } from '../components/BottomNav';
import { SettingSection } from '../components/SettingSection';
import { SettingRow } from '../components/SettingRow';

export default function Settings() {
  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{ 
        backgroundColor: '#F2F2F7',
        maxWidth: '430px',
        margin: '0 auto',
        position: 'relative'
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

      {/* Header */}
      <div className="px-6 pt-4 pb-6">
        <h1 
          style={{ 
            fontSize: '34px',
            fontWeight: 700,
            color: '#1A1A1A',
            letterSpacing: '-0.02em'
          }}
        >
          Settings
        </h1>
      </div>

      {/* Settings Content */}
      <div className="flex-1 pb-32">
        <SettingSection title="Preferences">
          <SettingRow label="Notifications" chevron={true} />
          <SettingRow label="Appearance" value="Light" />
          <SettingRow label="Week Starts On" value="Monday" />
        </SettingSection>

        <SettingSection title="Data">
          <SettingRow label="Export Data" chevron={true} />
          <SettingRow label="Backup" chevron={true} />
        </SettingSection>

        <SettingSection title="About">
          <SettingRow label="Version" value="1.0.0" chevron={false} />
          <SettingRow label="Privacy Policy" chevron={true} />
          <SettingRow label="Terms of Service" chevron={true} />
        </SettingSection>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
