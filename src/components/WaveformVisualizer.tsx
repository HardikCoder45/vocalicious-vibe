
import React, { useEffect, useState, useRef } from 'react';
import { useAudio } from '@/context/AudioContext';

interface WaveformVisualizerProps {
  active?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  speakerId?: string;
}

const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({ 
  active = false, 
  size = 'md', 
  color = 'bg-primary',
  speakerId
}) => {
  const { generateWaveform, activeSpeakers } = useAudio();
  const [heights, setHeights] = useState<number[]>([]);
  const intervalRef = useRef<number | null>(null);
  
  const isSpeaking = speakerId 
    ? activeSpeakers.includes(speakerId) 
    : active;

  useEffect(() => {
    // Initial waveform
    setHeights(generateWaveform());
    
    // Update waveform continuously if speaking
    if (isSpeaking) {
      intervalRef.current = window.setInterval(() => {
        setHeights(generateWaveform());
      }, 150);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isSpeaking, generateWaveform]);

  // Set heights based on size
  const getBarHeight = (value: number) => {
    const baseHeight = size === 'sm' ? 12 : size === 'md' ? 20 : 30;
    return isSpeaking ? value * baseHeight : baseHeight * 0.3;
  };

  const getWidth = () => {
    return size === 'sm' ? 'w-0.5' : size === 'md' ? 'w-1' : 'w-1.5';
  };

  return (
    <div className="flex items-end justify-center h-full">
      {heights.map((height, index) => (
        <div
          key={index}
          className={`${getWidth()} mx-0.5 rounded-full ${color} transition-all duration-150`}
          style={{ 
            height: `${getBarHeight(height)}px`,
            opacity: isSpeaking ? '1' : '0.5',
          }}
        />
      ))}
    </div>
  );
};

export default WaveformVisualizer;
