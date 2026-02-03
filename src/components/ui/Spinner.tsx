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
  size = 8,
  overlay = false,
  className = '',
  primaryColor = '#18b5d8',
  secondaryColor = '#4fd1c5',
  trackColor = 'rgba(24, 181, 216, 0.2)',
}) => {
  const borderWidth = Math.max(1, Math.round(size / 25));
  const spinner = (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <div
        className="absolute inset-0 rounded-full animate-spin"
        style={{
          borderWidth,
          borderStyle: 'solid',
          borderColor: trackColor,
          borderTopColor: primaryColor,
          borderRightColor: primaryColor,
          borderBottomColor: secondaryColor,
          borderLeftColor: secondaryColor,
        }}
      />
    </div>
  );

  if (!overlay) return spinner;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30">
      {spinner}
    </div>
  );
};

export default Spinner;
