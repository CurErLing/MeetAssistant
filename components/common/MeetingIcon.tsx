
import React from 'react';
import { FileAudio, Volume2 } from 'lucide-react';

interface MeetingIconProps {
  format: 'mp3' | 'wav';
  status?: string;
  size?: number;
  className?: string;
}

export const MeetingIcon: React.FC<MeetingIconProps> = ({ 
  format, 
  status, 
  size = 20,
  className = ""
}) => {
  const isProcessing = status === 'processing';
  
  // Default base styles
  let containerStyles = "rounded-lg flex items-center justify-center flex-shrink-0 transition-colors";
  
  // Status based styles
  if (isProcessing) {
    containerStyles += " bg-slate-100 text-slate-400 border border-slate-200";
  } else {
    containerStyles += " bg-indigo-50 text-indigo-600 border border-indigo-100";
  }

  // Allow custom overrides via className (e.g. for recycle bin grayscale)
  const finalClass = `${containerStyles} w-10 h-10 ${className}`;

  return (
    <div className={finalClass}>
      {format === 'mp3' ? <FileAudio size={size} /> : <Volume2 size={size} />}
    </div>
  );
};
