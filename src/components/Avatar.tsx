
import React from 'react';
import { Avatar as ShadcnAvatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import WaveformVisualizer from './WaveformVisualizer';

interface AvatarProps {
  src: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  speaking?: boolean;
  active?: boolean;
  onClick?: () => void;
  id?: string;
}

const Avatar: React.FC<AvatarProps> = ({ 
  src, 
  alt, 
  size = 'md', 
  speaking = false,
  active = false,
  onClick,
  id
}) => {
  // Map size to class names
  const sizeClass = {
    sm: 'h-10 w-10',
    md: 'h-14 w-14',
    lg: 'h-20 w-20',
    xl: 'h-28 w-28'
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="relative flex flex-col items-center">
      <div 
        className={`relative cursor-pointer transition-transform duration-300 ${active ? 'scale-110' : ''}`}
        onClick={onClick}
      >
        {/* Animation ring for speaking state */}
        {speaking && (
          <div className="absolute inset-0 rounded-full bg-primary opacity-20 animate-pulse-ring"/>
        )}
        
        <ShadcnAvatar className={`${sizeClass[size]} ${speaking ? 'ring-2 ring-primary ring-offset-1' : ''} ${active ? 'ring-2 ring-secondary ring-offset-1' : ''}`}>
          <AvatarImage src={src} alt={alt} />
          <AvatarFallback>{getInitials(alt)}</AvatarFallback>
        </ShadcnAvatar>
      </div>
      
      {/* Waveform below avatar if speaking */}
      {speaking && (
        <div className="mt-2 h-5">
          <WaveformVisualizer 
            active={speaking} 
            size="sm" 
            speakerId={id}
          />
        </div>
      )}
    </div>
  );
};

export default Avatar;
