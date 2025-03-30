import React, { useEffect, useState } from 'react';
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
  const { isMuted, toggleMute, currentStream } = useAudio();
  const [permissionDenied, setPermissionDenied] = useState(false);
  
  // Check microphone permissions on mount
  useEffect(() => {
    // Check if we have microphone access
    if (!navigator.mediaDevices) {
      setPermissionDenied(true);
      return;
    }
    
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        // We got access, clean up this temporary stream
        stream.getTracks().forEach(track => track.stop());
      })
      .catch(err => {
        console.error('Error accessing microphone:', err);
        setPermissionDenied(true);
      });
  }, []);
  
  const handleMicToggle = async () => {
    if (permissionDenied) {
      // Show a message about enabling microphone permissions
      alert('Microphone access is required to speak. Please enable microphone access in your browser settings and refresh this page.');
      return;
    }
    
    // Toggle the microphone state
    toggleMute();
  };
  
  return (
    <div className="relative">
      <Button
        variant={variant}
        size={size}
        onClick={handleMicToggle}
        className={`relative ${!isMuted ? 'bg-primary hover:bg-primary/90' : ''} ${className}`}
        disabled={permissionDenied}
      >
        {isMuted ? (
          <MicOff className="h-5 w-5 mr-2" />
        ) : (
          <Mic className="h-5 w-5 mr-2 animate-pulse" />
        )}
        {isMuted ? 'Unmute' : 'Mute'}
        
        {/* Speech visualization if unmuted */}
        {!isMuted && currentStream && (
          <div className="absolute bottom-0 left-0 w-full h-1 overflow-hidden">
            <WaveformVisualizer active={!isMuted} size="sm" color="bg-white" />
          </div>
        )}
      </Button>
      
      {/* Pulse animation when unmuted */}
      {!isMuted && (
        <div className="absolute -inset-1 rounded-md bg-primary opacity-30 animate-pulse-ring -z-10" />
      )}
      
      {/* Warning if microphone permission is denied */}
      {permissionDenied && (
        <div className="absolute top-full mt-2 left-0 right-0 text-center">
          <span className="text-xs text-destructive bg-destructive/10 px-2 py-1 rounded">
            Microphone access required
          </span>
        </div>
      )}
    </div>
  );
};

export default MicrophoneButton;
