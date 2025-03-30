import React from 'react';
import { Button } from './ui/button';
import { Mic, MicOff, Command } from 'lucide-react';
import { useVoiceCommand } from '@/context/VoiceCommandContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Badge } from './ui/badge';

interface VoiceCommandToggleProps {
  className?: string;
}

const VoiceCommandToggle: React.FC<VoiceCommandToggleProps> = ({ className = '' }) => {
  const { isVoiceCommandEnabled, toggleVoiceCommand, isRecognizing, recognizedCommand } = useVoiceCommand();
  
  return (
    <div className="relative">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isVoiceCommandEnabled ? "default" : "outline"}
              size="icon"
              onClick={toggleVoiceCommand}
              className={`relative ${isVoiceCommandEnabled ? 'bg-primary hover:bg-primary/90' : ''} ${className}`}
            >
              {isVoiceCommandEnabled ? (
                <Command className="h-4 w-4" />
              ) : (
                <Command className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isVoiceCommandEnabled ? 'Disable voice commands' : 'Enable voice commands'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      {/* Pulse animation when voice commands are enabled */}
      {isVoiceCommandEnabled && (
        <div className="absolute -inset-1 rounded-full bg-primary opacity-30 animate-pulse-ring -z-10" />
      )}
      
      {/* Show recognized command if any */}
      {isVoiceCommandEnabled && recognizedCommand && (
        <div className="absolute top-full mt-2 left-0 right-0 flex justify-center">
          <Badge variant="outline" className="text-xs animate-fade-in bg-background/80 backdrop-blur-sm">
            {isRecognizing ? (
              <Mic className="h-3 w-3 mr-1 animate-pulse text-primary" />
            ) : (
              <MicOff className="h-3 w-3 mr-1" />
            )}
            {recognizedCommand.length > 20 ? recognizedCommand.substring(0, 20) + '...' : recognizedCommand}
          </Badge>
        </div>
      )}
    </div>
  );
};

export default VoiceCommandToggle; 