import React from 'react';

export const AbaPayIcon = ({ className = "" }: { className?: string }) => (
  <div className={`w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden border border-gray-200 shadow-sm ${className}`}>
    <img 
      src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/ABA_Bank_logo.svg/512px-ABA_Bank_logo.svg.png" 
      alt="ABA Pay" 
      className="w-8 h-8 object-contain"
      referrerPolicy="no-referrer"
    />
  </div>
);

export const AcledaPayIcon = ({ className = "" }: { className?: string }) => (
  <div className={`w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden border border-gray-200 shadow-sm ${className}`}>
    <img 
      src="https://upload.wikimedia.org/wikipedia/en/thumb/5/5b/Acleda_Bank_logo.svg/512px-Acleda_Bank_logo.svg.png" 
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
