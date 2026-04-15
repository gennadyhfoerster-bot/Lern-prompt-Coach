import { Chapter, Lesson, Exercise, TrackType, LessonType, ExerciseType, DifficultyLevel } from '../types';

export const PROMPT_TRACK: { chapters: Chapter[], lessons: Lesson[], exercises: Exercise[] } = {
  chapters: [
    {
      id: 'p-ch1',
      track: 'PROMPT',
      order: 1,
      title: 'Grundlagen des Prompting',
      description: 'Lerne die Basis für effektive KI-Kommunikation.',
      icon: '🎯',
      xpReward: 200,
      isLocked: false,
      requiredXP: 0
    },
    {
      id: 'p-ch2',
      track: 'PROMPT',
      order: 2,
      title: 'Rollen & Identität',
      description: 'Weise der KI spezifische Expertenrollen zu.',
      icon: '👤',
      xpReward: 200,
      isLocked: false,
      requiredXP: 1000
    },
    {
      id: 'p-ch3',
      track: 'PROMPT',
      order: 3,
      title: 'Spezifität & Details',
      description: 'Präzision ist der Schlüssel zu Qualität.',
      icon: '🔍',
      xpReward: 200,
      isLocked: false,
      requiredXP: 2000
    },
    {
      id: 'p-ch4',
      track: 'PROMPT',
      order: 4,
      title: 'Formate & Strukturen',
      description: 'Steuere die Ausgabeformate der KI.',
      icon: '📊',
      xpReward: 200,
      isLocked: false,
      requiredXP: 3000
    },
    {
      id: 'p-ch5',
      track: 'PROMPT',
      order: 5,
      title: 'Fortgeschrittene Techniken',
      description: 'Chain-of-Thought und Few-Shot Prompting.',
      icon: '🧠',
      xpReward: 200,
      isLocked: false,
      requiredXP: 4000
    }
  ],
  lessons: [
    // Chapter 1 Lessons
    { id: 'p-l1-1', chapterId: 'p-ch1', order: 1, title: 'Was ist ein Prompt?', content: 'Ein Prompt ist die Anweisung an die KI...', type: 'THEORY', xpReward: 50 },
    { id: 'p-l1-2', chapterId: 'p-ch1', order: 2, title: 'Die Anatomie eines Prompts', content: 'Ein guter Prompt besteht aus Ziel, Kontext...', type: 'PRACTICE', xpReward: 50 },
    { id: 'p-l1-3', chapterId: 'p-ch1', order: 3, title: 'Einfache Anweisungen', content: 'Lerne klare Verben zu nutzen...', type: 'CHALLENGE', xpReward: 50 },
    // Chapter 2 Lessons
    { id: 'p-l2-1', chapterId: 'p-ch2', order: 1, title: 'Experten-Personas', content: 'Warum Rollen die Qualität steigern...', type: 'THEORY', xpReward: 50 },
    { id: 'p-l2-2', chapterId: 'p-ch2', order: 2, title: 'Die "Handle als..." Technik', content: 'Praktische Anwendung von Rollen...', type: 'PRACTICE', xpReward: 50 },
    { id: 'p-l2-3', chapterId: 'p-ch2', order: 3, title: 'Komplexe Identitäten', content: 'Kombiniere Rollen mit spezifischem Wissen...', type: 'CHALLENGE', xpReward: 50 },
    // Chapter 3 Lessons
    { id: 'p-l3-1', chapterId: 'p-ch3', order: 1, title: 'Vermeidung von Ambiguität', content: 'Sei so klar wie möglich...', type: 'THEORY', xpReward: 50 },
    { id: 'p-l3-2', chapterId: 'p-ch3', order: 2, title: 'Parameter & Constraints', content: 'Setze Grenzen für die KI...', type: 'PRACTICE', xpReward: 50 },
    { id: 'p-l3-3', chapterId: 'p-ch3', order: 3, title: 'Iterative Verfeinerung', content: 'Verbessere deinen Prompt schrittweise...', type: 'CHALLENGE', xpReward: 50 },
    // Chapter 4 Lessons
    { id: 'p-l4-1', chapterId: 'p-ch4', order: 1, title: 'Listen & Tabellen', content: 'Strukturiere die Ausgabe...', type: 'THEORY', xpReward: 50 },
    { id: 'p-l4-2', chapterId: 'p-ch4', order: 2, title: 'JSON & Code-Ausgabe', content: 'Für technische Anwendungen...', type: 'PRACTICE', xpReward: 50 },
    { id: 'p-l4-3', chapterId: 'p-ch4', order: 3, title: 'Kreative Formate', content: 'Gedichte, Skripte, E-Mails...', type: 'CHALLENGE', xpReward: 50 },
    // Chapter 5 Lessons
    { id: 'p-l5-1', chapterId: 'p-ch5', order: 1, title: 'Chain-of-Thought', content: 'Lass die KI laut denken...', type: 'THEORY', xpReward: 50 },
    { id: 'p-l5-2', chapterId: 'p-ch5', order: 2, title: 'Few-Shot Prompting', content: 'Gib Beispiele vor...', type: 'PRACTICE', xpReward: 50 },
    { id: 'p-l5-3', chapterId: 'p-ch5', order: 3, title: 'Self-Consistency', content: 'Überprüfe die Logik der KI...', type: 'CHALLENGE', xpReward: 50 },
  ],
  exercises: [
    // Simplified for brevity in this step, but I will expand
    { id: 'p-e1-1-1', lessonId: 'p-l1-1', type: 'MULTIPLE_CHOICE', question: 'Was ist ein Prompt?', options: ['Ein Befehl', 'Ein Bild', 'Ein Virus'], correctAnswer: 'Ein Befehl', difficulty: 'BEGINNER' },
    { id: 'p-e1-1-2', lessonId: 'p-l1-1', type: 'FREE_TEXT', question: 'Beschreibe einen Prompt in eigenen Worten.', evaluationCriteria: 'Klarheit und Bezug zu KI-Anweisungen.', difficulty: 'BEGINNER' },
    { id: 'p-e1-1-3', lessonId: 'p-l1-1', type: 'ERROR_DETECTION', question: 'Finde den Fehler im Prompt: "Mach mal was."', difficulty: 'BEGINNER' },
    // Chapter 1 Lesson 2
    { id: 'p-e1-2-1', lessonId: 'p-l1-2', type: 'COMPARISON', question: 'Welcher Prompt ist besser?', options: ['Schreibe eine Mail.', 'Schreibe eine formelle E-Mail an meinen Chef über meinen Urlaub.'], correctAnswer: 'Schreibe eine formelle E-Mail an meinen Chef über meinen Urlaub.', difficulty: 'BEGINNER' },
    { id: 'p-e1-2-2', lessonId: 'p-l1-2', type: 'REAL_SCENARIO', question: 'Du bist ein Marketing-Manager. Erstelle einen Prompt für einen Social Media Post.', difficulty: 'INTERMEDIATE' },
    { id: 'p-e1-2-3', lessonId: 'p-l1-2', type: 'FREE_TEXT', question: 'Ergänze den Kontext: "Schreibe eine Zusammenfassung von diesem Text..."', difficulty: 'BEGINNER' },
    // Chapter 1 Lesson 3
    { id: 'p-e1-3-1', lessonId: 'p-l1-3', type: 'ERROR_DETECTION', question: 'Was ist falsch an: "KI, mach mir mal Hausaufgaben"?', difficulty: 'BEGINNER' },
    { id: 'p-e1-3-2', lessonId: 'p-l1-3', type: 'MULTIPLE_CHOICE', question: 'Welches Verb ist am präzisesten?', options: ['Machen', 'Analysieren', 'Tun'], correctAnswer: 'Analysieren', difficulty: 'BEGINNER' },
    { id: 'p-e1-3-3', lessonId: 'p-l1-3', type: 'FREE_TEXT', question: 'Schreibe eine klare Anweisung für eine KI, um ein Gedicht über den Herbst zu verfassen.', difficulty: 'BEGINNER' },
    // Chapter 2 Lesson 1
    { id: 'p-e2-1-1', lessonId: 'p-l2-1', type: 'MULTIPLE_CHOICE', question: 'Warum nutzen wir Rollen?', options: ['Um die KI zu verwirren', 'Um die Tonalität und Expertise zu steuern', 'Weil es lustig ist'], correctAnswer: 'Um die Tonalität und Expertise zu steuern', difficulty: 'BEGINNER' },
    { id: 'p-e2-1-2', lessonId: 'p-l2-1', type: 'FREE_TEXT', question: 'Nenne drei Expertenrollen, die für eine Geschäftsreise nützlich sein könnten.', difficulty: 'INTERMEDIATE' },
    { id: 'p-e2-1-3', lessonId: 'p-l2-1', type: 'COMPARISON', question: 'Welche Rolle passt besser zu einer Steuererklärung?', options: ['Clown', 'Steuerberater'], correctAnswer: 'Steuerberater', difficulty: 'BEGINNER' },
  ]
};

