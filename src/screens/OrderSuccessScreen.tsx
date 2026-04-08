import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function OrderSuccessScreen() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans items-center justify-center p-4">
      <div className="bg-[#F8FCF9] rounded-[32px] p-8 w-full max-w-sm flex flex-col items-center text-center shadow-sm border border-gray-100">
        
        {/* Illustration */}
        <div className="mb-6 relative w-32 h-32 flex items-center justify-center">
          {/* Decorative lines */}
          <div className="absolute top-4 left-4 w-3 h-1 bg-black rounded-full rotate-45"></div>
          <div className="absolute top-8 left-0 w-4 h-1 bg-black rounded-full"></div>
          <div className="absolute top-4 right-4 w-3 h-1 bg-black rounded-full -rotate-45"></div>
          <div className="absolute top-8 right-0 w-4 h-1 bg-black rounded-full"></div>
          
          {/* Hands illustration */}
          <div className="relative w-24 h-24">
            {/* Sleeves */}
            <div className="absolute bottom-0 left-0 w-10 h-12 bg-[#006A4E] rounded-tl-sm transform -rotate-12 origin-bottom-right"></div>
            <div className="absolute bottom-0 right-0 w-10 h-12 bg-[#006A4E] rounded-tr-sm transform rotate-12 origin-bottom-left"></div>
            
            {/* Hands */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex">
              {/* Left hand */}
              <div className="w-6 h-16 bg-[#F3C693] rounded-t-full border border-black transform -rotate-6 origin-bottom-right z-10">
                <div className="absolute top-2 right-1 w-0.5 h-8 bg-black/20 rounded-full"></div>
                <div className="absolute top-4 right-3 w-0.5 h-6 bg-black/20 rounded-full"></div>
              </div>
              {/* Right hand */}
              <div className="w-6 h-16 bg-[#F3C693] rounded-t-full border border-black transform rotate-6 origin-bottom-left z-10 -ml-1">
                <div className="absolute top-2 left-1 w-0.5 h-8 bg-black/20 rounded-full"></div>
                <div className="absolute top-4 left-3 w-0.5 h-6 bg-black/20 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        <h1 className="text-2xl font-medium text-gray-900 mb-4">Success</h1>
        
        <p className="text-sm text-gray-600 mb-2">
          Thank you for your order!
        </p>
        <p className="text-sm text-gray-600 mb-8">
          Your receipt has been sent to<br/>your email!
        </p>

        <button 
          onClick={() => navigate('/')}
          className="bg-[#006A4E] text-white px-8 py-3 rounded-full font-medium text-sm shadow-md hover:bg-[#005C44] transition-colors"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}
