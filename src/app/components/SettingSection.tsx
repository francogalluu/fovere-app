type SettingSectionProps = {
  title?: string;
  children: React.ReactNode;
};

export function SettingSection({ title, children }: SettingSectionProps) {
  return (
    <div className="mb-8">
      {title && (
        <div 
          className="px-4 mb-2"
          style={{ 
            fontSize: '13px',
            color: '#6D6D72',
            textTransform: 'uppercase',
            letterSpacing: '0.02em'
          }}
        >
          {title}
        </div>
      )}
      <div 
        className="mx-4 overflow-hidden"
        style={{ 
          borderRadius: '16px',
          backgroundColor: '#fff'
        }}
      >
        {children}
      </div>
    </div>
  );
}
