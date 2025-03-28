
import React from 'react';
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";
import { useAudio } from '@/context/AudioContext';
import WaveformVisualizer from './WaveformVisualizer';

interface MicrophoneButtonProps {
  size?: 'default' | 'sm' | 'lg' | 'icon';
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
}

const MicrophoneButton: React.FC<MicrophoneButtonProps> = ({
  size = 'default',
  variant = 'default',
  className = '',
}) => {
  const { isMuted, toggleMute } = useAudio();
  
  return (
    <div className="relative">
      <Button
        variant={variant}
        size={size}
        onClick={toggleMute}
        className={`relative ${!isMuted ? 'bg-primary hover:bg-primary/90' : ''} ${className}`}
      >
        {isMuted ? (
          <MicOff className="h-5 w-5 mr-2" />
        ) : (
          <Mic className="h-5 w-5 mr-2 animate-pulse" />
        )}
        {isMuted ? 'Unmute' : 'Mute'}
        
        {/* Speech visualization if unmuted */}
        {!isMuted && (
          <div className="absolute bottom-0 left-0 w-full h-1 overflow-hidden">
            <WaveformVisualizer active={!isMuted} size="sm" color="bg-white" />
          </div>
        )}
      </Button>
      
      {/* Pulse animation when unmuted */}
      {!isMuted && (
        <div className="absolute -inset-1 rounded-md bg-primary opacity-30 animate-pulse-ring -z-10" />
      )}
    </div>
  );
};

export default MicrophoneButton;
