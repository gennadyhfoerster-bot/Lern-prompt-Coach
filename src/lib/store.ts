import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DailyGoal {
  id: string;
  text: string;
  target: number;
  current: number;
  completed: boolean;
  xpReward: number;
}

interface PerformanceMetric {
  category: string;
  score: number;
  count: number;
}

interface UserState {
  xp: number;
  level: number;
  streak: number;
  theme: 'dark' | 'light';
  dailyGoals: DailyGoal[];
  lastGoalUpdate: string | null;
  performance: PerformanceMetric[];
  addXP: (amount: number) => void;
  setXP: (xp: number) => void;
  setLevel: (level: number) => void;
  setStreak: (streak: number) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  updateGoal: (id: string, progress: number) => void;
  initDailyGoals: () => void;
  updatePerformance: (category: string, score: number) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      xp: 0,
      level: 1,
      streak: 0,
      theme: 'dark',
      dailyGoals: [],
      lastGoalUpdate: null,
      performance: [
        { category: 'Klarheit', score: 0, count: 0 },
        { category: 'Struktur', score: 0, count: 0 },
        { category: 'Präzision', score: 0, count: 0 },
        { category: 'Kontext', score: 0, count: 0 },
      ],
      addXP: (amount) => set((state) => {
        const newXP = state.xp + amount;
        const nextLevelXP = state.level * 1000;
        if (newXP >= nextLevelXP && state.level < 50) {
          return { xp: newXP, level: state.level + 1 };
        }
        return { xp: newXP };
      }),
      setXP: (xp) => set({ xp }),
      setLevel: (level) => set({ level }),
      setStreak: (streak) => set({ streak }),
      setTheme: (theme) => set({ theme }),
      updateGoal: (id, progress) => set((state) => {
        const newGoals = state.dailyGoals.map(g => {
          if (g.id === id) {
            const newCurrent = Math.min(g.target, g.current + progress);
            const newlyCompleted = !g.completed && newCurrent >= g.target;
            if (newlyCompleted) {
              // We'll handle XP bonus in the component or here
            }
            return { ...g, current: newCurrent, completed: newCurrent >= g.target };
          }
          return g;
        });
        return { dailyGoals: newGoals };
      }),
      initDailyGoals: () => {
        const today = new Date().toDateString();
        if (get().lastGoalUpdate === today) return;

        const goalPool = [
          { text: 'Schließe 2 Lektionen ab', target: 2, xpReward: 50 },
          { text: 'Erreiche einen Score von 85+', target: 1, xpReward: 30 },
          { text: 'Chatte 5 Minuten mit Mia', target: 5, xpReward: 20 },
          { text: 'Schließe eine Übung fehlerfrei ab', target: 1, xpReward: 40 },
          { text: 'Vergleiche 2 Prompts', target: 2, xpReward: 30 },
        ];

        const shuffled = [...goalPool].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 3).map((g, i) => ({
          id: `goal-${i}`,
          ...g,
          current: 0,
          completed: false,
        }));

        set({ dailyGoals: selected, lastGoalUpdate: today });
      },
      updatePerformance: (category, score) => set((state) => {
        const newPerf = state.performance.map(p => {
          if (p.category === category) {
            return {
              ...p,
              score: (p.score * p.count + score) / (p.count + 1),
              count: p.count + 1
            };
          }
          return p;
        });
        return { performance: newPerf };
      }),
    }),
    {
      name: 'user-storage',
    }
  )
);
