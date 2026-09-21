export type MasterPromptCategory =
  | 'Coding'
  | 'Research'
  | 'Agents'
  | 'Automation'
  | 'Writing'
  | 'Learning'
  | 'Design'
  | 'Data'
  | 'Business'
  | 'Media';

export type MasterPrompt = {
  id: string;
  title: string;
  shortTitle: string;
  category: MasterPromptCategory;
  icon: string;
  accent: string;
  description: string;
  bestFor: string[];
  structure: string[];
  starter: string;
};

export const PROMPT_TYPES = [
  'Auto',
  'Standard',
  'Research',
  'Writing',
  'Planning',
  'Agent',
  'Image',
  'Video',
  'Code',
  'Automation',
] as const;

export const TARGET_MODELS = [
  'Universal',
  'ChatGPT',
  'Claude',
  'Gemini',
  'Grok',
  'DeepSeek',
  'Perplexity',
  'Llama',
  'Mistral',
  'Cohere',
] as const;

export const MASTER_PROMPTS: MasterPrompt[] = [
  {
    id: 'code-master',
    title: 'Code Master',
    shortTitle: 'CODE',
    category: 'Coding',
    icon: '⌘',
    accent: 'from-cyan-400/30 via-blue-500/15 to-transparent',
    description: 'Senior-Engineering-Prompt für Implementierung, Debugging, Refactoring, Tests und Architektur.',
    bestFor: ['Debugging', 'Feature Build', 'Code Review', 'Refactoring'],
    structure: ['Ziel', 'Tech-Stack', 'Ist-Zustand', 'Constraints', 'Definition of Done', 'Tests'],
    starter: 'Baue oder verbessere die folgende Softwareaufgabe auf Production-Niveau.',
  },
  {
    id: 'research-architect',
    title: 'Research Architect',
    shortTitle: 'RESEARCH',
    category: 'Research',
    icon: '◉',
    accent: 'from-violet-400/30 via-fuchsia-500/15 to-transparent',
    description: 'Strukturierte Recherche mit Quellenplan, Gegenhypothesen, Evidenzprüfung und Ergebnis-Synthese.',
    bestFor: ['Deep Research', 'Vergleiche', 'Marktanalyse', 'Technologie-Scouting'],
    structure: ['Forschungsfrage', 'Scope', 'Quellen', 'Evidenz', 'Gegenpositionen', 'Synthese'],
    starter: 'Untersuche das folgende Thema systematisch und trenne Fakten, Unsicherheit und Schlussfolgerungen.',
  },
  {
    id: 'agent-architect',
    title: 'Agent Architect',
    shortTitle: 'AGENT',
    category: 'Agents',
    icon: '◆',
    accent: 'from-emerald-400/30 via-teal-500/15 to-transparent',
    description: 'Entwirft robuste KI-Agenten mit Rollen, Tools, Memory, Zuständen, Guardrails und Handoffs.',
    bestFor: ['AI Agents', 'Tool Use', 'Memory', 'Multi-Agent'],
    structure: ['Mission', 'Rolle', 'Tools', 'State', 'Memory', 'Guardrails', 'Handoffs'],
    starter: 'Entwirf einen autonomen, überprüfbaren Agenten für die folgende Mission.',
  },
  {
    id: 'automation-engineer',
    title: 'Automation Engineer',
    shortTitle: 'AUTO',
    category: 'Automation',
    icon: '⚙',
    accent: 'from-orange-400/30 via-amber-500/15 to-transparent',
    description: 'Plant Automationen als Trigger → Schritte → Bedingungen → Fehlerpfade → Ergebnis.',
    bestFor: ['Workflows', 'APIs', 'n8n', 'Temporal'],
    structure: ['Trigger', 'Inputs', 'Workflow', 'Conditions', 'Retries', 'Observability', 'Output'],
    starter: 'Entwirf eine zuverlässige Automation für den folgenden Prozess.',
  },
  {
    id: 'writing-director',
    title: 'Writing Director',
    shortTitle: 'WRITE',
    category: 'Writing',
    icon: '✦',
    accent: 'from-pink-400/30 via-rose-500/15 to-transparent',
    description: 'Steuert Ton, Zielgruppe, Dramaturgie, Stilregeln und Ausgabeformat für hochwertige Texte.',
    bestFor: ['Artikel', 'E-Mails', 'Copywriting', 'Storytelling'],
    structure: ['Zielgruppe', 'Intent', 'Ton', 'Kernaussage', 'Struktur', 'No-Gos', 'Output'],
    starter: 'Schreibe einen hochwertigen Text für die folgende Zielgruppe und Absicht.',
  },
  {
    id: 'learning-mentor',
    title: 'Learning Mentor',
    shortTitle: 'LEARN',
    category: 'Learning',
    icon: '△',
    accent: 'from-sky-400/30 via-indigo-500/15 to-transparent',
    description: 'Sokratischer Lern-Prompt mit Erklärstufen, Beispielen, Übungen, Feedback und Mastery-Check.',
    bestFor: ['Umschulung', 'Prüfung', 'Coding lernen', 'Wiederholung'],
    structure: ['Lernziel', 'Vorwissen', 'Erklärung', 'Beispiel', 'Übung', 'Feedback', 'Mastery'],
    starter: 'Bringe mir das folgende Thema so bei, dass ich es anschließend selbst erklären und anwenden kann.',
  },
  {
    id: 'ux-strategist',
    title: 'UX Strategist',
    shortTitle: 'UX',
    category: 'Design',
    icon: '◫',
    accent: 'from-purple-400/30 via-indigo-500/15 to-transparent',
    description: 'Produkt- und UX-Prompt für Informationsarchitektur, Flows, Interaktionen und Designsysteme.',
    bestFor: ['UI/UX', 'SaaS', 'Design Audit', 'Prototyping'],
    structure: ['Produktziel', 'Nutzer', 'Jobs-to-be-done', 'Flow', 'UI States', 'A11y', 'Design System'],
    starter: 'Entwirf eine außergewöhnliche, nutzbare Produktoberfläche für das folgende Produkt.',
  },
  {
    id: 'data-analyst',
    title: 'Data Analyst',
    shortTitle: 'DATA',
    category: 'Data',
    icon: '▥',
    accent: 'from-lime-400/25 via-emerald-500/15 to-transparent',
    description: 'Analysiert Daten mit Hypothesen, Qualitätschecks, Kennzahlen, Visualisierung und Empfehlungen.',
    bestFor: ['CSV', 'KPIs', 'Reports', 'Anomalien'],
    structure: ['Fragestellung', 'Daten', 'Qualität', 'Metriken', 'Analyse', 'Visualisierung', 'Erkenntnisse'],
    starter: 'Analysiere die folgenden Daten nachvollziehbar und leite belastbare Erkenntnisse ab.',
  },
  {
    id: 'business-strategist',
    title: 'Business Strategist',
    shortTitle: 'BIZ',
    category: 'Business',
    icon: '◇',
    accent: 'from-yellow-400/25 via-orange-500/15 to-transparent',
    description: 'Strategie-Prompt für Chancen, Risiken, Prioritäten, Roadmaps und Entscheidungen.',
    bestFor: ['Strategie', 'Roadmap', 'Priorisierung', 'Produktideen'],
    structure: ['Ziel', 'Ausgangslage', 'Optionen', 'Trade-offs', 'Risiken', 'Entscheidungskriterien', 'Roadmap'],
    starter: 'Entwickle eine belastbare Strategie für die folgende Ausgangslage.',
  },
  {
    id: 'media-director',
    title: 'Media Director',
    shortTitle: 'MEDIA',
    category: 'Media',
    icon: '▶',
    accent: 'from-red-400/25 via-pink-500/15 to-transparent',
    description: 'Master-Prompt für Bild- und Videogenerierung mit Szene, Kamera, Licht, Stil und Negativregeln.',
    bestFor: ['Image', 'Video', 'Storyboards', 'Cinematic'],
    structure: ['Motiv', 'Szene', 'Komposition', 'Kamera', 'Licht', 'Stil', 'Negative'],
    starter: 'Erstelle einen präzisen visuellen Produktions-Prompt für die folgende Idee.',
  },
];

export const CATEGORIES = ['Alle', ...Array.from(new Set(MASTER_PROMPTS.map((item) => item.category)))] as const;
