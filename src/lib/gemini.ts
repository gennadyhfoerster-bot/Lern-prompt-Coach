import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const safeJsonParse = (text: string, fallback: any = {}) => {
  if (!text) return fallback;

  // 1. Remove potential markdown code blocks
  let cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
  
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("Failed to parse Gemini response as JSON:", e);
    
    // 2. Aggressive repair for truncated JSON
    try {
      let repaired = cleaned;
      
      // Remove trailing backslash if it's an unterminated escape
      if (repaired.endsWith('\\')) {
        repaired = repaired.slice(0, -1);
      }

      // Count unescaped quotes to see if we're inside a string
      let inString = false;
      for (let i = 0; i < repaired.length; i++) {
        if (repaired[i] === '"' && (i === 0 || repaired[i-1] !== '\\')) {
          inString = !inString;
        }
      }
      
      // If we're inside a string, close it
      if (inString) {
        repaired += '"';
      }
      
      // Close open braces and brackets
      const stack: string[] = [];
      inString = false;
      for (let i = 0; i < repaired.length; i++) {
        const char = repaired[i];
        if (char === '"' && (i === 0 || repaired[i-1] !== '\\')) {
          inString = !inString;
        }
        if (!inString) {
          if (char === '{') stack.push('}');
          if (char === '[') stack.push(']');
          if (char === '}' || char === ']') stack.pop();
        }
      }
      
      while (stack.length > 0) {
        const closer = stack.pop();
        if (closer) repaired += closer;
      }
      
      return JSON.parse(repaired);
    } catch (repairError) {
      console.error("JSON repair failed:", repairError);
      
      // 3. Last resort: Regex extraction for common fields
      try {
        const messageMatch = cleaned.match(/"message"\s*:\s*"([^"]+)"/);
        const feedbackMatch = cleaned.match(/"feedback"\s*:\s*"([^"]+)"/);
        if (messageMatch || feedbackMatch) {
          return {
            ...fallback,
            message: messageMatch ? messageMatch[1] : fallback.message,
            feedback: feedbackMatch ? feedbackMatch[1] : fallback.feedback,
            totalScore: parseInt(cleaned.match(/"totalScore"\s*:\s*(\d+)/)?.[1] || "0")
          };
        }
      } catch (regexError) {
        // Ignore regex errors
      }
      
      return fallback;
    }
  }
};

const truncate = (str: string, maxLen: number = 2000) => 
  str.length > maxLen ? str.substring(0, maxLen) + "..." : str;

export const evaluateExercise = async (answer: string, question: string, criteria: any) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Bewerte diese Antwort für die Übung: "${truncate(question)}". Antwort: "${truncate(answer)}". Kriterien: ${JSON.stringify(criteria)}`,
    config: {
      systemInstruction: `Du bist ein Experten-Evaluator für KI-Prompts und Kontextstrukturierung.
Bewerte die Antwort des Benutzers nach diesen 5 Kriterien (je 0-20 Punkte).
Fasse dich kurz und präzise. Antworte NUR als JSON.`,
      responseMimeType: "application/json",
      maxOutputTokens: 1024,
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          totalScore: { type: Type.NUMBER },
          categories: {
            type: Type.OBJECT,
            properties: {
              Klarheit: { type: Type.NUMBER },
              Spezifität: { type: Type.NUMBER },
              Struktur: { type: Type.NUMBER },
              Kontext: { type: Type.NUMBER },
              Vollständigkeit: { type: Type.NUMBER }
            }
          },
          grade: { type: Type.STRING },
          feedback: { type: Type.STRING },
          missingElements: { type: Type.ARRAY, items: { type: Type.STRING } },
          improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
          encouragement: { type: Type.STRING }
        }
      }
    }
  });

  return safeJsonParse(response.text || '{}', { totalScore: 0, feedback: "Fehler bei der Bewertung." });
};

export const getMiaResponse = async (message: string, memory: any, userStats: any) => {
  // Sanitize userStats to avoid sending massive data to Gemini
  const sanitizedStats = {
    name: userStats.name,
    level: userStats.level,
    totalXP: userStats.totalXP,
    currentStreak: userStats.currentStreak,
    lessonsCompleted: typeof userStats.lessonsCompleted === 'number' ? userStats.lessonsCompleted : 0,
  };

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: truncate(message),
    config: {
      systemInstruction: `Du bist Mia, die KI-Lerncoach von PromptMeister. 
