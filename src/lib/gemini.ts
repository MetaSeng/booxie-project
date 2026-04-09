import { GoogleGenAI } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

export function getGeminiAI(): GoogleGenAI | null {
  if (!aiInstance) {
    // Try to get API key from process.env (Vite define) or import.meta.env
    let apiKey = (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) || 
                   (import.meta as any).env?.VITE_GEMINI_API_KEY ||
                   (import.meta as any).env?.GEMINI_API_KEY;
                   
    // If key is missing or invalid, use the hardcoded fallback
    if (!apiKey || apiKey === 'undefined' || apiKey === 'MY_GEMINI_API_KEY' || apiKey === '') {
      apiKey = 'AIzaSyBbf7w3fmAyAIs4nVwuo2eZSjlEoUf-xi8';
    }
    
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}
