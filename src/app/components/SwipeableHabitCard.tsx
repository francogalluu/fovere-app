import { useState, useRef, useEffect } from 'react';
import { HabitCard } from './HabitCard';

type SwipeableHabitCardProps = {
  id: number;
  icon: string;
  name: string;
  current: number;
  target: number;
  unit: string;
  onClick?: () => void;
  onComplete?: (id: number) => void;
  isCompleted?: boolean;
};

export function SwipeableHabitCard({ 
  id, 
  icon, 
  name, 
  current, 
  target, 
  unit, 
  onClick, 
  onComplete,
  isCompleted = false 
}: SwipeableHabitCardProps) {
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const SWIPE_THRESHOLD = -80;
  const MAX_SWIPE = -100;

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX;
    
    // Only allow left swipe
    if (diff < 0) {
      const newTranslate = Math.max(MAX_SWIPE, diff);
      setTranslateX(newTranslate);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    
    // Snap to open or closed position
    if (translateX < SWIPE_THRESHOLD) {
      setTranslateX(MAX_SWIPE);
    } else {
      setTranslateX(0);
    }
  };

  const handleComplete = () => {
    onComplete?.(id);
    setTranslateX(0);
  };

  const handleCardClick = () => {
    if (translateX === 0 && !isDragging) {
      onClick?.();
    }
  };

  // Close swipe when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setTranslateX(0);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  return (
    <div 
      ref={cardRef}
      className="relative mb-3"
      style={{ 
        touchAction: 'pan-y'
      }}
    >
      {/* Complete Button (Background) */}
      <div 
        className="absolute right-0 top-0 bottom-0 flex items-center justify-end pr-4"
        style={{
          width: '100px',
          opacity: translateX < -20 ? 1 : 0,
          transition: 'opacity 0.2s ease'
        }}
      >
        <button
          onClick={handleComplete}
          className="h-full rounded-2xl flex items-center justify-center"
          style={{
            backgroundColor: '#34C759',
            width: '90px',
            fontWeight: 600,
            fontSize: '15px',
            color: '#FFFFFF',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Complete
        </button>
      </div>

      {/* Habit Card (Foreground) */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          opacity: isCompleted ? 0.6 : 1,
          pointerEvents: translateX !== 0 ? 'none' : 'auto'
        }}
      >
        <div onClick={handleCardClick}>
          <HabitCard
            icon={icon}
            name={name}
            current={isCompleted ? target : current}
            target={target}
            unit={unit}
          />
        </div>
      </div>
    </div>
  );
}