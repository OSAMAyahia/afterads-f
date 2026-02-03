import React from 'react';

type SpinnerProps = {
  size?: number;
  overlay?: boolean;
  className?: string;
  primaryColor?: string;
  secondaryColor?: string;
  trackColor?: string;
};

const Spinner: React.FC<SpinnerProps> = ({
  size = 4,
  overlay = false,
  className = '',
  primaryColor = '#6b7280',
  secondaryColor = '#9ca3af',
  trackColor = 'rgba(107, 114, 128, 0.2)',
}) => {
  const adjustedSize = Math.max(4, Math.round(size * 0.6));
  const padding = Math.max(1, Math.round(adjustedSize / 6));
  const spinner = (
    <div
      className={`relative ${className} animate-spin`}
      style={{
        width: adjustedSize,
        height: adjustedSize,
        padding,
        aspectRatio: '1',
        borderRadius: '50%',
        background: `conic-gradient(${primaryColor}, ${secondaryColor})`,
        WebkitMask: 'conic-gradient(#0000 10%, #000), linear-gradient(#000 0 0) content-box',
        mask: 'conic-gradient(#0000 10%, #000), linear-gradient(#000 0 0) content-box',
        WebkitMaskComposite: 'source-out',
        maskComposite: 'subtract',
        boxShadow: `0 0 0 1px ${trackColor}`,
      }}
    />
  );

  if (!overlay) return spinner;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30">
      {spinner}
    </div>
  );
};

export default Spinner;
