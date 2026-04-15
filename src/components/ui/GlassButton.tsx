import { motion } from 'motion/react';
import { ReactNode } from 'react';

interface GlassButtonProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
}

export function GlassButton({ 
  children, 
  onClick, 
  className = '', 
  variant = 'primary',
  disabled = false 
}: GlassButtonProps) {
  const variants = {
    primary: "bg-primary text-white shadow-[0_0_20px_rgba(99,102,241,0.3)]",
    secondary: "bg-white/10 text-white border border-white/10 backdrop-blur-md hover:bg-white/15",
    ghost: "bg-transparent text-text-secondary hover:text-text-primary hover:bg-white/5"
  };

  return (
    <motion.button
      whileHover={!disabled ? { 
        scale: 1.02, 
        y: -2,
        boxShadow: variant === 'primary' ? "0 10px 25px rgba(99,102,241,0.4)" : "0 10px 25px rgba(0,0,0,0.2)"
      } : {}}
      whileTap={!disabled ? { scale: 0.96, y: 0 } : {}}
      onClick={onClick}
      disabled={disabled}
      className={`
        px-6 py-3 rounded-2xl font-bold text-sm
        transition-all duration-200
        flex items-center justify-center gap-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${className}
      `}
    >
      {children}
    </motion.button>
  );
}
