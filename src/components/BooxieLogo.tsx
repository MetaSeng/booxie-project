import React from 'react';

export default function BooxieLogo({ className = "w-24 h-24" }: { className?: string }) {
  return (
    <img 
      src="https://lh3.googleusercontent.com/d/1k5xJOzbRydji1sY1yWthBWDCWPSOFBKy" 
      alt="Booxie Logo" 
      className={`object-contain ${className}`}
      referrerPolicy="no-referrer"
    />
  );
}
