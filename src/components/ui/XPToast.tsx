import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useState } from 'react';

interface XPToastProps {
  amount: number;
  onComplete: () => void;
}

export function XPToast({ amount, onComplete }: XPToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onComplete, 500);
    }, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.5 }}
          animate={{ opacity: 1, y: -50, scale: 1.2 }}
          exit={{ opacity: 0, scale: 1.5 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
        >
          <div className="bg-primary text-white px-6 py-2 rounded-full font-black text-2xl shadow-[0_0_30px_rgba(99,102,241,0.6)] flex items-center gap-2">
            <span className="text-xl">✨</span> +{amount} XP
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
