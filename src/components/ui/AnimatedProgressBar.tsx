import { motion } from 'motion/react';

interface ProgressBarProps {
  progress: number;
  color?: string;
  height?: string;
  className?: string;
}

export function AnimatedProgressBar({ 
  progress, 
  color = "bg-primary", 
  height = "h-2",
  className = "" 
}: ProgressBarProps) {
  return (
    <div className={`w-full bg-white/10 rounded-full overflow-hidden ${height} ${className}`}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        transition={{ duration: 1, ease: "easeOut" }}
        className={`h-full ${color} rounded-full`}
      />
    </div>
  );
}
