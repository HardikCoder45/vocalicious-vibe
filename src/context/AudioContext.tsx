
import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { toast } from "sonner";

interface AudioContextType {
  isMuted: boolean;
  toggleMute: () => void;
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  activeSpeakers: string[];
  addActiveSpeaker: (id: string) => void;
  removeActiveSpeaker: (id: string) => void;
  generateWaveform: () => number[];
}

const AudioContext = createContext<AudioContextType>({
  isMuted: true,
  toggleMute: () => {},
  isListening: false,
  startListening: () => {},
  stopListening: () => {},
  activeSpeakers: [],
  addActiveSpeaker: () => {},
  removeActiveSpeaker: () => {},
  generateWaveform: () => [],
});

export const useAudio = () => useContext(AudioContext);

export const AudioProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [isMuted, setIsMuted] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [activeSpeakers, setActiveSpeakers] = useState<string[]>([]);
  const intervalRef = useRef<number | null>(null);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const newState = !prev;
      if (newState) {
        toast("Microphone muted");
      } else {
        toast("Microphone active");
      }
      return newState;
    });
  }, []);

  const startListening = useCallback(() => {
    setIsListening(true);
    toast("Joined as listener");
  }, []);

  const stopListening = useCallback(() => {
    setIsListening(false);
    toast("Left the room");
  }, []);

  const addActiveSpeaker = useCallback((id: string) => {
    setActiveSpeakers(prev => {
      if (!prev.includes(id)) {
        return [...prev, id];
      }
      return prev;
    });
  }, []);

  const removeActiveSpeaker = useCallback((id: string) => {
    setActiveSpeakers(prev => prev.filter(speakerId => speakerId !== id));
  }, []);

  // Generate random waveform data for visualization
  const generateWaveform = useCallback(() => {
    const baseHeight = 0.5; // Base height for when not speaking
    const amplitudeVariation = 0.5; // How much the height can vary

    // Create an array of 10 elements with random heights
    return Array.from({ length: 8 }, () => {
      return baseHeight + Math.random() * amplitudeVariation;
    });
  }, []);

  return (
    <AudioContext.Provider value={{
      isMuted,
      toggleMute,
      isListening,
      startListening,
      stopListening,
      activeSpeakers,
      addActiveSpeaker,
      removeActiveSpeaker,
      generateWaveform,
    }}>
      {children}
    </AudioContext.Provider>
  );
};
