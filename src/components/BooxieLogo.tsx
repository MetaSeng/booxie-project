import React from 'react';

export default function BooxieLogo({ className = "w-24 h-24" }: { className?: string }) {
  return (
    <img 
      src="https://storage.googleapis.com/aistudio-genai-prod-0000-us-central1/0212000000000000/1744082894178-image.png" 
      alt="Booxie Logo" 
      className={`object-contain ${className}`}
      referrerPolicy="no-referrer"
    />
  );
}
