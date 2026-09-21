export type ArenaProvider = 'ollama' | 'groq' | 'huggingface' | 'together' | 'custom';

export type ModelProfile = {
  id: string;
  name: string;
  description: string;
  proxyModel: string;
  provider: ArenaProvider;
  contextWindow: number;
  maxOutputTokens: number;
  local: boolean;
  recommended: boolean;
  memoryClass: 'light' | 'medium' | 'heavy';
  tags: string[];
};

export const MODEL_PROFILES: ModelProfile[] = [
  {
    id: 'llama32-3b',
    name: 'Llama 3.2 3B',
    description: 'Leichtes lokales Allround-Modell für Prompt-Tests, Zusammenfassungen und Tool-Aufgaben.',
    proxyModel: 'local-llama32',
    provider: 'ollama',
    contextWindow: 131072,
    maxOutputTokens: 4096,
    local: true,
    recommended: true,
    memoryClass: 'light',
    tags: ['Deutsch', 'Allround', 'Schnell'],
  },
  {
    id: 'qwen3-4b',
    name: 'Qwen3 4B',
    description: 'Kompaktes Reasoning-Modell für strukturierte Aufgaben, Analyse und mehrstufige Prompts.',
    proxyModel: 'local-qwen3',
    provider: 'ollama',
    contextWindow: 262144,
    maxOutputTokens: 8192,
    local: true,
    recommended: true,
    memoryClass: 'medium',
    tags: ['Reasoning', 'Multilingual', 'Tools'],
  },
  {
    id: 'qwen25-coder-7b',
    name: 'Qwen2.5 Coder 7B',
    description: 'Lokales Coding-Modell für Webentwicklung, Debugging und Code-Transformation.',
    proxyModel: 'local-qwen25-coder',
    provider: 'ollama',
    contextWindow: 32768,
    maxOutputTokens: 8192,
    local: true,
    recommended: true,
    memoryClass: 'medium',
    tags: ['Coding', 'JavaScript', 'TypeScript'],
  },
  {
    id: 'qwen3-coder-30b',
    name: 'Qwen3 Coder 30B',
    description: 'Starkes agentisches Coding-Modell. Für deutlich leistungsfähigere Hosts vorgesehen.',
    proxyModel: 'local-qwen3-coder',
    provider: 'ollama',
    contextWindow: 262144,
    maxOutputTokens: 16384,
    local: true,
    recommended: false,
    memoryClass: 'heavy',
    tags: ['Agentic Coding', 'Long Context', 'Heavy'],
  },
];

export const DEFAULT_ARENA_MODELS = ['llama32-3b', 'qwen3-4b', 'qwen25-coder-7b'];
