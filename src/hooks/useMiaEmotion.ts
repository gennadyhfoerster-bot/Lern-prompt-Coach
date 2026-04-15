import { create } from 'zustand';

export type MiaEmotion = 'happy' | 'celebrating' | 'thoughtful' | 'concerned' | 'encouraging';

interface MiaEmotionState {
  emotion: MiaEmotion;
  setEmotion: (emotion: MiaEmotion, duration?: number) => void;
}

export const useMiaEmotion = create<MiaEmotionState>((set) => ({
  emotion: 'happy',
  setEmotion: (emotion, duration = 3000) => {
    set({ emotion });
    if (duration > 0) {
      setTimeout(() => {
        set({ emotion: 'happy' });
      }, duration);
    }
  },
}));
