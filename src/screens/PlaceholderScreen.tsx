import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Construction } from 'lucide-react';

export default function PlaceholderScreen({ title }: { title: string }) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FCF9] font-sans">
      <div className="px-4 py-4 flex items-center bg-white sticky top-0 z-10 shadow-sm">
        <button onClick={() => navigate('/')} className="relative z-50 p-2 -ml-2 text-gray-800">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-gray-900 ml-4">{title}</h1>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-[#006A4E]/10 rounded-full flex items-center justify-center mb-6">
          <Construction className="w-12 h-12 text-[#006A4E]" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Coming Soon</h2>
        <p className="text-gray-500 max-w-xs mx-auto">
          We're working hard to bring you the {title} feature. Please check back later!
        </p>
        <button 
          onClick={() => navigate('/')}
          className="mt-8 bg-[#006A4E] text-white px-8 py-3 rounded-full font-bold hover:bg-[#005C44] transition-colors shadow-md"
        >
          Go Back
        </button>
      </div>
    </div>
  );
}
