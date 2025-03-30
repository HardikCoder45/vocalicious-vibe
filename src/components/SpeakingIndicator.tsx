import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Mic } from 'lucide-react';

interface SpeakingIndicatorProps {
  isSpeaking: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  pulse?: boolean;
  showIcon?: boolean;
}

const SpeakingIndicator: React.FC<SpeakingIndicatorProps> = ({
  isSpeaking,
  size = 'md',
  className,
  pulse = true,
  showIcon = true
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };
  
  const iconSizes = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4'
  };
  
  const borderSizes = {
    sm: 'border-[1px]',
    md: 'border-2',
    lg: 'border-3'
  };
  
  return (
    <AnimatePresence>
      {isSpeaking && (
        <motion.div 
          className={cn(
            'rounded-full flex items-center justify-center relative',
            sizeClasses[size],
            borderSizes[size],
            'border-primary',
            pulse && 'animate-pulse',
            className
          )}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {showIcon && (
            <Mic className={cn('text-primary', iconSizes[size])} />
          )}
          
          {/* Ripple effect */}
          <motion.div
            className={cn(
              'absolute inset-0 rounded-full border-primary',
              borderSizes[size]
            )}
            initial={{ opacity: 0.8, scale: 1 }}
            animate={{ 
              opacity: 0,
              scale: 1.5
            }}
            transition={{ 
              repeat: Infinity,
              duration: 1.5,
              ease: 'easeOut'
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SpeakingIndicator; 