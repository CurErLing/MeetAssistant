
import React, { useState, useRef } from 'react';
import { useClickOutside } from '../../hooks/useClickOutside';

interface DropdownProps {
  trigger: (isOpen: boolean) => React.ReactNode;
  content: (close: () => void) => React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
  isOpen?: boolean; // 可选：受控模式
  onToggle?: (isOpen: boolean) => void; // 可选：受控模式回调
}

export const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  content,
  align = 'right',
  className = '',
  isOpen: controlledIsOpen,
  onToggle
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const isControlled = controlledIsOpen !== undefined;
  const show = isControlled ? controlledIsOpen : internalIsOpen;

  const handleToggle = (nextState: boolean) => {
    if (isControlled && onToggle) {
      onToggle(nextState);
    } else {
      setInternalIsOpen(nextState);
    }
  };

  useClickOutside(containerRef, () => {
    if (show) handleToggle(false);
  }, show);

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      <div onClick={(e) => { e.stopPropagation(); handleToggle(!show); }}>
        {trigger(show)}
      </div>

      {show && (
        <div 
          className={`absolute top-full mt-1 z-50 animate-slide-up ${align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left'}`}
          onClick={(e) => e.stopPropagation()} 
        >
          {content(() => handleToggle(false))}
        </div>
      )}
    </div>
  );
};
