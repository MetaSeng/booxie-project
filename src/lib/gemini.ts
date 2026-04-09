import { GoogleGenAI } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

export function getGeminiAI(): GoogleGenAI {
  if (!aiInstance) {
    // Try to get API key from process.env (Vite define) or import.meta.env
    const apiKey = (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) || 
                   (import.meta as any).env?.VITE_GEMINI_API_KEY ||
                   (import.meta as any).env?.GEMINI_API_KEY;
                   
    if (!apiKey || apiKey === 'undefined' || apiKey === 'MY_GEMINI_API_KEY') {
      throw new Error("GEMINI_API_KEY is not configured. Please set it in your environment variables (e.g., VITE_GEMINI_API_KEY).");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}
