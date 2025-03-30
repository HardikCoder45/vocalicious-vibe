import React from 'react';
import { cn } from '@/lib/utils';

interface PlatformLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: () => void;
}

// Platform logo URL
const PLATFORM_LOGO = "https://i.ibb.co/zVmwh8vy/Chat-GPT-Image-Mar-29-2025-12-54-14-PM-removebg-preview-1-removebg.png";

const PlatformLogo: React.FC<PlatformLogoProps> = ({ 
  size = 'md',
  className,
  onClick
}) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
    xl: 'h-24 w-24'
  };
  
  return (
    <div 
      className={cn("flex items-center justify-center", className)}
      onClick={onClick}
    >
      <img
        src={PLATFORM_LOGO}
        alt="Vocalicious Vibe Logo"
        className={cn("object-contain", sizeClasses[size])}
        onError={(e) => {
          console.error('Error loading platform logo');
          e.currentTarget.src = '/fallback-logo.png'; // Fallback image
        }}
      />
    </div>
  );
};

export default PlatformLogo; 