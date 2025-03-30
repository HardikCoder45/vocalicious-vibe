import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface WaveformVisualizerProps {
  isSpeaking: boolean;
  color?: string;
  barCount?: number;
  className?: string;
  height?: number;
}

const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({ 
  isSpeaking = false, 
  color = 'bg-primary',
  barCount = 5,
  className = '',
  height = 20
}) => {
  const [audioLevels, setAudioLevels] = useState<number[]>([]);
  
  useEffect(() => {
    if (!isSpeaking) {
      // Reset to minimal levels when not speaking
      setAudioLevels(Array(barCount).fill(10));
      return;
    }
    
    // Generate random audio levels for visual effect
    const generateAudioLevels = () => {
      const baseLevel = 50; // Base level when speaking
      const variation = 40; // Amount of random variation
      
      const newLevels = Array(barCount).fill(0).map(() => {
        return baseLevel + Math.random() * variation;
      });
      
      setAudioLevels(newLevels);
    };
    
    // Update audio levels periodically
    const intervalId = setInterval(generateAudioLevels, 100);
    
    // Initial generation
    generateAudioLevels();
    
    return () => {
      clearInterval(intervalId);
    };
  }, [isSpeaking, barCount]);
  
  return (
    <div 
      className={cn(
        "flex items-end justify-center gap-[2px] h-full w-full", 
        className
      )}
      style={{ height: `${height}px` }}
    >
      {audioLevels.map((level, index) => (
        <div
          key={index}
          className={cn(
            "w-[4px] rounded-full transition-all duration-[50ms]",
            color,
            isSpeaking ? "opacity-100" : "opacity-40"
          )}
          style={{
            height: `${level}%`,
            animationDelay: `${index * 0.05}s`
          }}
        />
      ))}
    </div>
  );
};

export default WaveformVisualizer;
