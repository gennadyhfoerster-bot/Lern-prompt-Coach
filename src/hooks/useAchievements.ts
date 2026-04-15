import { useState, useEffect } from 'react';
import { achievementEngine, ACHIEVEMENTS, Achievement } from '../lib/achievementEngine';

export function useAchievements() {
  const [unlockedIds, setUnlockedIds] = useState<string[]>([]);

  useEffect(() => {
    setUnlockedIds(achievementEngine.getUnlockedIds());
  }, []);

  const unlockedAchievements = ACHIEVEMENTS.filter(a => unlockedIds.includes(a.id));
  const lockedAchievements = ACHIEVEMENTS.filter(a => !unlockedIds.includes(a.id));

  return {
    unlockedAchievements,
    lockedAchievements,
    allAchievements: ACHIEVEMENTS,
    refresh: () => setUnlockedIds(achievementEngine.getUnlockedIds())
  };
}
