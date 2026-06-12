import React from 'react';

export default function Button({ children, className = '', variant = 'primary', ...props }) {
  const baseStyles = 'uppercase tracking-[0.2em] font-bold transition-all duration-300 rounded-full px-8 py-4 text-xs';
  
  const variants = {
    primary: 'bg-shiraz-600 text-white hover:bg-shiraz-700',
    secondary: 'bg-shiraz-100 text-shiraz-900 hover:bg-shiraz-200',
    outline: 'border border-shiraz-900 text-shiraz-900 hover:bg-shiraz-900 hover:text-white',
    blurReveal: 'bg-white text-shiraz-900 hover:-translate-y-2 hover:shadow-xl',
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
