export type TrackType = 'PROMPT' | 'CONTEXT';
export type LessonType = 'THEORY' | 'PRACTICE' | 'CHALLENGE';
export type ExerciseType = 'MULTIPLE_CHOICE' | 'FREE_TEXT' | 'ERROR_DETECTION' | 'COMPARISON' | 'REAL_SCENARIO';
export type DifficultyLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';

export interface User {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  isPremium: boolean;
  avatarUrl?: string;
  createdAt: Date;
  lastLoginAt?: Date;
  currentStreak: number;
  longestStreak: number;
  totalXP: number;
  level: number;
  promptTrackXP: number;
  contextTrackXP: number;
}

export interface Chapter {
  id: string;
  track: TrackType;
  order: number;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  isLocked: boolean;
  requiredXP: number;
}

export interface Lesson {
  id: string;
  chapterId: string;
  order: number;
  title: string;
  content: string;
  type: LessonType;
  xpReward: number;
}

export interface Exercise {
  id: string;
  lessonId: string;
  type: ExerciseType;
  question: string;
  badExample?: string;
  goodExample?: string;
  perfectExample?: string;
  options?: string[];
  correctAnswer?: string;
  evaluationCriteria?: any;
  difficulty: DifficultyLevel;
}

export interface ExerciseResult {
  id: string;
  userId: string;
  exerciseId: string;
  answer: string;
  score: number;
  feedback: string;
  timeSpent: number;
  createdAt: Date;
  aiEvaluation?: any;
}

export interface Achievement {
  id: string;
  key: string;
  title: string;
  description: string;
  icon: string;
  xpBonus: number;
  condition: any;
}

export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  unlockedAt: Date;
}

export interface DailyGoal {
  id: string;
  userId: string;
  date: Date;
  targetXP: number;
  earnedXP: number;
  completed: boolean;
}

export interface CoachMemory {
  id: string;
  userId: string;
  conversationHistory: any[];
  weaknesses: string[];
  strengths: string[];
  lastTopics: string[];
  personalityNotes?: string;
  totalInteractions: number;
  lastInteractionAt?: Date;
  learningStyle?: string;
  motivationProfile?: string;
  updatedAt: Date;
}
