import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TopBar } from '../components/TopBar';
import { SettingSection } from '../components/SettingSection';
import { SettingRow } from '../components/SettingRow';

// Mock habit data
const habitData: Record<string, any> = {
  '1': { icon: '🏃', name: 'Morning Run', type: 'Build a Habit', frequency: 'Daily', measureType: 'Time', target: 30, unit: 'minutes' },
  '2': { icon: '💧', name: 'Drink Water', type: 'Build a Habit', frequency: 'Daily', measureType: 'Count', target: 8, unit: 'glasses' },
  '3': { icon: '📚', name: 'Read', type: 'Build a Habit', frequency: 'Daily', measureType: 'Time', target: 30, unit: 'minutes' },
  '4': { icon: '🧘', name: 'Yoga Class', type: 'Build a Habit', frequency: 'Weekly', measureType: 'Count', target: 3, unit: 'times' },
};

export default function NewHabit() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  
  // If editing, load habit data
  const existingHabit = isEditMode ? habitData[id] : null;
  
  const [habitType, setHabitType] = useState<'build' | 'break'>('build');
  const [reminderOn, setReminderOn] = useState(false);

  const handleSave = () => {
    // Save habit logic here
    navigate('/');
  };

  const handleCancel = () => {
    if (isEditMode) {
      navigate(`/habit/${id}`);
    } else {
      navigate('/');
    }
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
        leftAction="cancel"
        title={isEditMode ? "Edit Habit" : "New Habit"}
        rightAction="save"
        onLeftClick={handleCancel}
        onRightClick={handleSave}
      />

      {/* Segmented Control - Build/Break */}
      <div className="px-6 pt-6 pb-4">
        <div 
          className="flex rounded-xl p-1"
          style={{ backgroundColor: '#E5E5EA' }}
        >
          <button
            onClick={() => setHabitType('build')}
            className="flex-1 py-2.5 rounded-lg transition-all"
            style={{
              backgroundColor: habitType === 'build' ? '#008080' : 'transparent',
              color: habitType === 'build' ? '#FFFFFF' : '#3C3C43',
              fontSize: '15px',
              fontWeight: habitType === 'build' ? 600 : 400,
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Build a Habit
          </button>
          <button
            onClick={() => setHabitType('break')}
            className="flex-1 py-2.5 rounded-lg transition-all"
            style={{
              backgroundColor: habitType === 'break' ? '#008080' : 'transparent',
              color: habitType === 'break' ? '#FFFFFF' : '#3C3C43',
              fontSize: '15px',
              fontWeight: habitType === 'break' ? 600 : 400,
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Break a Habit
          </button>
        </div>
      </div>

      <div className="pt-2">
        {/* Section 1: Habit Name & Icon */}
        <SettingSection>
          <SettingRow 
            label="Habit Name"
            value={existingHabit?.name || "Morning Run"}
            onClick={() => navigate('/new-habit/name')}
          />
          <SettingRow 
            label="Icon"
            value={existingHabit?.icon || "🏃"}
            onClick={() => navigate('/new-habit/icon')}
          />
        </SettingSection>

        {/* Section 2: Frequency & Measure By */}
        <SettingSection>
          <SettingRow 
            label="Frequency"
            value={existingHabit?.frequency || "Daily"}
            onClick={() => navigate('/new-habit/frequency')}
          />
          <SettingRow 
            label="Measure By"
            value={existingHabit?.measureType || "Time"}
            onClick={() => navigate('/new-habit/measure')}
          />
        </SettingSection>

        {/* Section 3: Reminder */}
        <SettingSection>
          <SettingRow 
            label="Reminder"
            toggle={true}
            toggleValue={reminderOn}
            onToggle={setReminderOn}
          />
          {reminderOn && (
            <SettingRow 
              label="Time"
              value="6:30 AM"
              onClick={() => navigate('/new-habit/reminder')}
            />
          )}
        </SettingSection>
      </div>
    </div>
  );
}