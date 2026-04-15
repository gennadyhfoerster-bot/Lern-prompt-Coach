import { useUserStore } from './store';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpBonus: number;
  condition: (stats: any) => boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'lessons-10',
    title: 'Lern-Profi',
    description: 'Schließe 10 Lektionen ab.',
    icon: '🎓',
    xpBonus: 500,
    condition: (stats) => stats.lessonsCompleted >= 10,
  },
  {
    id: 'tools-1',
    title: 'Werkzeug-Nutzer',
    description: 'Nutze zum ersten Mal ein Tool.',
    icon: '🛠',
    xpBonus: 100,
    condition: (stats) => stats.toolsUsed >= 1,
  },
  {
    id: 'goals-complete',
    title: 'Zielstrebig',
    description: 'Schließe alle Tagesziele ab.',
    icon: '✅',
    xpBonus: 200,
    condition: (stats) => stats.goalsCompleted >= 1,
  },
  {
    id: 'xp-5000',
    title: 'XP-Legende',
    description: 'Erreiche 5000 XP.',
    icon: '🌟',
    xpBonus: 1000,
    condition: (stats) => stats.totalXP >= 5000,
  },
];

class AchievementEngine {
  private stats: any = {
    lessonsCompleted: 0,
    toolsUsed: 0,
    goalsCompleted: 0,
    totalXP: 0,
  };

  constructor() {
    const saved = localStorage.getItem('promptmeister_achievements_stats');
    if (saved) this.stats = JSON.parse(saved);
  }

  private save() {
    localStorage.setItem('promptmeister_achievements_stats', JSON.stringify(this.stats));
  }

  trackEvent(eventName: string, value: any = 1) {
    if (eventName === 'totalXP') {
      this.stats.totalXP = value;
    } else {
      this.stats[eventName] = (this.stats[eventName] || 0) + value;
    }
    this.save();
    return this.checkAchievements();
  }

  private checkAchievements() {
    const unlockedIds = JSON.parse(localStorage.getItem('promptmeister_achievements') || '[]');
    const newlyUnlocked: Achievement[] = [];

    ACHIEVEMENTS.forEach((ach) => {
      if (!unlockedIds.includes(ach.id) && ach.condition(this.stats)) {
        unlockedIds.push(ach.id);
        newlyUnlocked.push(ach);
      }
    });

    if (newlyUnlocked.length > 0) {
      localStorage.setItem('promptmeister_achievements', JSON.stringify(unlockedIds));
    }

    return newlyUnlocked;
  }

  getUnlockedIds(): string[] {
    return JSON.parse(localStorage.getItem('promptmeister_achievements') || '[]');
  }
}

export const achievementEngine = new AchievementEngine();
