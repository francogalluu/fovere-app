import { ChevronLeft, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type TopBarProps = {
  leftAction?: 'back' | 'cancel';
  title: string;
  rightAction?: 'save';
  onLeftClick?: () => void;
  onRightClick?: () => void;
};

export function TopBar({ leftAction, title, rightAction, onLeftClick, onRightClick }: TopBarProps) {
  const navigate = useNavigate();

  const handleLeftClick = () => {
    if (onLeftClick) {
      onLeftClick();
    } else {
      navigate(-1);
    }
  };

  return (
    <div 
      className="flex items-center justify-between px-4 h-11"
      style={{ borderBottom: '1px solid rgba(0, 0, 0, 0.08)' }}
    >
      <button
        onClick={handleLeftClick}
        className="flex items-center gap-1 py-2 min-w-[60px]"
        style={{ color: '#008080', fontSize: '17px' }}
      >
        {leftAction === 'back' && <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />}
        {leftAction === 'back' && 'Back'}
        {leftAction === 'cancel' && 'Cancel'}
      </button>

      <h2 
        className="absolute left-1/2 -translate-x-1/2"
        style={{ 
          fontSize: '17px',
          fontWeight: 600,
          color: '#1A1A1A'
        }}
      >
        {title}
      </h2>

      {rightAction === 'save' ? (
        <button
          onClick={onRightClick}
          className="py-2 min-w-[60px] flex items-center justify-end"
        >
          <Check className="w-6 h-6" strokeWidth={2.5} style={{ color: '#008080' }} />
        </button>
      ) : (
        <div className="min-w-[60px]" />
      )}
    </div>
  );
}