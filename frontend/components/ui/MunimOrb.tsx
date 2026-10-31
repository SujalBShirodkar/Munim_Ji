'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Mic } from 'lucide-react';
import Link from 'next/link';

interface MunimOrbProps {
  isListening?: boolean;
  isSpeaking?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export const MunimOrb: React.FC<MunimOrbProps> = ({
  isListening = false,
  isSpeaking = false,
  onClick,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24'
  }[size];

  const iconSizes = {
    sm: 20,
    md: 28,
    lg: 40
  }[size];

  return (
    <div className="relative inline-flex items-center justify-center">
      {/* Outer Glow Ripples */}
      <motion.div
        animate={
          isListening
            ? { scale: [1, 1.4, 1], opacity: [0.6, 0.2, 0.6] }
            : isSpeaking
            ? { scale: [1, 1.25, 1], opacity: [0.7, 0.3, 0.7] }
            : { scale: [1, 1.1, 1], opacity: [0.4, 0.15, 0.4] }
        }
        transition={{ repeat: Infinity, duration: isListening ? 1.4 : 2.8, ease: 'easeInOut' }}
        className={`absolute rounded-full bg-turmeric ${sizeClasses} blur-md pointer-events-none`}
      />

      {/* Main Turmeric Orb Button */}
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={onClick}
        className={`relative ${sizeClasses} rounded-full bg-gradient-to-br from-turmeric to-amber-600 shadow-lg flex items-center justify-center text-white cursor-pointer border-2 border-white/50 focus:outline-none`}
      >
        {isListening ? (
          /* Live Waveform Indicator */
          <div className="flex items-center gap-1">
            {[0.4, 0.8, 1.0, 0.6, 0.9, 0.5].map((h, i) => (
              <motion.span
                key={i}
                animate={{ height: ['4px', '22px', '6px'] }}
                transition={{
                  repeat: Infinity,
                  duration: 0.6,
                  delay: i * 0.1,
                  ease: 'easeInOut'
                }}
                className="w-1 bg-white rounded-full inline-block"
              />
            ))}
          </div>
        ) : (
          <Mic size={iconSizes} className="drop-shadow" />
        )}
      </motion.button>
    </div>
  );
};

