import React from 'react';

interface BachatRibbonProps {
  amountRupees: number;
  kind?: 'illustrative' | 'measured';
  label?: string;
  className?: string;
}

export const BachatRibbon: React.FC<BachatRibbonProps> = ({
  amountRupees,
  kind = 'illustrative',
  label,
  className = ''
}) => {
  const isMeasured = kind === 'measured';

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
        isMeasured
          ? 'bg-mint-light text-mint-dark border border-mint/30'
          : 'bg-turmeric-50 text-turmeric-600 border border-turmeric/30'
      } ${className}`}
    >
      <span className="font-bold">
        {isMeasured ? '✓ Measured' : '✦ Illustrative'}
      </span>
      <span>•</span>
      <span className="font-extrabold tracking-tight">
        {label || `Bachat ₹${amountRupees.toLocaleString('en-IN')}`}
      </span>
    </div>
  );
};

