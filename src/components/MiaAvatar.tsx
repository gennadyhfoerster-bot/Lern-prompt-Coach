import { motion, AnimatePresence } from 'motion/react';
import { useMiaEmotion } from '../hooks/useMiaEmotion';
import { useEffect, useState } from 'react';

export function MiaAvatar({ className = "" }: { className?: string }) {
  const { emotion } = useMiaEmotion();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 10;
      const y = (e.clientY / window.innerHeight - 0.5) * 10;
      setMousePos({ x, y });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const getEmotionStyles = () => {
    switch (emotion) {
      case 'celebrating':
        return "from-accent via-secondary to-primary shadow-[0_0_50px_rgba(236,72,153,0.5)]";
      case 'thoughtful':
        return "from-bg-elevated to-primary/40 shadow-[0_0_30px_rgba(99,102,241,0.2)]";
      case 'concerned':
        return "from-bg-elevated to-danger/20 grayscale opacity-70";
      case 'encouraging':
        return "from-success/40 to-primary/40 shadow-[0_0_30px_rgba(16,185,129,0.3)]";
      default:
        return "from-primary via-secondary to-primary shadow-[0_0_30px_rgba(99,102,241,0.3)]";
    }
  };

  return (
    <div className={`relative group ${className}`}>
      {/* Outer Glow Ring */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className={`absolute -inset-4 rounded-full blur-2xl bg-gradient-to-br ${getEmotionStyles()} opacity-30`}
      />

      {/* Main Avatar Body */}
      <motion.div
        animate={{
          y: [0, -4, 0],
          rotate: [0, 1, 0, -1, 0],
          x: mousePos.x,
          translateY: mousePos.y,
        }}
        transition={{
          y: { duration: 5, repeat: Infinity, ease: "easeInOut" },
          rotate: { duration: 8, repeat: Infinity, ease: "easeInOut" },
          x: { type: "spring", stiffness: 50, damping: 20 },
          translateY: { type: "spring", stiffness: 50, damping: 20 }
        }}
        className={`
          w-20 h-20 rounded-full 
          bg-gradient-to-br ${getEmotionStyles()}
          flex items-center justify-center text-3xl
          relative z-10 border border-white/20 backdrop-blur-md
          cursor-pointer
        `}
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={emotion}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            {emotion === 'celebrating' ? '✨' : 
             emotion === 'thoughtful' ? '🤔' : 
             emotion === 'concerned' ? '😟' : 
             emotion === 'encouraging' ? '🌟' : '🤖'}
          </motion.span>
        </AnimatePresence>

        {/* Eye-like reflection */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white/40 rounded-full blur-[1px]" />
      </motion.div>

      {/* Breathing Indicator */}
      <motion.div
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.5, 0, 0.5],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute bottom-0 right-0 w-4 h-4 bg-success rounded-full border-2 border-bg z-20"
      />
    </div>
  );
}
