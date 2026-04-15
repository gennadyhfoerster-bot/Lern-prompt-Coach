import { motion } from 'motion/react';
import React, { ReactNode, ComponentPropsWithoutRef } from 'react';

interface PremiumCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  key?: any;
}

export function PremiumCard({ children, className = '', delay = 0, ...props }: PremiumCardProps) {
  return (
    <motion.div
      {...props}
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.8, 
        delay, 
        ease: [0.16, 1, 0.3, 1] // Custom Apple-like easing
      }}
      whileHover={{ 
        y: -4,
        boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
        transition: { duration: 0.4 }
      }}
      className={`
        relative overflow-hidden
        bg-white/5 backdrop-blur-2xl
        border border-white/10 rounded-[32px]
        p-6 flex flex-col
        shadow-[0_8px_32px_rgba(0,0,0,0.1)]
        before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/5 before:to-transparent before:pointer-events-none
        ${className}
      `}
    >
      {/* Subtle Inner Glow */}
      <div className="absolute inset-px rounded-[31px] border border-white/5 pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
}
