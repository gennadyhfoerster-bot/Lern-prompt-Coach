import { useState, useEffect } from 'react';
import { auth, db, handleFirestoreError, OperationType } from './lib/firebase';
import { onAuthStateChanged, User, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot, collection, getDocs, query, where, arrayUnion } from 'firebase/firestore';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Toaster, toast } from 'react-hot-toast';
import { useUserStore } from './lib/store';
import confetti from 'canvas-confetti';
import { motion } from 'motion/react';
import { 
  LayoutDashboard, 
  BookOpen, 
  Trophy, 
  Settings, 
  LogOut, 
  Zap, 
  Flame, 
  Star, 
  ChevronRight, 
  Play,
  Mic,
  MessageSquare
} from 'lucide-react';
import { listen } from './lib/voice';
import { getMiaResponse, evaluateExercise } from './lib/gemini';
import { ALL_CONTENT } from './lib/content';
import { useMiaEmotion } from './hooks/useMiaEmotion';
import { useVoice } from './hooks/useVoice';
import { MiaAvatar } from './components/MiaAvatar';
import { Button } from './components/ui/Button';
import { GlassButton } from './components/ui/GlassButton';
import { PremiumCard } from './components/ui/PremiumCard';
import { AnimatedBackground } from './components/ui/AnimatedBackground';
import { XPToast } from './components/ui/XPToast';
import { AchievementToast } from './components/ui/AchievementToast';
import { AnimatedProgressBar } from './components/ui/AnimatedProgressBar';
import { achievementEngine, Achievement, ACHIEVEMENTS } from './lib/achievementEngine';
import { ToolsLayout } from './features/tools/ToolsLayout';

