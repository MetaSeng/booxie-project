export function isGeminiQuotaError(error: any): boolean {
  if (!error) return false;
  
  const errorString = typeof error === 'string' ? error : JSON.stringify(error);
  
  return (
    error?.status === 429 || 
    error?.status === 'RESOURCE_EXHAUSTED' ||
    error?.message?.includes('429') || 
    error?.message?.includes('quota') || 
    error?.message?.includes('RESOURCE_EXHAUSTED') ||
    error?.error?.code === 429 ||
    error?.error?.message?.includes('quota') ||
    error?.error?.status === 'RESOURCE_EXHAUSTED' ||
    errorString.includes('429') ||
    errorString.includes('RESOURCE_EXHAUSTED') ||
    errorString.includes('quota exceeded') ||
    errorString.includes('Rate limit reached')
  );
}

export const GEMINI_QUOTA_ERROR_MESSAGE = "I'm currently experiencing high traffic and my quota is exceeded. Please try again later.";
