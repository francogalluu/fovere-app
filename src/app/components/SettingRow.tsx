import { ChevronRight } from 'lucide-react';

type SettingRowProps = {
  label: string;
  value?: string;
  chevron?: boolean;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (value: boolean) => void;
  onClick?: () => void;
};

export function SettingRow({ 
  label, 
  value, 
  chevron = true, 
  toggle = false,
  toggleValue = false,
  onToggle,
  onClick 
}: SettingRowProps) {
  return (
    <button
      onClick={onClick}
      disabled={toggle}
      className="w-full flex items-center justify-between py-3 px-4"
      style={{
        backgroundColor: '#fff',
        borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
        textAlign: 'left'
      }}
    >
      <span 
        style={{ 
          fontSize: '17px',
          color: '#1A1A1A'
        }}
      >
        {label}
      </span>

      <div className="flex items-center gap-2">
        {value && (
          <span 
            style={{ 
              fontSize: '17px',
              color: '#999'
            }}
          >
            {value}
          </span>
        )}

        {toggle && (
          <div 
            onClick={(e) => {
              e.stopPropagation();
              onToggle?.(!toggleValue);
            }}
            className="relative inline-block w-12 h-7 cursor-pointer"
          >
            <div 
              className="absolute inset-0 rounded-full transition-colors duration-200"
              style={{ 
                backgroundColor: toggleValue ? '#008080' : '#E5E5EA'
              }}
            />
            <div 
              className="absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform duration-200 shadow"
              style={{
                transform: toggleValue ? 'translateX(20px)' : 'translateX(0)'
              }}
            />
          </div>
        )}

        {chevron && !toggle && (
          <ChevronRight className="w-5 h-5" style={{ color: '#C7C7CC' }} strokeWidth={2.5} />
        )}
      </div>
    </button>
  );
}
