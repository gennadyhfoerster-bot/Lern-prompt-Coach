import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useState } from 'react';
import { Achievement } from '../../lib/achievementEngine';

interface AchievementToastProps {
  achievement: Achievement;
  onComplete: () => void;
}

export function AchievementToast({ achievement, onComplete }: AchievementToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onComplete, 500);
    }, 4000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, x: 100, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 100, scale: 0.8 }}
          className="fixed top-8 right-8 z-[100] w-80"
        >
          <div className="bg-bg-card border-2 border-accent p-4 rounded-2xl shadow-2xl flex items-center gap-4 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-accent/10 to-transparent pointer-events-none" />
            <div className="text-4xl bg-accent/20 p-3 rounded-xl">{achievement.icon}</div>
            <div className="flex-1">
              <div className="text-[10px] font-black text-accent tracking-widest uppercase mb-1">Erfolg Freigeschaltet</div>
              <div className="text-lg font-bold leading-tight">{achievement.title}</div>
              <div className="text-xs text-text-secondary">{achievement.description}</div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