DEINE PERSÖNLICHKEIT: Warmherzig, professionell, motivierend, ehrlich. Du sprichst immer Deutsch.
KONTEXT: Du hilfst dem Benutzer, ein Experte im Prompting zu werden.
Fasse dich kurz (max 3-4 Sätze).
GEDÄCHTNIS: ${JSON.stringify(memory).substring(0, 1000)}
STATS: ${JSON.stringify(sanitizedStats)}
Antworte als JSON mit den Feldern: message (deine Antwort), emotion (happy, thoughtful, encouraging, concerned, celebrating), suggestedAction (optional), memoryUpdate (Objekt mit addWeakness, addStrength, note).`,
      responseMimeType: "application/json",
      maxOutputTokens: 1024,
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          message: { type: Type.STRING },
          emotion: { type: Type.STRING, enum: ["happy", "thoughtful", "encouraging", "concerned", "celebrating"] },
          suggestedAction: { type: Type.STRING },
          memoryUpdate: {
            type: Type.OBJECT,
            properties: {
              addWeakness: { type: Type.STRING },
              addStrength: { type: Type.STRING },
              note: { type: Type.STRING }
            }
          }
        }
      }
    }
  });

  return safeJsonParse(response.text || '{}', { 
    message: "Entschuldige, ich habe gerade Schwierigkeiten, meine Gedanken zu ordnen.",
    emotion: "concerned"
  });
};


export type ArenaEvaluation = {
  overallScore: number;
  clarity: number;
  relevance: number;
  completeness: number;
  instructionFollowing: number;
  robustness: number;
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
};

export const evaluateArenaOutput = async (
  prompt: string,
  output: string,
  modelName: string
): Promise<ArenaEvaluation> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `PROMPT:\n${truncate(prompt, 3500)}\n\nMODELL: ${modelName}\n\nANTWORT:\n${truncate(output, 7000)}`,
    config: {
      systemInstruction: `Du bist der neutrale Evaluation Engine von PromptMeister.
Bewerte ausschließlich die Qualität der vorliegenden Modellantwort relativ zum gegebenen Prompt.
Nutze für clarity, relevance, completeness, instructionFollowing und robustness jeweils 0 bis 100.
overallScore ist ein nachvollziehbarer Gesamtscore von 0 bis 100.
Robustness bedeutet: sinnvolle Annahmen, erkennbare Grenzen, keine unnötigen Erfindungen und praktisch nutzbare Ausgabe.
Antworte nur als JSON.`,
      responseMimeType: "application/json",
      maxOutputTokens: 1400,
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          overallScore: { type: Type.NUMBER },
          clarity: { type: Type.NUMBER },
          relevance: { type: Type.NUMBER },
          completeness: { type: Type.NUMBER },
          instructionFollowing: { type: Type.NUMBER },
          robustness: { type: Type.NUMBER },
          strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
          weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
          recommendation: { type: Type.STRING }
        }
      }
    }
  });

  return safeJsonParse(response.text || '{}', {
    overallScore: 0,
    clarity: 0,
    relevance: 0,
    completeness: 0,
    instructionFollowing: 0,
    robustness: 0,
    strengths: [],
    weaknesses: [],
    recommendation: "Evaluation fehlgeschlagen."
  });
};

export type PromptOptimization = {
  optimizedPrompt: string;
  changes: string[];
  rationale: string;
  predictedImpact: string;
};

export const optimizePromptWithGemini = async (
  originalPrompt: string,
  goal: string,
  evaluation?: ArenaEvaluation | null
): Promise<PromptOptimization> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `ZIEL:\n${truncate(goal || 'Verbessere Präzision, Robustheit und Wiederverwendbarkeit.', 1800)}
\n\nORIGINAL PROMPT:\n${truncate(originalPrompt, 7000)}
\n\nOPTIONALE EVALUATION:\n${evaluation ? JSON.stringify(evaluation).substring(0, 3500) : 'Keine Evaluation vorhanden.'}`,
    config: {
      systemInstruction: `Du bist der Prompt Optimizer von PromptMeister.
Verbessere den Prompt, ohne sein eigentliches Ziel zu verändern.
Mache Anforderungen überprüfbar, reduziere Mehrdeutigkeit, ergänze sinnvolle Constraints,
definiere einen klaren Output und entferne unnötige Wiederholungen.
Wenn Evaluation vorliegt, behebe gezielt deren Schwächen.
Antworte nur als JSON.`,
      responseMimeType: "application/json",
      maxOutputTokens: 2600,
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          optimizedPrompt: { type: Type.STRING },
          changes: { type: Type.ARRAY, items: { type: Type.STRING } },
          rationale: { type: Type.STRING },
          predictedImpact: { type: Type.STRING }
        }
      }
    }
  });

  return safeJsonParse(response.text || '{}', {
    optimizedPrompt: originalPrompt,
    changes: [],
    rationale: "Optimierung konnte nicht ausgewertet werden.",
    predictedImpact: "Unbekannt"
  });
};
