import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`bg-card border border-border rounded-2xl p-5 ${onClick ? 'cursor-pointer hover:border-indigo-500/50 hover:bg-[#252525] transition-all' : ''} ${className}`}
    >
      {children}
    </div>
  );
};