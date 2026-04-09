import React from 'react';

export const AbaPayIcon = ({ className = "" }: { className?: string }) => (
  <div className={`w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden border border-gray-200 shadow-sm ${className}`}>
    <img 
      src="https://lh3.googleusercontent.com/d/1EIveOOCCsK9ZRFP2eIvd5H7p-Wr8SaQT" 
      alt="ABA Pay" 
      className="w-8 h-8 object-contain"
      referrerPolicy="no-referrer"
    />
  </div>
);

export const AcledaPayIcon = ({ className = "" }: { className?: string }) => (
  <div className={`w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden border border-gray-200 shadow-sm ${className}`}>
    <img 
      src="https://lh3.googleusercontent.com/d/1qJjTy9KrEtvgcz_7M5RoSx_xU2mQfe6X" 
      alt="ACLEDA Pay" 
      className="w-8 h-8 object-contain"
      referrerPolicy="no-referrer"
    />
  </div>
);

export const CashIcon = ({ className = "" }: { className?: string }) => (
  <div className={`w-10 h-10 rounded-full bg-[#E8F5F0] flex items-center justify-center border border-gray-200 shadow-sm ${className}`}>
    <span className="text-xl">💵</span>
  </div>
);
