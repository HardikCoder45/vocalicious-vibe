import React, { useEffect, useState } from 'react';
import { Avatar as ShadcnAvatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import WaveformVisualizer from './WaveformVisualizer';
import SpeakingIndicator from './SpeakingIndicator';
import { useAudio } from '@/context/AudioContext';
import { cn } from '@/lib/utils';
import { User } from 'lucide-react';
import { fetchAvatarAsBase64 } from '@/utils/avatarUtils';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  speaking?: boolean;
  active?: boolean;
  onClick?: () => void;
  id?: string;
  className?: string;
  fallback?: React.ReactNode;
  userId?: string;
}

const Avatar: React.FC<AvatarProps> = ({ 
  src, 
  alt = 'Avatar',
  size = 'md', 
  speaking = false,
  active = false,
  onClick,
  id,
  className,
  fallback,
  userId,
}) => {
  const { activeSpeakers } = useAudio();
  const [isCurrentlySpeaking, setIsCurrentlySpeaking] = useState(false);
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null);
  
  // Fetch avatar from Supabase if userId is provided and no src is available
  useEffect(() => {
    if (userId && !src && !avatarBase64) {
      fetchAvatarAsBase64(userId)
        .then(base64 => {
          if (base64) {
            setAvatarBase64(base64);
            setError(false);
          }
        })
        .catch(err => {
          console.error('Error fetching avatar for', userId, err);
          setError(true);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [userId, src, avatarBase64]);
  
  // Determine if the user is actually speaking based on audio activity
  useEffect(() => {
    if (speaking && id) {
      setIsCurrentlySpeaking(activeSpeakers.includes(id));
    } else {
      setIsCurrentlySpeaking(speaking);
    }
  }, [speaking, id, activeSpeakers]);
  
  // Map size to class names
  const sizeClass = {
    sm: 'h-8 w-8',
    lg: 'h-16 w-16',
    md: 'h-10 w-10',
    xl: 'h-24 w-24',
  };
  
  // Map to speaking indicator size
  const speakingIndicatorSize = {
    sm: 'sm',
    md: 'sm',
    lg: 'md',
    xl: 'lg',
  } as const;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const handleError = () => {
    console.warn('Avatar image failed to load:', src);
    setError(true);
    setIsLoading(false);
  };
  
  const handleLoad = () => {
    setIsLoading(false);
  };
  
  // Process the src URL to ensure it's valid
  const processedSrc = React.useMemo(() => {
    // If we have a base64 avatar from userId, use that first
    if (avatarBase64) {
      return avatarBase64;
    }
    
    if (!src) return null;
    
    // Reset error state when src changes
    setError(false);
    setIsLoading(true);
    
    // If it's a base64 data URL, return it directly
    if (src.startsWith('data:image/')) {
      return src;
    }
    
    // If it's a blob URL, return it directly
    if (src.startsWith('blob:')) {
      return src;
    }
    
    // If the URL is already absolute, return it
    if (src.startsWith('http://') || src.startsWith('https://')) {
      return src;
    }
    
    // If it's a relative path, convert to absolute
    if (src.startsWith('/')) {
      return `${window.location.origin}${src}`;
    }
    
    // Otherwise, assume it's a relative path
    return src;
  }, [src, avatarBase64]);
  
  // If src is provided and there's no error, render the image
  if (processedSrc && !error) {
    return (
      <div 
        className={cn(
          'relative overflow-hidden rounded-full flex items-center justify-center transition-all duration-300',
          sizeClass[size],
          active ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : '',
          isCurrentlySpeaking ? 'border-2 border-primary' : 'bg-muted',
          onClick ? 'cursor-pointer transform hover:scale-105 transition-transform' : '',
          className
        )}
        onClick={onClick}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted animate-pulse">
            <User className="h-1/2 w-1/2 text-muted-foreground/50" />
          </div>
        )}
        <img
          src={processedSrc}
          alt={alt}
          className={cn(
            "h-full w-full object-cover transition-opacity duration-300",
            isLoading ? "opacity-0" : "opacity-100"
          )}
          onError={handleError}
          onLoad={handleLoad}
        />
        
        {/* Speaking indicator */}
        {isCurrentlySpeaking && (
          <div className="absolute -bottom-1 -right-1">
            <SpeakingIndicator 
              isSpeaking={true} 
              size={speakingIndicatorSize[size]} 
            />
          </div>
        )}
      </div>
    );
  }
  
  // Otherwise, render a fallback
  return (
    <div 
      className={cn(
        'rounded-full bg-muted flex items-center justify-center text-muted-foreground transition-all duration-300',
        sizeClass[size],
        active ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : '',
        isCurrentlySpeaking ? 'border-2 border-primary' : '',
        onClick ? 'cursor-pointer transform hover:scale-105 transition-transform' : '',
        className
      )}
      onClick={onClick}
    >
      {fallback || <User className={cn('h-1/2 w-1/2')} />}
      
      {/* Speaking indicator */}
      {isCurrentlySpeaking && (
        <div className="absolute -bottom-1 -right-1">
          <SpeakingIndicator 
            isSpeaking={true} 
            size={speakingIndicatorSize[size]} 
          />
        </div>
      )}
    </div>
  );
};

export default Avatar;
