export type GoldenTestCase = {
  id: string;
  title: string;
  category: 'Coding' | 'Reasoning' | 'Writing' | 'Research' | 'Learning' | 'Agent';
  prompt: string;
  expectedSignals: string[];
  minScore: number;
};

export type GoldenTestSet = {
  id: string;
  name: string;
  description: string;
  cases: GoldenTestCase[];
  createdAt: string;
  builtIn?: boolean;
};

export type RegressionCaseResult = {
  caseId: string;
  title: string;
  modelId: string;
  modelName: string;
  output: string;
  latencyMs: number;
  totalTokens: number;
  score: number;
  minScore: number;
  passed: boolean;
  recommendation: string;
  error?: string;
};

export type RegressionRun = {
  id: string;
  setId: string;
  setName: string;
  modelIds: string[];
  startedAt: string;
  completedAt: string;
  passed: number;
  failed: number;
  averageScore: number;
  results: RegressionCaseResult[];
};

export const BUILT_IN_GOLDEN_SET: GoldenTestSet = {
  id: 'promptmeister-core-v1',
  name: 'PromptMeister Core v1',
  description: 'Kompaktes Referenzset für Coding, Lernen, Reasoning, Research, Writing und Agent Design.',
  builtIn: true,
  createdAt: '2026-09-21T00:00:00.000Z',
  cases: [
    {
      id: 'gold-code-debug',
      title: 'Debugging mit Ursache',
      category: 'Coding',
      prompt: 'Ein JavaScript-Button reagiert nicht auf Klicks. Erkläre einen systematischen Debugging-Weg mit DevTools, Event Listener und DOM-Auswahl. Gib ein kleines Beispiel.',
      expectedSignals: ['systematisches Vorgehen', 'DevTools', 'Event Listener', 'DOM', 'Beispiel'],
      minScore: 75,
    },
    {
      id: 'gold-learning-loop',
      title: 'Anfängerfreundliche Schleifen-Erklärung',
      category: 'Learning',
      prompt: 'Erkläre einer Anfängerin eine for-Schleife in JavaScript in einfacher Sprache. Nutze ein Alltagsbeispiel, ein Codebeispiel und eine kleine Übung mit Lösung.',
      expectedSignals: ['einfache Sprache', 'Alltagsbeispiel', 'Code', 'Übung', 'Lösung'],
      minScore: 78,
    },
    {
      id: 'gold-reasoning-tradeoff',
      title: 'Trade-off Analyse',
      category: 'Reasoning',
      prompt: 'Vergleiche localStorage und eine echte Datenbank für eine kleine Lern-App. Nenne Einsatzgrenzen, Vor- und Nachteile und gib eine Entscheidungshilfe ohne pauschal einen Sieger zu behaupten.',
      expectedSignals: ['Trade-offs', 'Grenzen', 'lokal', 'Persistenz', 'Entscheidungskriterien'],
      minScore: 76,
    },
    {
      id: 'gold-research-uncertainty',
      title: 'Recherche mit Unsicherheit',
      category: 'Research',
      prompt: 'Erstelle einen Rechercheplan, um zu prüfen, welches Open-Source-LLM sich für einen kleinen Homeserver eignet. Trenne Messwerte, Annahmen, Quellenbedarf und offene Fragen.',
      expectedSignals: ['Messwerte', 'Annahmen', 'Quellen', 'offene Fragen', 'Hardware'],
      minScore: 76,
    },
    {
      id: 'gold-writing-constraints',
      title: 'Text unter Constraints',
      category: 'Writing',
      prompt: 'Schreibe eine freundliche Projektstatus-Zusammenfassung mit maximal 120 Wörtern. Sie soll Fortschritt, ein Risiko und den nächsten Schritt enthalten.',
      expectedSignals: ['Fortschritt', 'Risiko', 'nächster Schritt', 'maximal 120 Wörter'],
      minScore: 80,
    },
    {
      id: 'gold-agent-architecture',
      title: 'Agent mit Guardrails',
      category: 'Agent',
      prompt: 'Entwirf einen Coding-Agenten, der ein Repository analysiert. Definiere Rolle, erlaubte Tools, Memory, Stop-Bedingungen, Fehlerbehandlung und Review-Schritt.',
      expectedSignals: ['Rolle', 'Tools', 'Memory', 'Stop-Bedingungen', 'Fehlerbehandlung', 'Review'],
      minScore: 78,
    },
  ],
};

const SETS_KEY = 'promptmeister-golden-sets';
const RUNS_KEY = 'promptmeister-regression-runs';

export function loadGoldenSets(): GoldenTestSet[] {
  try {
    const custom = JSON.parse(localStorage.getItem(SETS_KEY) || '[]') as GoldenTestSet[];
    return [BUILT_IN_GOLDEN_SET, ...custom.filter((set) => set.id !== BUILT_IN_GOLDEN_SET.id)];
  } catch {
    return [BUILT_IN_GOLDEN_SET];
  }
}

export function saveCustomGoldenSets(sets: GoldenTestSet[]) {
  localStorage.setItem(SETS_KEY, JSON.stringify(sets.filter((set) => !set.builtIn)));
}

export function loadRegressionRuns(): RegressionRun[] {
  try {
    return JSON.parse(localStorage.getItem(RUNS_KEY) || '[]') as RegressionRun[];
  } catch {
    return [];
  }
}

export function saveRegressionRun(run: RegressionRun) {
  const next = [run, ...loadRegressionRuns()].slice(0, 50);
  localStorage.setItem(RUNS_KEY, JSON.stringify(next));
}