type View = 'dashboard' | 'learn' | 'settings' | 'chat' | 'tools' | 'profile';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const { xp, level, streak, setXP, setLevel, setStreak, addXP, theme, setTheme, initDailyGoals } = useUserStore();
  const { setEmotion } = useMiaEmotion();
  const { speak, isMuted, toggleMute } = useVoice();
  
  const [xpToasts, setXpToasts] = useState<{ id: number, amount: number }[]>([]);
  const [achievementToasts, setAchievementToasts] = useState<{ id: number, achievement: Achievement }[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        setUser(firebaseUser);
        if (firebaseUser) {
          initDailyGoals();
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          
          const unsubDoc = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              setXP(data.totalXP || 0);
              setLevel(data.level || 1);
              setStreak(data.currentStreak || 0);
            }
          }, (error) => handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`));

          const userDoc = await getDoc(userDocRef);
          if (!userDoc.exists()) {
            const newUser = {
              email: firebaseUser.email,
              name: firebaseUser.displayName || 'User',
              totalXP: 0,
              level: 1,
              currentStreak: 0,
              createdAt: serverTimestamp(),
              lastLoginAt: serverTimestamp(),
            };
            await setDoc(userDocRef, newUser);
            speak("Willkommen bei PromptMeister! Ich bin Mia, deine persönliche KI-Trainerin. Lass uns gemeinsam die Kunst des Promptings meistern.");
          } else {
            const data = userDoc.data();
            
            // Streak Logic
            const lastLogin = data.lastLoginAt?.toDate();
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            let newStreak = data.currentStreak || 0;
            if (lastLogin) {
              lastLogin.setHours(0, 0, 0, 0);
              const diffDays = Math.floor((today.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));
              
              if (diffDays === 1) {
                newStreak += 1;
              } else if (diffDays > 1) {
                newStreak = 1;
              }
            } else {
              newStreak = 1;
            }
            
            if (newStreak !== data.currentStreak) {
              await setDoc(userDocRef, { 
                currentStreak: newStreak,
                lastLoginAt: serverTimestamp()
              }, { merge: true });
            } else {
              await setDoc(userDocRef, { 
                lastLoginAt: serverTimestamp()
              }, { merge: true });
            }

            // Check achievements on login
            await checkAchievements(data.totalXP || 0, data.level || 1, newStreak, {
              lessonsCompleted: data.lessonsCompleted || 0,
              toolsUsed: data.toolsUsed || 0,
              goalsCompleted: data.goalsCompleted || 0
            });

            const greeting = await getMiaResponse(`Begrüße ${data.name} zum Login. Erwähne seinen Level ${data.level || 1} und XP ${data.totalXP || 0}.`, {}, data);
            speak(greeting.message);
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        handleFirestoreError(error, OperationType.GET, firebaseUser ? `users/${firebaseUser.uid}` : null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light');
    } else {
      document.body.classList.remove('light');
    }
  }, [theme]);

  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast.success("Erfolgreich angemeldet!");
    } catch (error) {
      toast.error("Anmeldung fehlgeschlagen.");
    }
  };

  const handleSignOut = () => signOut(auth);

  const handleUseTool = async () => {
    if (user) {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userDocRef);
        const data = userSnap.data() || {};
        const newToolsUsed = (data.toolsUsed || 0) + 1;
        
        await setDoc(userDocRef, { toolsUsed: newToolsUsed }, { merge: true });
        await checkAchievements(xp, level, streak, {
          lessonsCompleted: data.lessonsCompleted || 0,
          toolsUsed: newToolsUsed,
          goalsCompleted: data.goalsCompleted || 0
        });
      } catch (error) {
        console.error("Error updating tool usage:", error);
      }
    }
  };

  const handleGoalComplete = async () => {
    if (user) {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userDocRef);
        const data = userSnap.data() || {};
        const newGoalsCompleted = (data.goalsCompleted || 0) + 1;
        
        await setDoc(userDocRef, { goalsCompleted: newGoalsCompleted }, { merge: true });
        await checkAchievements(xp, level, streak, {
          lessonsCompleted: data.lessonsCompleted || 0,
          toolsUsed: data.toolsUsed || 0,
          goalsCompleted: newGoalsCompleted
        });
      } catch (error) {
        console.error("Error updating goal completion:", error);
      }
    }
  };

  const checkAchievements = async (newXP: number, newLevel: number, newStreak: number, stats: any = {}) => {
    if (!user) return;
    
    const achievementsToUnlock = [];
    
    if (newStreak >= 3) achievementsToUnlock.push('streak-3');
    if (newStreak >= 7) achievementsToUnlock.push('streak-7');
    if (newStreak >= 30) achievementsToUnlock.push('streak-30');
    if (newLevel >= 5) achievementsToUnlock.push('level-5');
    if (newLevel >= 10) achievementsToUnlock.push('level-10');
    if (newXP >= 1000) achievementsToUnlock.push('xp-1000');
    if (newXP >= 5000) achievementsToUnlock.push('xp-5000');
    
    if (stats.lessonsCompleted >= 1) achievementsToUnlock.push('lessons-1');
    if (stats.lessonsCompleted >= 10) achievementsToUnlock.push('lessons-10');
    if (stats.toolsUsed >= 1) achievementsToUnlock.push('tools-1');
    if (stats.goalsCompleted >= 1) achievementsToUnlock.push('goals-1');
    
    for (const achId of achievementsToUnlock) {
      const achRef = doc(db, 'user_achievements', `${user.uid}_${achId}`);
      const achSnap = await getDoc(achRef);
      
      if (!achSnap.exists()) {
        let bonus = 0;
        if (achId === 'streak-7') bonus = 100;
        if (achId === 'streak-30') bonus = 500;
        if (achId === 'level-10') bonus = 200;
        if (achId === 'xp-5000') bonus = 1000;

        await setDoc(achRef, {
          userId: user.uid,
          achievementId: achId,
          unlockedAt: serverTimestamp()
        });
        
        if (bonus > 0) {
          addXP(bonus);
          setXpToasts(prev => [...prev, { id: Date.now() + Math.random(), amount: bonus }]);
        }
        
        const achData = ACHIEVEMENTS.find(a => a.id === achId);
        if (achData) {
          setAchievementToasts(prev => [...prev, { id: Date.now() + Math.random(), achievement: achData }]);
          setEmotion('celebrating', 5000);
        }

        toast.success(`Neuer Erfolg freigeschaltet: ${achId}! ${bonus > 0 ? `+${bonus} XP Bonus!` : ''}`);
        speak(`Großartig! Du hast einen neuen Erfolg freigeschaltet. ${bonus > 0 ? `Du erhältst ${bonus} Bonus-Erfahrungspunkte.` : ''} Weiter so!`);
      }
    }
  };

  const handleCompleteLesson = async (points: number = 50) => {
    setEmotion('celebrating', 3000);
    setXpToasts(prev => [...prev, { id: Date.now(), amount: points }]);
    achievementEngine.trackEvent('lessonsCompleted');
    
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#6366F1', '#8B5CF6', '#EC4899']
    });
    
    const newXP = xp + points;
    const nextLevelXP = level * 1000;
    const newLevel = (newXP >= nextLevelXP && level < 50) ? level + 1 : level;
    
    addXP(points);
    
    if (user) {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data() || {};
        const newLessonsCompleted = (userData.lessonsCompleted || 0) + 1;

        await setDoc(doc(db, 'users', user.uid), { 
          totalXP: newXP,
          level: newLevel,
          lessonsCompleted: newLessonsCompleted
        }, { merge: true });
        
        await checkAchievements(newXP, newLevel, streak, {
          lessonsCompleted: newLessonsCompleted,
          toolsUsed: userData.toolsUsed || 0,
          goalsCompleted: userData.goalsCompleted || 0
        });

        if (newLevel > level) {
          toast.success(`LEVEL UP! Du bist jetzt Level ${newLevel}!`);
          speak(`Herzlichen Glückwunsch! Du hast Level ${newLevel} erreicht. Deine Fähigkeiten wachsen stetig.`);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
      }
    }

    toast.success(`+${points} XP! Lektion abgeschlossen.`);
    speak(`Hervorragend gemacht! Du hast die Lektion erfolgreich abgeschlossen und ${points} Erfahrungspunkte gesammelt.`);
    setCurrentView('dashboard');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Toaster position="bottom-right" />
      <AnimatedBackground />
      
      {xpToasts.map(t => (
        <div key={t.id}>
          <XPToast amount={t.amount} onComplete={() => setXpToasts(prev => prev.filter(x => x.id !== t.id))} />
        </div>
      ))}
      
      {achievementToasts.map(t => (
        <div key={t.id}>
          <AchievementToast achievement={t.achievement} onComplete={() => setAchievementToasts(prev => prev.filter(x => x.id !== t.id))} />
        </div>
      ))}

      <div className="min-h-screen bg-bg text-text-primary flex">
        {!user ? (
          <LandingPage onSignIn={handleSignIn} />
        ) : (
          <>
            <Sidebar currentView={currentView} setView={setCurrentView} onSignOut={handleSignOut} />
            {currentView === 'dashboard' && <Dashboard user={user} onStartLearn={() => setCurrentView('learn')} onOpenChat={() => setCurrentView('chat')} onGoalComplete={handleGoalComplete} />}
            {currentView === 'learn' && <LessonListView onSelectLesson={(lId) => { setSelectedLessonId(lId); setCurrentView('lesson-detail'); }} onBack={() => setCurrentView('dashboard')} />}
            {currentView === 'lesson-detail' && <LearnView user={user} lessonId={selectedLessonId} onComplete={handleCompleteLesson} onBack={() => setCurrentView('learn')} />}
            {currentView === 'chat' && <ChatView user={user} onBack={() => setCurrentView('dashboard')} />}
            {currentView === 'tools' && <ToolsView onBack={() => setCurrentView('dashboard')} onUseTool={handleUseTool} />}
            {currentView === 'profile' && <ProfileView user={user} onBack={() => setCurrentView('dashboard')} />}
            {currentView === 'settings' && <SettingsView onBack={() => setCurrentView('dashboard')} />}
          </>
        )}
      </div>
    </ErrorBoundary>
  );
}

function LessonListView({ onSelectLesson, onBack }: { onSelectLesson: (id: string) => void, onBack: () => void }) {
  const [chapters, setChapters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChapters = async () => {
      try {
        const q = collection(db, 'chapters');
        const snap = await getDocs(q);
        const chaptersData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setChapters(chaptersData.sort((a: any, b: any) => a.order - b.order));
      } catch (error) {
        console.error("Error fetching chapters:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchChapters();
  }, []);

  if (loading) return <div className="flex-1 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div></div>;

  return (
    <main className="flex-1 p-8 flex flex-col gap-8 overflow-y-auto h-screen relative z-10">
      <div className="flex justify-between items-center">
        <motion.h1 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-5xl font-black tracking-tighter"
        >
          Lernpfade
        </motion.h1>
        <GlassButton onClick={onBack} variant="ghost">← Zurück</GlassButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {chapters.map((chapter, idx) => (
          <PremiumCard 
            key={chapter.id} 
            delay={idx * 0.1}
            className="cursor-pointer group"
          >
            <div onClick={() => onSelectLesson(chapter.id)}>
              <div className="flex items-start justify-between mb-6">
                <div className="text-5xl transform group-hover:scale-110 transition-transform duration-500">{chapter.icon}</div>
                <div className="bg-primary/10 text-primary text-[10px] px-4 py-1.5 rounded-full font-black uppercase tracking-widest border border-primary/20">
                  {chapter.track}
                </div>
              </div>
              <h3 className="text-3xl font-black mb-3 group-hover:text-primary transition-colors tracking-tight">{chapter.title}</h3>
              <p className="text-text-secondary text-sm mb-8 leading-relaxed line-clamp-2">{chapter.description}</p>
              <div className="flex items-center justify-between mt-auto pt-6 border-t border-white/5">
                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-text-secondary">
                  <Zap className="w-4 h-4 text-primary" />
                  <span>{chapter.xpReward} XP Belohnung</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                  <ChevronRight className="w-6 h-6" />
                </div>
              </div>
            </div>
          </PremiumCard>
        ))}
      </div>
    </main>
  );
}

function SettingsView({ onBack }: { onBack: () => void }) {
  const [isSeeding, setIsSeeding] = useState(false);
  const { theme, setTheme } = useUserStore();
  const { isMuted, toggleMute } = useVoice();

  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      const chapters = ALL_CONTENT.getAllChapters();
      const lessons = ALL_CONTENT.getAllLessons();
      const exercises = ALL_CONTENT.getAllExercises();

      for (const chapter of chapters) {
        await setDoc(doc(db, 'chapters', chapter.id), chapter);
      }
      for (const lesson of lessons) {
        await setDoc(doc(db, 'lessons', lesson.id), lesson);
      }
      for (const exercise of exercises) {
        await setDoc(doc(db, 'exercises', exercise.id), exercise);
      }
      
      toast.success("Datenbank erfolgreich initialisiert!");
    } catch (error) {
      toast.error("Fehler beim Initialisieren.");
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <main className="flex-1 p-8 flex flex-col gap-8 overflow-y-auto h-screen relative z-10">
      <div className="flex justify-between items-center">
        <h1 className="text-5xl font-black tracking-tighter">Einstellungen</h1>
        <GlassButton onClick={onBack} variant="ghost">← Zurück</GlassButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <PremiumCard>
          <div className="card-title">ERSCHEINUNGSBILD</div>
          <div className="space-y-6 mt-4">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
              <div>
                <div className="font-black tracking-tight text-sm">Dunkler Modus</div>
                <div className="text-[10px] text-text-secondary uppercase tracking-widest font-bold">Schone deine Augen</div>
              </div>
              <button 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className={`w-12 h-6 rounded-full transition-all relative ${theme === 'dark' ? 'bg-primary' : 'bg-white/10'}`}
              >
                <motion.div 
                  animate={{ x: theme === 'dark' ? 24 : 4 }}
                  className="w-4 h-4 bg-white rounded-full absolute top-1 shadow-lg"
                />
              </button>
            </div>
          </div>
        </PremiumCard>

        <PremiumCard>
          <div className="card-title">AUDIO & STIMME</div>
          <div className="space-y-6 mt-4">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
              <div>
                <div className="font-black tracking-tight text-sm">Mia's Stimme</div>
                <div className="text-[10px] text-text-secondary uppercase tracking-widest font-bold">Sprachausgabe</div>
              </div>
              <button 
                onClick={toggleMute}
                className={`w-12 h-6 rounded-full transition-all relative ${!isMuted ? 'bg-primary' : 'bg-white/10'}`}
              >
                <motion.div 
                  animate={{ x: !isMuted ? 24 : 4 }}
                  className="w-4 h-4 bg-white rounded-full absolute top-1 shadow-lg"
                />
              </button>
            </div>
          </div>
        </PremiumCard>

        <PremiumCard className="md:col-span-2 border-primary/20 bg-primary/5">
          <div className="card-title">SYSTEM-ADMINISTRATION</div>
          <p className="text-text-secondary text-sm mb-6">Initialisiere die Lerninhalte in der Datenbank.</p>
          <GlassButton 
            onClick={handleSeed}
            disabled={isSeeding}
            className="self-start"
          >
            {isSeeding ? 'Initialisiere...' : 'Datenbank initialisieren'}
          </GlassButton>
        </PremiumCard>
      </div>
    </main>
  );
}

function ChatView({ user, onBack }: { user: any, onBack: () => void }) {
  const [messages, setMessages] = useState<{ role: 'user' | 'mia', text: string, emotion?: string }[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState('happy');
  const { xp, level, streak } = useUserStore();
  const { speak } = useVoice();

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setIsThinking(true);

    try {
      const response = await getMiaResponse(userMsg, {}, { xp, level, streak });
      setMessages(prev => [...prev, { role: 'mia', text: response.message, emotion: response.emotion }]);
      setCurrentEmotion(response.emotion || 'happy');
      speak(response.message);
      
      const memoryRef = doc(db, 'coach_memory', user.uid);
      await setDoc(memoryRef, {
        userId: user.uid,
        lastInteractionAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });

    } catch (error) {
      toast.error("Mia konnte nicht antworten.");
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <main className="flex-1 p-8 flex flex-col h-screen z-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold flex items-center gap-3">
          <div className={`mia-avatar mia-emotion-${currentEmotion} w-10 h-10 text-lg ${isThinking ? 'mia-thinking' : ''}`}>🤖</div> Chat mit Mia
        </h1>
        <button onClick={onBack} className="text-text-secondary hover:text-text-primary transition-colors">← Zurück</button>
      </div>

      <div className="flex-1 bg-bg-card border border-border rounded-3xl p-6 overflow-y-auto flex flex-col gap-4 mb-6">
        {messages.map((msg, i) => (
          <div key={i} className={`max-w-[80%] p-4 rounded-2xl ${msg.role === 'user' ? 'bg-primary self-end rounded-tr-none' : 'bg-bg-elevated self-start rounded-tl-none'}`}>
            {msg.text}
          </div>
        ))}
        {isThinking && <div className="bg-bg-elevated self-start p-4 rounded-2xl rounded-tl-none animate-pulse">Mia überlegt...</div>}
      </div>

      <div className="flex gap-4">
        <input 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Frag Mia etwas..."
          className="flex-1 bg-bg-elevated border border-border rounded-2xl px-6 outline-none focus:border-primary transition-all"
        />
        <button 
          onClick={handleSend}
          disabled={isThinking || !input.trim()}
          className="btn-primary-dynamic disabled:opacity-50"
        >
          Senden
        </button>
      </div>
    </main>
  );
}

function PromptGenerator({ onUse }: { onUse: () => void }) {
  const [role, setRole] = useState('');
  const [task, setTask] = useState('');
  const [context, setContext] = useState('');
  const [format, setFormat] = useState('');
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await getMiaResponse(`Erstelle einen professionellen Prompt basierend auf diesen Daten: Rolle: ${role}, Aufgabe: ${task}, Kontext: ${context}, Format: ${format}. Gib nur den fertigen Prompt zurück.`, {}, {});
      setGeneratedPrompt(response.message);
      onUse();
    } catch (error) {
      toast.error("Fehler beim Generieren.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bento-card gap-4">
        <div className="card-title">PROMPT-BAUSTEINE</div>
        <div className="flex flex-col gap-3">
          <label className="text-xs text-text-secondary font-bold">ROLLE (z.B. Marketing Experte)</label>
          <input value={role} onChange={e => setRole(e.target.value)} className="bg-bg-elevated border border-border p-3 rounded-xl outline-none focus:border-primary" placeholder="Wer soll die KI sein?" />
          
          <label className="text-xs text-text-secondary font-bold">AUFGABE (z.B. E-Mail schreiben)</label>
          <input value={task} onChange={e => setTask(e.target.value)} className="bg-bg-elevated border border-border p-3 rounded-xl outline-none focus:border-primary" placeholder="Was soll die KI tun?" />
          
          <label className="text-xs text-text-secondary font-bold">KONTEXT (z.B. Zielgruppe: Senioren)</label>
          <textarea value={context} onChange={e => setContext(e.target.value)} className="bg-bg-elevated border border-border p-3 rounded-xl outline-none focus:border-primary h-24 resize-none" placeholder="Welche Hintergrundinfos sind wichtig?" />
          
          <label className="text-xs text-text-secondary font-bold">FORMAT (z.B. Bullet Points)</label>
          <input value={format} onChange={e => setFormat(e.target.value)} className="bg-bg-elevated border border-border p-3 rounded-xl outline-none focus:border-primary" placeholder="Wie soll das Ergebnis aussehen?" />
          
          <button onClick={handleGenerate} disabled={isGenerating || !task} className="btn-primary-dynamic mt-4">
            {isGenerating ? 'Generiere...' : 'Prompt generieren'}
          </button>
        </div>
      </div>
      <div className="bento-card">
        <div className="card-title">ERGEBNIS</div>
        {generatedPrompt ? (
          <div className="flex flex-col h-full">
            <div className="bg-bg-elevated p-6 rounded-2xl border border-primary/20 text-lg leading-relaxed flex-1 mb-4">
              {generatedPrompt}
            </div>
            <button onClick={() => { navigator.clipboard.writeText(generatedPrompt); toast.success("Kopiert!"); }} className="btn-secondary-dynamic">Kopieren</button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-text-secondary text-center gap-4">
            <div className="text-4xl opacity-20">✨</div>
            <p>Fülle die Bausteine links aus,<br/>um deinen perfekten Prompt zu erstellen.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function PromptComparison({ onUse }: { onUse: () => void }) {
  const [promptA, setPromptA] = useState('');
  const [promptB, setPromptB] = useState('');
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleCompare = async () => {
    setIsAnalyzing(true);
    try {
      const response = await getMiaResponse(`Vergleiche diese zwei Prompts und erkläre die Unterschiede in Bezug auf Klarheit, Spezifität und erwartetes Ergebnis. Prompt A: "${promptA}", Prompt B: "${promptB}".`, {}, {});
      setAnalysis(response.message);
      onUse();
    } catch (error) {
      toast.error("Analyse fehlgeschlagen.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bento-card gap-4">
          <div className="card-title">PROMPT A</div>
          <textarea value={promptA} onChange={e => setPromptA(e.target.value)} className="bg-bg-elevated border border-border p-4 rounded-xl outline-none focus:border-primary h-48 resize-none" placeholder="Erster Prompt..." />
        </div>
        <div className="bento-card gap-4">
          <div className="card-title">PROMPT B</div>
          <textarea value={promptB} onChange={e => setPromptB(e.target.value)} className="bg-bg-elevated border border-border p-4 rounded-xl outline-none focus:border-primary h-48 resize-none" placeholder="Zweiter Prompt..." />
        </div>
      </div>
      <button onClick={handleCompare} disabled={isAnalyzing || !promptA || !promptB} className="btn-primary-dynamic self-center px-12">
        {isAnalyzing ? 'Analysiere...' : 'Prompts vergleichen'}
      </button>
      {analysis && (
        <div className="bento-card border-primary/30">
          <div className="card-title">MIA'S ANALYSE</div>
          <p className="text-lg leading-relaxed">{analysis}</p>
        </div>
      )}
    </div>
  );
}

function RealScenarios({ onUse }: { onUse: () => void }) {
  const scenarios = [
    { id: 'marketing', title: 'Marketing Kampagne', description: 'Erstelle einen Prompt für eine virale Social Media Kampagne.', icon: '📱' },
    { id: 'coding', title: 'Code Review', description: 'Lass die KI deinen Code auf Sicherheitslücken prüfen.', icon: '💻' },
    { id: 'support', title: 'Kundensupport', description: 'Automatisiere Antworten auf komplexe Kundenanfragen.', icon: '🎧' },
    { id: 'writing', title: 'Ghostwriting', description: 'Schreibe einen Blogartikel im Stil eines bekannten Autors.', icon: '✍️' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {scenarios.map(s => (
        <div key={s.id} className="bento-card group hover:border-primary/50 cursor-pointer transition-all">
          <div className="flex gap-6 items-start">
            <div className="text-4xl bg-bg-elevated p-4 rounded-2xl group-hover:scale-110 transition-transform">{s.icon}</div>
            <div>
              <h3 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">{s.title}</h3>
              <p className="text-text-secondary mb-4">{s.description}</p>
              <button onClick={onUse} className="btn-secondary-dynamic text-xs py-2">Szenario starten</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ToolsView({ onBack, onUseTool }: { onBack: () => void, onUseTool: () => void }) {
  const tools = [
    { 
      id: 'generator', 
      title: 'Prompt Generator', 
      description: 'Erstelle strukturierte Prompts mit Mia.', 
      icon: '⚡',
      component: <PromptGenerator onUse={onUseTool} />
    },
    { 
      id: 'comparison', 
      title: 'Prompt Vergleich', 
      description: 'Vergleiche zwei Prompts und sieh den Unterschied.', 
      icon: '⚖️',
      component: <PromptComparison onUse={onUseTool} />
    },
    { 
      id: 'scenarios', 
      title: 'Reale Szenarien', 
      description: 'Übe an echten Business-Cases.', 
      icon: '🏢',
      component: <RealScenarios onUse={onUseTool} />
    },
  ];

  return <ToolsLayout tools={tools} onBack={onBack} />;
}

function ProfileView({ user, onBack }: { user: User, onBack: () => void }) {
  const { xp, level, streak, performance } = useUserStore();
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
  
  useEffect(() => {
    const fetchAchievements = async () => {
      const q = query(collection(db, 'user_achievements'), where('userId', '==', user.uid));
      const snap = await getDocs(q);
      setUnlockedAchievements(snap.docs.map(doc => doc.data().achievementId));
    };
    fetchAchievements();
  }, [user.uid]);

  // Mock heatmap data
  const days = Array.from({ length: 28 }, (_, i) => ({
    day: i + 1,
    intensity: Math.floor(Math.random() * 4)
  }));

  const allAchievements = [
    { id: 'streak-3', title: '3 Tage Streak', icon: '🔥' },
    { id: 'streak-7', title: '7 Tage Streak', icon: '⚡' },
    { id: 'streak-30', title: '30 Tage Streak', icon: '👑' },
    { id: 'level-5', title: 'Level 5 Erreicht', icon: '🎯' },
    { id: 'level-10', title: 'Level 10 Erreicht', icon: '🏅' },
    { id: 'xp-1000', title: '1000 XP Sammler', icon: '💎' },
    { id: 'xp-5000', title: '5000 XP Legende', icon: '🌟' },
    { id: 'lessons-1', title: 'Erste Lektion', icon: '📚' },
    { id: 'lessons-10', title: 'Lern-Profi', icon: '🎓' },
    { id: 'tools-1', title: 'Werkzeug-Nutzer', icon: '🛠' },
    { id: 'goals-1', title: 'Ziel-Erreicht', icon: '✅' },
  ];

  const weaknesses = performance.filter(p => p.score < 70 && p.count > 0);

  return (
    <main className="flex-1 p-8 flex flex-col gap-8 overflow-y-auto h-screen relative z-10">
      <div className="flex justify-between items-center">
        <h1 className="text-5xl font-black tracking-tighter">Profil</h1>
        <GlassButton onClick={onBack} variant="ghost">← Zurück</GlassButton>
      </div>

      <div className="grid grid-cols-4 gap-8">
        <PremiumCard className="col-span-4 md:col-span-1 flex flex-col items-center text-center py-10">
          <div className="w-24 h-24 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-4xl mb-6 shadow-2xl border-4 border-white/10">
            {user.displayName?.[0] || 'U'}
          </div>
          <h2 className="text-3xl font-black tracking-tight mb-2">{user.displayName || 'User'}</h2>
          <p className="text-text-secondary text-sm mb-8">{user.email}</p>
          <div className="bg-primary/10 text-primary px-6 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/20">
            LEVEL {level}
          </div>
        </PremiumCard>

        <PremiumCard className="col-span-4 md:col-span-3">
          <div className="card-title">PERFORMANCE-ANALYSE</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-6">
            {performance.map(p => (
              <div key={p.category} className="flex flex-col gap-3">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-text-secondary">
                  <span>{p.category}</span>
                  <span className="text-text-primary">{Math.round(p.score)}%</span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${p.score}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className={`h-full transition-all duration-1000 ${p.score < 70 ? 'bg-danger' : 'bg-success shadow-[0_0_10px_rgba(16,185,129,0.5)]'}`} 
                  />
                </div>
              </div>
            ))}
          </div>
          {weaknesses.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 p-6 bg-danger/5 border border-danger/10 rounded-2xl"
            >
              <h4 className="text-xs font-black text-danger mb-2 uppercase tracking-widest">Mia empfiehlt Fokus auf:</h4>
              <p className="text-sm text-text-secondary leading-relaxed">
                Wiederhole Übungen in <span className="text-text-primary font-bold">{weaknesses.map(w => w.category).join(', ')}</span>, um deine Meisterschaft zu festigen.
              </p>
            </motion.div>
          )}
        </PremiumCard>

        <PremiumCard className="col-span-4 md:col-span-2">
          <div className="card-title">AKTIVITÄT</div>
          <div className="flex items-center gap-8 h-full">
            <div className="flex flex-col items-center">
              <div className="text-5xl font-black tracking-tighter">{streak}</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Tage Streak 🔥</div>
            </div>
            <div className="flex-1 grid grid-cols-7 gap-2">
              {Array.from({ length: 28 }).map((_, i) => (
                <div 
                  key={i} 
                  className={`aspect-square rounded-sm ${Math.random() > 0.7 ? 'bg-primary/40' : 'bg-white/5'}`}
                />
              ))}
            </div>
          </div>
        </PremiumCard>

        <PremiumCard className="col-span-4 md:col-span-2">
          <div className="card-title">ERFOLGE ({unlockedAchievements.length}/{allAchievements.length})</div>
          <div className="grid grid-cols-4 md:grid-cols-6 gap-6 mt-4">
            {allAchievements.map(ach => (
              <div 
                key={ach.id} 
                className={`flex flex-col items-center gap-2 ${unlockedAchievements.includes(ach.id) ? 'opacity-100' : 'opacity-20 grayscale'}`}
                title={ach.title}
              >
                <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-2xl border border-white/5 shadow-lg">
                  {ach.icon}
                </div>
              </div>
            ))}
          </div>
        </PremiumCard>
      </div>
    </main>
  );
}

function Sidebar({ currentView, setView, onSignOut }: { currentView: View, setView: (v: View) => void, onSignOut: () => void }) {
  const { theme, setTheme } = useUserStore();
  const { isMuted, toggleMute } = useVoice();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'learn', label: 'Lernpfade', icon: BookOpen },
    { id: 'tools', label: 'Werkzeuge', icon: Zap },
    { id: 'chat', label: 'Mia Chat', icon: MessageSquare },
    { id: 'profile', label: 'Profil', icon: Trophy },
    { id: 'settings', label: 'Einstellungen', icon: Settings },
  ];

  return (
    <aside className="w-72 h-screen bg-white/[0.02] backdrop-blur-3xl border-r border-white/5 flex flex-col p-6 relative z-20">
      <div className="flex items-center gap-3 mb-12 px-2">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)]">
          <Zap className="w-6 h-6 text-white" />
        </div>
        <span className="text-xl font-black tracking-tighter">PromptMeister</span>
      </div>

      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => (
          <div
            key={item.id}
            onClick={() => setView(item.id as View)}
            className={`sidebar-item ${currentView === item.id ? 'active' : ''}`}
          >
            <item.icon className={`w-5 h-5 ${currentView === item.id ? 'text-primary' : ''}`} />
            {item.label}
          </div>
        ))}
      </nav>

      <div className="mt-auto space-y-4">
        <div className="flex items-center justify-between px-2">
          <button 
            onClick={toggleMute}
            className="p-3 rounded-xl hover:bg-white/5 transition-colors text-text-secondary hover:text-text-primary"
            title={isMuted ? "Stimme einschalten" : "Stimme ausschalten"}
          >
            {isMuted ? <Mic className="w-5 h-5 opacity-50" /> : <Mic className="w-5 h-5 text-primary" />}
          </button>
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-3 rounded-xl hover:bg-white/5 transition-colors text-text-secondary hover:text-text-primary"
          >
            {theme === 'dark' ? '🌙' : '☀️'}
          </button>
        </div>
        
        <div 
          onClick={onSignOut}
          className="sidebar-item text-danger hover:bg-danger/10 hover:text-danger"
        >
          <LogOut className="w-5 h-5" />
          Abmelden
        </div>
      </div>
    </aside>
  );
}

function LandingPage({ onSignIn }: { onSignIn: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen p-4 text-center relative overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10"
      >
        <h1 className="text-9xl font-black mb-6 gradient-text tracking-tighter filter drop-shadow-2xl">PromptMeister</h1>
        <p className="text-2xl text-text-secondary max-w-2xl mb-12 font-medium leading-relaxed">
          Werde zum Experten im Schreiben von KI-Prompts. <br />
          Lerne mit <span className="text-primary font-bold">Mia</span>, deiner persönlichen KI-Coachin.
        </p>
        <GlassButton onClick={onSignIn} className="text-lg px-12 py-5">
          Kostenlos starten
        </GlassButton>
      </motion.div>
      
      {/* Decorative Elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
    </div>
  );
}

function Dashboard({ user, onStartLearn, onOpenChat, onGoalComplete }: { user: User, onStartLearn: () => void, onOpenChat: () => void, onGoalComplete: () => void }) {
  const { setEmotion } = useMiaEmotion();
  const [miaMessage, setMiaMessage] = useState("\"Willkommen zurück! Bereit für eine neue Lektion?\"");
  const { xp, level, streak, addXP, dailyGoals } = useUserStore();
  const { speak } = useVoice();

  const completedGoals = dailyGoals.filter(g => g.completed).length;
  const allGoalsCompleted = completedGoals === dailyGoals.length && dailyGoals.length > 0;

  useEffect(() => {
    if (allGoalsCompleted) {
      const bonusKey = `bonus-${new Date().toDateString()}`;
      if (!localStorage.getItem(bonusKey)) {
        addXP(100);
        localStorage.setItem(bonusKey, 'true');
        onGoalComplete();
        setEmotion('celebrating', 5000);
        toast.success("Tagesbonus erhalten! +100 XP");
        speak("Hervorragend! Du hast alle deine Tagesziele erreicht. Hier ist dein Bonus von einhundert Erfahrungspunkten.");
      }
    }
  }, [allGoalsCompleted, addXP, onGoalComplete, setEmotion]);

  const askMia = async () => {
    setEmotion('thoughtful', 2000);
    onOpenChat();
  };

  return (
    <main className="flex-1 p-8 grid grid-cols-4 grid-rows-[auto_repeat(3,1fr)] gap-6 overflow-y-auto h-screen relative z-10">
      <div className="col-span-4 flex justify-between items-center mb-2">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="user-greeting"
        >
          <h1 className="text-4xl font-black tracking-tight">Hallo, {user.displayName || 'Admin'}! 👋</h1>
          <p className="text-text-secondary font-medium">Bereit für den nächsten Schritt zur Meisterschaft?</p>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-2xl flex items-center gap-4 shadow-xl"
        >
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-widest font-black text-text-secondary">Level</span>
            <span className="font-black text-xl leading-none">{level}</span>
          </div>
          <div className="w-[120px] h-2">
            <AnimatedProgressBar progress={(xp % 1000) / 10} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-widest font-black text-text-secondary">XP</span>
            <span className="font-black text-xl leading-none">{xp}</span>
          </div>
        </motion.div>
      </div>

      <PremiumCard className="col-span-2 row-span-2 bg-gradient-to-br from-primary/20 to-secondary/10 border-primary/20" delay={0.1}>
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Zap className="w-32 h-32 text-white" />
        </div>
        <div className="relative z-10 h-full flex flex-col">
          <div className="card-title">AKTUELL IN ARBEIT <span className="text-primary">Kapitel 3</span></div>
          <div className="mt-auto">
            <h2 className="text-5xl font-black mb-4 tracking-tighter">Rollen-Prompting</h2>
            <p className="text-text-secondary text-lg mb-8 max-w-md leading-relaxed">
              Lerne, wie du der KI spezifische Identitäten zuweist, um die Antwortqualität um <span className="text-primary font-bold">40%</span> zu steigern.
            </p>
            <GlassButton onClick={onStartLearn} className="self-start px-8">
              Lektion fortsetzen <ChevronRight className="w-4 h-4" />
            </GlassButton>
          </div>
        </div>
      </PremiumCard>

      <PremiumCard className="col-span-1 row-span-1" delay={0.2}>
        <div className="card-title">STREAK <span className="text-warning">🔥</span></div>
        <div className="stat-val text-5xl">{streak} TAGE</div>
        <div className="stat-label mt-2">Du bist unaufhaltsam!</div>
      </PremiumCard>

      <PremiumCard className="col-span-1 row-span-1" delay={0.3}>
        <div className="card-title">XP GESAMT</div>
        <div className="stat-val text-5xl">{xp}</div>
        <div className="stat-label mt-2">Dein Weg zur Legende</div>
      </PremiumCard>

      <PremiumCard className="col-span-1 row-span-2 border-accent/30" delay={0.4}>
        <div className="card-title">LERNCOACH <span className="text-accent">Mia</span></div>
        <div onClick={askMia} className="mx-auto mb-6 cursor-pointer transform hover:scale-105 transition-transform duration-500">
          <MiaAvatar />
        </div>
        <motion.div 
          key={miaMessage}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 p-5 rounded-2xl rounded-bl-none text-sm leading-relaxed mb-6 min-h-[120px] border border-white/5 italic text-text-primary/90"
        >
          {miaMessage}
        </motion.div>
        <GlassButton onClick={askMia} variant="secondary" className="mt-auto w-full text-xs py-3">
          Mia eine Frage stellen...
        </GlassButton>
      </PremiumCard>

      <PremiumCard className="col-span-2 row-span-1" delay={0.5}>
        <div className="card-title">DEINE TRACKS</div>
        <div className="flex flex-col gap-6 mt-2">
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-text-secondary">
              <span>Prompting</span>
              <span>65%</span>
            </div>
            <AnimatedProgressBar progress={65} height="h-2.5" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-text-secondary">
              <span>Kontext</span>
              <span>30%</span>
            </div>
            <AnimatedProgressBar progress={30} color="bg-secondary" height="h-2.5" />
          </div>
        </div>
      </PremiumCard>

      <PremiumCard className="col-span-1 row-span-1" delay={0.6}>
        <div className="card-title">TAGESZIELE <span className={allGoalsCompleted ? "text-success" : "text-primary"}>{completedGoals}/{dailyGoals.length}</span></div>
        <div className="flex flex-col gap-4">
          {dailyGoals.map((goal, idx) => (
            <div key={goal.id} className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-tighter">
                <span className={goal.completed ? "text-success line-through opacity-50" : "text-text-primary"}>{goal.text}</span>
                <span className="text-text-secondary">{goal.current}/{goal.target}</span>
              </div>
              <AnimatedProgressBar 
                progress={(goal.current / goal.target) * 100} 
                color={goal.completed ? 'bg-success' : 'bg-primary'}
                height="h-1.5"
              />
            </div>
          ))}
          {allGoalsCompleted && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mt-2 text-[10px] text-success font-black text-center bg-success/10 py-1 rounded-lg border border-success/20"
            >
              🎉 TAGESBONUS AKTIVIERT
            </motion.div>
          )}
        </div>
      </PremiumCard>

      <PremiumCard className="col-span-1 row-span-1 border-success/30" delay={0.7}>
        <div className="card-title">DAILY CHECK-IN</div>
        <GlassButton 
          onClick={() => {
            toast.success("+20 XP! Bis morgen!");
            addXP(20);
            speak("Schön, dass du heute wieder da bist! Kontinuität ist der Schlüssel zum Erfolg.");
          }}
          variant="secondary"
          className="w-full py-3 bg-success/10 text-success border-success/20 hover:bg-success/20"
        >
          XP abholen
        </GlassButton>
      </PremiumCard>

      <PremiumCard className="col-span-4 row-span-1" delay={0.8}>
        <div className="card-title">DEINE ERFOLGE</div>
        <div className="flex gap-8 overflow-x-auto pb-4 px-2">
          {[
            { icon: '🔥', label: '3 Tage Streak', unlocked: true },
            { icon: '🎯', label: 'Präzisions-Meister', unlocked: true },
            { icon: '👑', label: 'Level 10', unlocked: false },
            { icon: '💎', label: 'Premium-Meister', unlocked: false },
            { icon: '🚀', label: 'Prompt-Pionier', unlocked: false },
          ].map((ach, i) => (
            <motion.div 
              key={i}
              whileHover={{ scale: 1.05, y: -5 }}
              className={`flex flex-col items-center gap-3 min-w-[120px] ${!ach.unlocked ? 'opacity-30 grayscale' : ''}`}
            >
              <div className="w-20 h-20 bg-white/5 rounded-[24px] flex items-center justify-center text-4xl border border-white/10 shadow-lg relative overflow-hidden group">
                {ach.unlocked && <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />}
                {ach.icon}
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-center">{ach.label}</span>
            </motion.div>
          ))}
        </div>
      </PremiumCard>
    </main>
  );
}

function LearnView({ user, lessonId, onComplete, onBack }: { user: any, lessonId: string | null, onComplete: (xp: number) => void, onBack: () => void }) {
  const [lesson, setLesson] = useState<any>(null);
  const [exercises, setExercises] = useState<any[]>([]);
  const [currentExerciseIdx, setCurrentExerciseIdx] = useState(0);
  const [answer, setAnswer] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [totalScore, setTotalScore] = useState(0);
  const { speak } = useVoice();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const id = lessonId || 'p-l1-1';
        const lessonRef = doc(db, 'lessons', id);
        const lessonSnap = await getDoc(lessonRef);
        
        if (lessonSnap.exists()) {
          const lessonData = lessonSnap.data();
          setLesson(lessonData);
          
          // Fetch exercises for this lesson
          const exQuery = query(collection(db, 'exercises'), where('lessonId', '==', id));
          const exSnap = await getDocs(exQuery);
          let exData = exSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          
          // Adaptive Difficulty Adjustment
          const avgScore = performance.reduce((acc, p) => acc + p.score, 0) / performance.length;
          if (avgScore > 85) {
            // User is doing great, prefer ADVANCED exercises
            const advanced = exData.filter((ex: any) => ex.difficulty === 'ADVANCED');
            if (advanced.length > 0) exData = advanced;
          } else if (avgScore < 60) {
            // User is struggling, prefer BEGINNER exercises
            const beginner = exData.filter((ex: any) => ex.difficulty === 'BEGINNER');
            if (beginner.length > 0) exData = beginner;
          }

          setExercises(exData.length > 0 ? exData : [
            { id: 'fallback', question: 'Beschreibe das Gelernte in einem Satz.', type: 'FREE_TEXT', evaluationCriteria: 'Bezug zum Lektionsthema.' }
          ]);
          
          speak(`Lektion: ${lessonData.title}. ${lessonData.content}`);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [lessonId]);

  const handleListen = async () => {
    setIsListening(true);
    try {
      const text = await listen();
      setAnswer(prev => prev + ' ' + text);
    } catch (error) {
      toast.error("Spracherkennung fehlgeschlagen.");
    } finally {
      setIsListening(false);
    }
  };

  const { xp, level, streak, addXP, updateGoal, updatePerformance, performance } = useUserStore();

  const handleSubmit = async () => {
    if (!answer.trim() || !lesson) return;
    setIsEvaluating(true);
    const currentEx = exercises[currentExerciseIdx];
    try {
      const result = await evaluateExercise(answer, currentEx.question, currentEx.evaluationCriteria || "Korrektheit und Relevanz.");
      setFeedback(result);
      
      // Enhanced Feedback for low scores
      if (result.totalScore < 70) {
        const advice = `Mia: "Das war ein guter Versuch, aber wir können das noch verbessern. ${result.feedback} Besonders wichtig: ${result.improvements?.join(' ')} ${result.missingElements?.length ? `Es fehlen noch: ${result.missingElements.join(', ')}.` : ''}"`;
        speak(advice);
      } else {
        speak(result.feedback);
      }
      
      // Track performance for adaptive engine
      if (result.categories) {
        Object.entries(result.categories).forEach(([cat, score]) => {
          updatePerformance(cat, score as number);
        });
      }

      if (result.totalScore >= 70) {
        const newTotal = totalScore + result.totalScore;
        setTotalScore(newTotal);
        
        // Update daily goals
        if (result.totalScore >= 85) updateGoal('goal-1', 1); // Goal: Score 85+
        updateGoal('goal-3', 1); // Goal: Complete exercise

        if (currentExerciseIdx < exercises.length - 1) {
          toast.success("Gut gemacht! Nächste Aufgabe.");
          setTimeout(() => {
            setCurrentExerciseIdx(prev => prev + 1);
            setAnswer('');
            setFeedback(null);
          }, 3000);
        } else {
          // Update CoachMemory
          if (user) {
            const memoryRef = doc(db, 'coach_memory', user.uid);
            await setDoc(memoryRef, {
              userId: user.uid,
              lastTopics: arrayUnion(lesson.title),
              updatedAt: serverTimestamp()
            }, { merge: true });
          }
          
          updateGoal('goal-0', 1); // Goal: Complete lesson
          onComplete(Math.round(newTotal / exercises.length));
        }
      } else {
        toast.error("Noch nicht ganz perfekt. Versuche es nochmal!");
      }
    } catch (error) {
      toast.error("Fehler bei der Auswertung.");
    } finally {
      setIsEvaluating(false);
    }
  };

  if (loading) return <div className="flex-1 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div></div>;
  if (!lesson) return <div className="flex-1 flex items-center justify-center text-text-secondary">Lektion nicht gefunden.</div>;

  const currentEx = exercises[currentExerciseIdx];

  return (
    <main className="flex-1 p-8 flex flex-col gap-8 overflow-y-auto h-screen relative">
      <div className="absolute inset-0 opacity-5 pointer-events-none bg-[url('https://picsum.photos/seed/analysis/1920/1080?blur=10')] bg-cover"></div>
      
      <div className="flex justify-between items-center z-10">
        <button onClick={onBack} className="text-text-secondary hover:text-text-primary transition-colors flex items-center gap-2">
          ← Zurück
        </button>
        <div className="text-sm text-text-secondary">Aufgabe {currentExerciseIdx + 1} von {exercises.length}</div>
      </div>

      <div className="max-w-4xl mx-auto w-full flex flex-col gap-8 z-10">
        <div className="bento-card">
          <h1 className="text-4xl font-bold mb-4">{lesson.title}</h1>
          <p className="text-text-secondary text-lg leading-relaxed">{lesson.content}</p>
        </div>

        <div className="bento-card border-primary/30">
          <div className="card-title">AUFGABE {currentExerciseIdx + 1}</div>
          <p className="text-xl mb-6 font-medium">{currentEx?.question}</p>
          <div className="relative">
            <textarea 
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Deine Antwort..."
              className="w-full h-48 bg-bg-elevated border border-border rounded-2xl p-6 text-lg focus:border-primary outline-none transition-all resize-none mb-6"
            />
            <button 
              onClick={handleListen}
              className={`absolute bottom-10 right-6 p-3 rounded-full transition-all ${isListening ? 'bg-danger animate-pulse' : 'bg-white/10 hover:bg-white/20'}`}
              title="Per Sprache eingeben"
            >
              <Mic className="w-5 h-5" />
            </button>
          </div>
          <button 
            onClick={handleSubmit}
            disabled={isEvaluating || !answer.trim()}
            className="btn-primary-dynamic self-end disabled:opacity-50"
          >
            {isEvaluating ? 'Wird ausgewertet...' : 'Antwort einreichen'}
          </button>
        </div>

        {feedback && (
          <div className={`bento-card ${feedback.totalScore >= 70 ? 'border-success/50' : 'border-danger/50'}`}>
            <div className="card-title">FEEDBACK <span>Score: {feedback.totalScore}/100</span></div>
            <p className="text-lg mb-4">{feedback.feedback}</p>
            {feedback.improvements && feedback.improvements.length > 0 && (
              <ul className="list-disc list-inside text-text-secondary">
                {feedback.improvements.map((s: string, i: number) => <li key={i}>{s}</li>)}
              </ul>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
