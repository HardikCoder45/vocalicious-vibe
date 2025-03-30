import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAudio } from './AudioContext';
import { useRoom } from './RoomContext';
import { toast } from 'sonner';

interface VoiceCommandContextType {
  isVoiceCommandEnabled: boolean;
  toggleVoiceCommand: () => void;
  recognizedCommand: string;
  isRecognizing: boolean;
  availableCommands: string[];
  executeCommand: (command: string) => void;
}

const VoiceCommandContext = createContext<VoiceCommandContextType>({
  isVoiceCommandEnabled: false,
  toggleVoiceCommand: () => {},
  recognizedCommand: '',
  isRecognizing: false,
  availableCommands: ['join room', 'create room', 'leave room', 'mute', 'unmute', 'profile', 'home'],
  executeCommand: () => {}
});

export const useVoiceCommand = () => useContext(VoiceCommandContext);

// Define SpeechRecognition type
interface SpeechRecognitionEvent extends Event {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
      isFinal: boolean;
      length: number;
    };
    length: number;
  };
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onstart: (event: Event) => void;
  onend: (event: Event) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onresult: (event: SpeechRecognitionEvent) => void;
}

export const VoiceCommandProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [isVoiceCommandEnabled, setIsVoiceCommandEnabled] = useState(false);
  const [recognizedCommand, setRecognizedCommand] = useState('');
  const [isRecognizing, setIsRecognizing] = useState(false);
  const { toggleMute, isMuted } = useAudio();
  const { leaveRoom } = useRoom();
  const navigateRef = useRef<((path: string) => void) | null>(null);
  
  // Try to get navigate function if we're in a Router context
  try {
    const navigate = useNavigate();
    navigateRef.current = navigate;
  } catch (error) {
    // If we're not in a Router context, navigate will be handled later
    console.log('Navigation not available during context initialization');
  }
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  
  const availableCommands = [
    'join room',
    'create room',
    'leave room',
    'mute',
    'unmute', 
    'profile',
    'home',
    'settings'
  ];
  
  // Initialize speech recognition
  const initializeSpeechRecognition = useCallback(() => {
    if (!('SpeechRecognition' in window) && !('webkitSpeechRecognition' in window)) {
      toast.error('Speech recognition is not supported in this browser');
      return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    recognition.onstart = () => {
      setIsRecognizing(true);
    };
    
    recognition.onend = () => {
      setIsRecognizing(false);
      // Restart if voice commands are enabled but recognition stopped
      if (isVoiceCommandEnabled) {
        setTimeout(() => {
          if (recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch (error) {
              console.error('Failed to restart speech recognition:', error);
            }
          }
        }, 1000);
      }
    };
    
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsRecognizing(false);
      toast.error(`Speech recognition error: ${event.error}`);
    };
    
    recognition.onresult = (event) => {
      const last = event.results.length - 1;
      const command = event.results[last][0].transcript.trim().toLowerCase();
      
      setRecognizedCommand(command);
      
      // Check if this is a final result
      if (event.results[last].isFinal) {
        console.log('Final command recognized:', command);
        processCommand(command);
      }
    };
    
    recognitionRef.current = recognition;
  }, [isVoiceCommandEnabled]);
  
  // Execute command function that can be called from outside
  const executeCommand = useCallback((path: string) => {
    if (navigateRef.current) {
      navigateRef.current(path);
    } else {
      console.error('Navigation not available');
    }
  }, []);
  
  // Process recognized commands
  const processCommand = useCallback((command: string) => {
    console.log('Processing command:', command);
    
    // Extract intent from the command
    const matchedCommand = availableCommands.find(availableCmd => 
      command.includes(availableCmd)
    );
    
    if (!matchedCommand) {
      // If we don't recognize any supported command, ignore it
      return;
    }
    
    toast.info(`Command recognized: ${matchedCommand}`);
    
    // Execute command
    switch (matchedCommand) {
      case 'join room':
        if (navigateRef.current) navigateRef.current('/');
        break;
      case 'create room':
        if (navigateRef.current) navigateRef.current('/create');
        break;
      case 'leave room':
        leaveRoom();
        if (navigateRef.current) navigateRef.current('/');
        break;
      case 'mute':
        if (!isMuted) toggleMute();
        break;
      case 'unmute':
        if (isMuted) toggleMute();
        break;
      case 'profile':
        if (navigateRef.current) navigateRef.current('/profile');
        break;
      case 'home':
        if (navigateRef.current) navigateRef.current('/');
        break;
      case 'settings':
        if (navigateRef.current) navigateRef.current('/settings');
        break;
      default:
        break;
    }
  }, [leaveRoom, toggleMute, isMuted]);
  
  // Toggle voice command recognition
  const toggleVoiceCommand = useCallback(() => {
    setIsVoiceCommandEnabled(prev => {
      const newState = !prev;
      
      if (newState) {
        // Initialize if not already done
        if (!recognitionRef.current) {
          initializeSpeechRecognition();
        }
        
        // Start recognition
        if (recognitionRef.current) {
          try {
            recognitionRef.current.start();
            toast.success('Voice commands activated');
          } catch (error) {
            console.error('Failed to start speech recognition:', error);
            toast.error('Failed to activate voice commands');
            return false;
          }
        }
      } else {
        // Stop recognition
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
            toast.info('Voice commands deactivated');
          } catch (error) {
            console.error('Failed to stop speech recognition:', error);
          }
        }
      }
      
      return newState;
    });
  }, [initializeSpeechRecognition]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          console.error('Failed to stop speech recognition during cleanup:', error);
        }
      }
    };
  }, []);
  
  // Update navigate ref if it becomes available
  useEffect(() => {
    try {
      const navigate = useNavigate();
      navigateRef.current = navigate;
    } catch (error) {
      // Still not in a Router context
    }
  }, []);
  
  return (
    <VoiceCommandContext.Provider value={{
      isVoiceCommandEnabled,
      toggleVoiceCommand,
      recognizedCommand,
      isRecognizing,
      availableCommands,
      executeCommand
    }}>
      {children}
    </VoiceCommandContext.Provider>
  );
};

// Declare the interfaces for the global window object
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default VoiceCommandContext; 