import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Crop, RotateCcw, SlidersHorizontal, Check, Camera, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ScanEditScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { images = [], frontCoverData } = location.state || { images: [] };
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [rotations, setRotations] = useState<number[]>(new Array(images.length).fill(0));
  const [scales, setScales] = useState<number[]>(new Array(images.length).fill(1));
  const [brightness, setBrightness] = useState<number[]>(new Array(images.length).fill(100));

  const applyImageAdjustments = (src: string, rotation: number, scale: number, brightnessValue: number) => (
    new Promise<string>((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const normalizedRotation = ((rotation % 360) + 360) % 360;
        const swapDimensions = normalizedRotation === 90 || normalizedRotation === 270;

        canvas.width = swapDimensions ? img.height : img.width;
        canvas.height = swapDimensions ? img.width : img.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(src);
          return;
        }

        ctx.filter = `brightness(${brightnessValue}%)`;
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((normalizedRotation * Math.PI) / 180);

        const drawWidth = img.width * scale;
        const drawHeight = img.height * scale;
        ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);

        resolve(canvas.toDataURL('image/jpeg', 0.92));
      };

      img.onerror = () => resolve(src);
      img.src = src;
    })
  );

  const handleDone = async () => {
    const processedImages = await Promise.all(
      images.map((image, idx) => applyImageAdjustments(image, rotations[idx], scales[idx], brightness[idx]))
    );

    navigate('/sell/details', {
      state: {
        scannedData: {
          ...frontCoverData,
          imageUrl: processedImages[0],
          backCoverUrl: processedImages.length > 1 ? processedImages[1] : undefined,
          extraImages: processedImages.slice(2)
        }
      }
    });
  };

  const handleRetake = () => {
    navigate('/sell');
  };

  const handleRotate = () => {
    setRotations(prev => {
      const newRotations = [...prev];
      newRotations[currentIndex] = (newRotations[currentIndex] + 90) % 360;
      return newRotations;
    });
  };

  const handleCrop = () => {
    setScales(prev => {
      const newScales = [...prev];
      // Toggle between 1x, 1.25x, 1.5x
      newScales[currentIndex] = newScales[currentIndex] >= 1.5 ? 1 : newScales[currentIndex] + 0.25;
      return newScales;
    });
  };

  const handleAdjust = () => {
    setBrightness(prev => {
      const newBrightness = [...prev];
      // Toggle between 100%, 120%, 140%, 80%
      newBrightness[currentIndex] = newBrightness[currentIndex] === 100 ? 120 : 
                                    newBrightness[currentIndex] === 120 ? 140 : 
                                    newBrightness[currentIndex] === 140 ? 80 : 100;
      return newBrightness;
    });
  };

  if (images.length === 0) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-6">
        <p className="text-gray-500 mb-4">No images to edit.</p>
        <button onClick={() => navigate('/sell')} className="bg-booxie-green text-white px-6 py-2 rounded-full">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-sans">
      {/* Header */}
      <div className="bg-white px-4 py-4 flex items-center justify-between shadow-sm shrink-0">
        <button onClick={() => navigate('/sell')} className="text-booxie-green font-medium text-sm">
          Add
        </button>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900 border-b border-dashed border-gray-400">
            Booxie {new Date().toLocaleDateString('en-GB', { year: '2-digit', month: '2-digit', day: '2-digit' }).replace(/\//g, '.')} {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
          </span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
          </svg>
        </div>
        <div className="w-8"></div>
      </div>

      {/* Image Carousel */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-[#F8F9FA]">
        <div className="w-full h-full max-h-[70vh] flex items-center justify-center px-12 relative">
          {/* Previous Image Hint */}
          {currentIndex > 0 && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-[60vh] opacity-50 overflow-hidden rounded-r-2xl">
              <img src={images[currentIndex - 1]} alt="Previous" className="w-full h-full object-cover" />
            </div>
          )}
          
          {/* Current Image */}
          <div className="w-full h-full max-w-sm rounded-2xl overflow-hidden shadow-lg relative z-10 flex items-center justify-center bg-black/5">
            <img 
              src={images[currentIndex]} 
              alt="Current scan" 
              className="w-full h-full object-contain transition-all duration-300" 
              style={{
                transform: `rotate(${rotations[currentIndex]}deg) scale(${scales[currentIndex]})`,
                filter: `brightness(${brightness[currentIndex]}%)`
              }}
            />
          </div>

          {/* Next Image Hint */}
          {currentIndex < images.length - 1 && (
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-[60vh] opacity-50 overflow-hidden rounded-l-2xl">
              <img src={images[currentIndex + 1]} alt="Next" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      </div>

      {/* Carousel Indicator */}
      <div className="py-4 flex justify-center shrink-0">
        <div className="flex items-center gap-4 bg-white border border-gray-200 rounded-full px-4 py-1.5 shadow-sm">
          <button 
            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
            className="p-1 disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-medium text-gray-600 w-8 text-center">
            {currentIndex + 1}/{images.length}
          </span>
          <button 
            onClick={() => setCurrentIndex(prev => Math.min(images.length - 1, prev + 1))}
            disabled={currentIndex === images.length - 1}
            className="p-1 disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Thumbnail Filmstrip */}
      <div className="px-6 py-4 flex gap-3 overflow-x-auto hide-scrollbar shrink-0 bg-white/50 border-y border-gray-100">
        {images.map((img, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`relative shrink-0 w-16 aspect-[3/4] rounded-lg overflow-hidden border-2 transition-all ${
              currentIndex === idx ? 'border-booxie-green ring-2 ring-booxie-green/20' : 'border-transparent'
            }`}
          >
            <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
            <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[8px] px-1.5 py-0.5 rounded-md font-bold">
              {idx === 0 ? 'FRONT' : idx === 1 ? 'BACK' : 'DOC'}
            </span>
          </button>
        ))}
        {images.length < 3 && (
          <button 
            onClick={() => navigate('/sell')}
            className="shrink-0 w-16 aspect-[3/4] rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-booxie-green hover:text-booxie-green transition-all"
          >
            <Camera className="w-5 h-5" />
            <span className="text-[8px] font-bold">ADD</span>
          </button>
        )}
      </div>

      {/* Bottom Tools */}
      <div className="bg-white px-6 py-4 pb-safe flex items-center justify-between shadow-[0_-4px_10px_rgba(0,0,0,0.05)] shrink-0">
        <button onClick={handleRetake} className="flex flex-col items-center gap-1 text-gray-600 hover:text-booxie-green transition-colors">
          <Camera className="w-6 h-6" />
          <span className="text-[10px] font-medium">Retake</span>
        </button>
        
        <button onClick={handleCrop} className={`flex flex-col items-center gap-1 transition-colors ${scales[currentIndex] > 1 ? 'text-booxie-green' : 'text-gray-600 hover:text-booxie-green'}`}>
          <Crop className="w-6 h-6" />
          <span className="text-[10px] font-medium">Crop</span>
        </button>
        
        <button onClick={handleRotate} className={`flex flex-col items-center gap-1 transition-colors ${rotations[currentIndex] !== 0 ? 'text-booxie-green' : 'text-gray-600 hover:text-booxie-green'}`}>
          <RotateCcw className="w-6 h-6" />
          <span className="text-[10px] font-medium">Rotate</span>
        </button>
        
        <button onClick={handleAdjust} className={`flex flex-col items-center gap-1 transition-colors ${brightness[currentIndex] !== 100 ? 'text-booxie-green' : 'text-gray-600 hover:text-booxie-green'}`}>
          <SlidersHorizontal className="w-6 h-6" />
          <span className="text-[10px] font-medium">Adjust</span>
        </button>

        <button 
          onClick={handleDone}
          className="w-12 h-12 bg-booxie-green text-white rounded-xl flex items-center justify-center shadow-md hover:bg-booxie-green-dark transition-colors ml-2"
        >
          <Check className="w-6 h-6" />
        </button>
      </div>
      
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
