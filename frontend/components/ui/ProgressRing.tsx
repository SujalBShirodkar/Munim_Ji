import React from 'react';

interface ProgressRingProps {
  radius?: number;
  stroke?: number;
  progress: number; // 0 to 100
  color?: string;
  bgColor?: string;
  children?: React.ReactNode;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  radius = 36,
  stroke = 6,
  progress,
  color = '#F5A524',
  bgColor = '#E2E8F0',
  children,
}) => {
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, progress)) / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg height={radius * 2} width={radius * 2} className="rotate-[-90deg]">
        <circle
          stroke={bgColor}
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke={color}
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={`${circumference} ${circumference}`}
          style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.6s ease' }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold">
          {children}
        </div>
      )}
    </div>
  );
};