export const CONTEXT_EXERCISES: Exercise[] = [
  // Chapter 1 Lesson 1
  { id: 'c-e1-1-1', lessonId: 'c-l1-1', type: 'MULTIPLE_CHOICE', question: 'Was bedeutet Kontext in der KI?', options: ['Hintergrundinformationen', 'Ein Programmierfehler', 'Die Hardware'], correctAnswer: 'Hintergrundinformationen', difficulty: 'BEGINNER' },
  { id: 'c-e1-1-2', lessonId: 'c-l1-1', type: 'FREE_TEXT', question: 'Warum ist Kontext wichtig für eine KI?', difficulty: 'BEGINNER' },
  { id: 'c-e1-1-3', lessonId: 'c-l1-1', type: 'ERROR_DETECTION', question: 'Fehlt hier Kontext? "Schreibe mir einen Plan."', difficulty: 'BEGINNER' },
];

export const CONTEXT_TRACK: { chapters: Chapter[], lessons: Lesson[], exercises: Exercise[] } = {
  chapters: [
    {
      id: 'c-ch1',
      track: 'CONTEXT',
      order: 1,
      title: 'Die Macht des Kontextes',
      description: 'Warum die KI wissen muss, was du weißt.',
      icon: '🌐',
      xpReward: 200,
      isLocked: false,
      requiredXP: 0
    },
    {
      id: 'c-ch2',
      track: 'CONTEXT',
      order: 2,
      title: 'Informations-Hierarchie',
      description: 'Wichtige von unwichtigen Infos trennen.',
      icon: '📐',
      xpReward: 200,
      isLocked: false,
      requiredXP: 1000
    },
    {
      id: 'c-ch3',
      track: 'CONTEXT',
      order: 3,
      title: 'Constraints & Grenzen',
      description: 'Leitplanken für die KI setzen.',
      icon: '🚧',
      xpReward: 200,
      isLocked: false,
      requiredXP: 2000
    },
    {
      id: 'c-ch4',
      track: 'CONTEXT',
      order: 4,
      title: 'RAG & Externe Daten',
      description: 'KI mit eigenem Wissen füttern.',
      icon: '📚',
      xpReward: 200,
      isLocked: false,
      requiredXP: 3000
    },
    {
      id: 'c-ch5',
      track: 'CONTEXT',
      order: 5,
      title: 'Kontext-Management',
      description: 'Lange Konversationen meistern.',
      icon: '🔄',
      xpReward: 200,
      isLocked: false,
      requiredXP: 4000
    }
  ],
  lessons: [
    // Chapter 1 Lessons
    { id: 'c-l1-1', chapterId: 'c-ch1', order: 1, title: 'Was ist Kontext?', content: 'Kontext ist die Umgebungsinformation...', type: 'THEORY', xpReward: 50 },
    { id: 'c-l1-2', chapterId: 'c-ch1', order: 2, title: 'Kontext-Fenster erklärt', content: 'Wie viel kann sich die KI merken?', type: 'PRACTICE', xpReward: 50 },
    { id: 'c-l1-3', chapterId: 'c-ch1', order: 3, title: 'Relevanz-Check', content: 'Welche Infos sind wirklich nötig?', type: 'CHALLENGE', xpReward: 50 },
    // Chapter 2 Lessons
    { id: 'c-l2-1', chapterId: 'c-ch2', order: 1, title: 'Primäre vs. Sekundäre Info', content: 'Priorisiere deine Anweisungen...', type: 'THEORY', xpReward: 50 },
    { id: 'c-l2-2', chapterId: 'c-ch2', order: 2, title: 'Strukturierung von Daten', content: 'Nutze Markdown oder XML...', type: 'PRACTICE', xpReward: 50 },
    { id: 'c-l2-3', chapterId: 'c-ch2', order: 3, title: 'Rauschunterdrückung', content: 'Entferne unnötige Füllwörter...', type: 'CHALLENGE', xpReward: 50 },
    // Chapter 3 Lessons
    { id: 'c-l3-1', chapterId: 'c-ch3', order: 1, title: 'Negative Constraints', content: 'Was die KI NICHT tun soll...', type: 'THEORY', xpReward: 50 },
    { id: 'c-l3-2', chapterId: 'c-ch3', order: 2, title: 'Stilistische Vorgaben', content: 'Tonalität und Zielgruppe...', type: 'PRACTICE', xpReward: 50 },
    { id: 'c-l3-3', chapterId: 'c-ch3', order: 3, title: 'Längenbeschränkungen', content: 'Fasse dich kurz...', type: 'CHALLENGE', xpReward: 50 },
    // Chapter 4 Lessons
    { id: 'c-l4-1', chapterId: 'c-ch4', order: 1, title: 'Einführung in RAG', content: 'Retrieval Augmented Generation...', type: 'THEORY', xpReward: 50 },
    { id: 'c-l4-2', chapterId: 'c-ch4', order: 2, title: 'Dokumente als Kontext', content: 'PDFs und Texte einbinden...', type: 'PRACTICE', xpReward: 50 },
    { id: 'c-l4-3', chapterId: 'c-ch4', order: 3, title: 'Wissensdatenbanken', content: 'Strukturiertes Wissen nutzen...', type: 'CHALLENGE', xpReward: 50 },
    // Chapter 5 Lessons
    { id: 'c-l5-1', chapterId: 'c-ch5', order: 1, title: 'Kontext-Verlust vermeiden', content: 'Zusammenfassungen nutzen...', type: 'THEORY', xpReward: 50 },
    { id: 'c-l5-2', chapterId: 'c-ch5', order: 2, title: 'Multi-Turn Strategien', content: 'Über mehrere Schritte zum Ziel...', type: 'PRACTICE', xpReward: 50 },
    { id: 'c-l5-3', chapterId: 'c-ch5', order: 3, title: 'Kontext-Reset', content: 'Wann man von vorne anfangen sollte...', type: 'CHALLENGE', xpReward: 50 },
  ],
  exercises: CONTEXT_EXERCISES
};

export const ALL_CONTENT = {
  tracks: [PROMPT_TRACK, CONTEXT_TRACK],
  getAllChapters: () => [...PROMPT_TRACK.chapters, ...CONTEXT_TRACK.chapters],
  getAllLessons: () => [...PROMPT_TRACK.lessons, ...CONTEXT_TRACK.lessons],
  getAllExercises: () => [...PROMPT_TRACK.exercises, ...CONTEXT_TRACK.exercises],
};
