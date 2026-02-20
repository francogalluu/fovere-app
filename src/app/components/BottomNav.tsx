import { Home, Calendar, Settings, BarChart3 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 border-t"
      style={{ 
        backgroundColor: '#FAFAFA',
        borderColor: 'rgba(0, 0, 0, 0.08)',
        paddingBottom: 'env(safe-area-inset-bottom, 20px)',
        maxWidth: '430px',
        margin: '0 auto'
      }}
    >
      <div className="flex items-center justify-around px-4 pt-2 pb-1">
        <button 
          onClick={() => navigate('/')}
          className="flex flex-col items-center gap-1 py-2 px-4"
          style={{ color: isActive('/') ? '#008080' : '#999' }}
        >
          <Home className="w-6 h-6" strokeWidth={2} />
          <span style={{ fontSize: '11px', fontWeight: 500 }}>Home</span>
        </button>
        
        <button 
          onClick={() => navigate('/calendar')}
          className="flex flex-col items-center gap-1 py-2 px-4"
          style={{ color: isActive('/calendar') ? '#008080' : '#999' }}
        >
          <Calendar className="w-6 h-6" strokeWidth={2} />
          <span style={{ fontSize: '11px', fontWeight: 500 }}>Calendar</span>
        </button>
        
        <button 
          onClick={() => navigate('/analytics')}
          className="flex flex-col items-center gap-1 py-2 px-4"
          style={{ color: isActive('/analytics') ? '#008080' : '#999' }}
        >
          <BarChart3 className="w-6 h-6" strokeWidth={2} />
          <span style={{ fontSize: '11px', fontWeight: 500 }}>Analytics</span>
        </button>
        
        <button 
          onClick={() => navigate('/settings')}
          className="flex flex-col items-center gap-1 py-2 px-4"
          style={{ color: isActive('/settings') ? '#008080' : '#999' }}
        >
          <Settings className="w-6 h-6" strokeWidth={2} />
          <span style={{ fontSize: '11px', fontWeight: 500 }}>Settings</span>
        </button>
      </div>
    </div>
  );
}