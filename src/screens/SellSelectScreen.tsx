import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Edit3, ChevronLeft } from 'lucide-react';
import { motion } from 'motion/react';

export default function SellSelectScreen() {
  const navigate = useNavigate();
  const [listingType, setListingType] = useState<'sale' | 'donation'>('sale');

  const goToScan = () => {
    navigate('/sell/scan', { state: { listingType } });
  };

  const goToManual = () => {
    navigate('/sell/details', {
      state: {
        manualEntry: true,
        scannedData: {
          title: '',
          author: '',
          description: '',
          price: listingType === 'donation' ? 0 : '',
          type: listingType,
          condition: 'Good',
          imageUrl: '',
          backCoverUrl: ''
        }
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A8765] via-[#238B76] to-[#0D5C47] flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <div className="pt-6 px-6 flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
        <h1 className="text-xl font-bold text-white">Sell or Donate</h1>
        <div className="w-10"></div>
      </div>

      {/* Listing Type Toggle */}
      <div className="px-6 py-4">
        <div className="flex bg-white/10 backdrop-blur-xl rounded-2xl p-1.5 shadow-xl border border-white/15">
          <button
            onClick={() => setListingType('sale')}
            className={`flex-1 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
              listingType === 'sale'
                ? 'bg-white text-[#1A8765] shadow-lg'
                : 'text-white/80 hover:text-white'
            }`}
          >
            SELL
          </button>
          <button
            onClick={() => setListingType('donation')}
            className={`flex-1 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
              listingType === 'donation'
                ? 'bg-white text-[#1A8765] shadow-lg'
                : 'text-white/80 hover:text-white'
            }`}
          >
            DONATE
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-2">How would you like to add a book?</h2>
          <p className="text-white/70">Choose the fastest method for you</p>
        </div>

        <div className="w-full max-w-sm space-y-4">
          {/* Scan Option */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={goToScan}
            className="w-full rounded-2xl bg-white/95 backdrop-blur-md border border-white/30 p-6 shadow-xl hover:shadow-2xl transition-all overflow-hidden group relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex items-center gap-4 text-left">
              <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1A8765] to-[#0D5C47] flex items-center justify-center shadow-lg">
                <Camera className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Scan Book</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Use AI to automatically detect book details from photos
                </p>
              </div>
            </div>
          </motion.button>

          {/* Manual Option */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={goToManual}
            className="w-full rounded-2xl bg-white/95 backdrop-blur-md border border-white/30 p-6 shadow-xl hover:shadow-2xl transition-all overflow-hidden group relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex items-center gap-4 text-left">
              <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1A8765] to-[#0D5C47] flex items-center justify-center shadow-lg">
                <Edit3 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Manual Entry</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Manually enter details and upload images
                </p>
              </div>
            </div>
          </motion.button>
        </div>

        {/* Features List */}
        <div className="mt-12 max-w-sm w-full">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 p-6">
            <h4 className="text-sm font-bold text-white/80 uppercase tracking-wide mb-4">Why list with us?</h4>
            <ul className="space-y-2 text-sm text-white/70">
              <li className="flex items-start gap-2">
                <span className="text-[#7FE2C4] font-bold mt-0.5">✓</span>
                <span>Fast listing process</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#7FE2C4] font-bold mt-0.5">✓</span>
                <span>Earn reward points on every sale</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#7FE2C4] font-bold mt-0.5">✓</span>
                <span>Reach thousands of book buyers</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#7FE2C4] font-bold mt-0.5">✓</span>
                <span>Secure payment processing</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
