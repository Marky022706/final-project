// src/components/common/Card.tsx
import React from 'react';
import type { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
  glass?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  hoverEffect = false,
  glass = true,
  className = '',
  ...props
}) => {
  const baseStyle = 'p-6 rounded-2xl border transition-all duration-300';
  const glassStyle = 'bg-white/80 backdrop-blur-md border-white/20 shadow-lg shadow-slate-100/40';
  const solidStyle = 'bg-white border-slate-100 shadow-md shadow-slate-100/30';
  const hoverStyle = 'hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/50 hover:border-slate-200/50';

  return (
    <div
      className={`${baseStyle} ${glass ? glassStyle : solidStyle} ${hoverEffect ? hoverStyle : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
