import { GoogleGenAI } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

function getEnvValue(key: string): string | undefined {
  const viteEnv = (import.meta as any).env;
  if (viteEnv?.[key]) return viteEnv[key];
  if (typeof process !== 'undefined' && process.env?.[key]) return process.env[key];
  return undefined;
}

export function getGeminiAI(): GoogleGenAI | null {
  if (!aiInstance) {
    const apiKey =
      getEnvValue('VITE_GEMINI_API_KEY') ||
      getEnvValue('GEMINI_API_KEY');
    
    if (!apiKey) return null;
    
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}
