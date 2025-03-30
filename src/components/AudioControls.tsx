import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { useAudio } from '@/context/AudioContext';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AudioControlsProps {
  minimized?: boolean;
  className?: string;
  showTooltips?: boolean;
  showStatus?: boolean;
}

const AudioControls: React.FC<AudioControlsProps> = ({
  minimized = false,
  className = '',
  showTooltips = true,
  showStatus = true,
}) => {
  const { 
    isListening, 
    isMuted, 
    toggleMute, 
    startListening, 
    stopListening,
    isUserSpeaking
  } = useAudio();
  
  const handleMicrophoneToggle = () => {
    if (!isListening) {
      startListening();
    } else {
      toggleMute();
    }
  };
  
  const renderControls = () => {
    if (minimized) {
      // Minimized version - just a single button
      return (
        <div className={cn("relative", className)}>
          <Button
            size="icon"
            variant={isMuted ? "outline" : "default"}
            onClick={handleMicrophoneToggle}
            className={cn(
              "relative",
              isUserSpeaking && !isMuted && "animate-pulse ring-2 ring-primary"
            )}
          >
            {!isListening || isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            
            {/* Speaking indicator */}
            {isUserSpeaking && !isMuted && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full" />
            )}
          </Button>
        </div>
      );
    }
    
    // Full version with multiple controls
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {/* Microphone toggle */}
        <Button
          size="sm"
          variant={isMuted ? "outline" : "default"}
          onClick={handleMicrophoneToggle}
          className={cn(
            "relative gap-2",
            isUserSpeaking && !isMuted && "animate-pulse ring-1 ring-primary"
          )}
        >
          {!isListening || isMuted ? (
            <>
              <MicOff className="h-4 w-4" />
              {showStatus && <span>Muted</span>}
            </>
          ) : (
            <>
              <Mic className="h-4 w-4" />
              {showStatus && <span>Unmuted</span>}
            </>
          )}
          
          {/* Speaking indicator */}
          <AnimatePresence>
            {isUserSpeaking && !isMuted && (
              <motion.span 
                className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              />
            )}
          </AnimatePresence>
        </Button>
        
        {/* Voice activity indicator */}
        {showStatus && (
          <div className="text-xs text-muted-foreground">
            {!isListening ? (
              "Microphone off"
            ) : isMuted ? (
              "Muted"
            ) : isUserSpeaking ? (
              <span className="text-green-500 font-medium">Speaking</span>
            ) : (
              "Not speaking"
            )}
          </div>
        )}
      </div>
    );
  };
  
  if (showTooltips) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {renderControls()}
          </TooltipTrigger>
          <TooltipContent>
            {!isListening ? "Turn on microphone" : isMuted ? "Unmute microphone" : "Mute microphone"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  return renderControls();
};

export default AudioControls; 