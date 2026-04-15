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
