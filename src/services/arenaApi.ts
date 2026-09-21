import { MODEL_PROFILES } from '../config/models';

export type ArenaUsage = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
};

export type ArenaResponse = {
  modelId: string;
  modelName: string;
  output: string;
  latencyMs: number;
  usage: ArenaUsage;
  provider: string;
};

const BASE_URL = import.meta.env.VITE_LITELLM_URL || 'http://localhost:4000';
const API_KEY = import.meta.env.VITE_LITELLM_API_KEY || '';

export async function runArenaPrompt(modelId: string, prompt: string): Promise<ArenaResponse> {
  const model = MODEL_PROFILES.find((item) => item.id === modelId);
  if (!model) throw new Error(`Unbekanntes Modell: ${modelId}`);

  const startedAt = performance.now();
  const response = await fetch(`${BASE_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {}),
    },
    body: JSON.stringify({
      model: model.proxyModel,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.6,
      max_tokens: model.maxOutputTokens,
      stream: false,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `LiteLLM HTTP ${response.status}`);
  }

  const data = await response.json();
  return {
    modelId: model.id,
    modelName: model.name,
    provider: model.provider,
    output: data.choices?.[0]?.message?.content || '',
    latencyMs: Math.round(performance.now() - startedAt),
    usage: {
      inputTokens: data.usage?.prompt_tokens || 0,
      outputTokens: data.usage?.completion_tokens || 0,
      totalTokens: data.usage?.total_tokens || 0,
    },
  };
}

export async function checkArenaHealth() {
  const response = await fetch(`${BASE_URL}/health`);
  if (!response.ok) throw new Error('LiteLLM nicht erreichbar');
  return true;
}
