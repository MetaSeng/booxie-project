import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import { getGeminiAI } from '../lib/gemini';
import { Loader2, ReceiptText, FileText, Book, BookOpen, FileSearch, Check, CameraOff } from 'lucide-react';
import { isGeminiQuotaError } from '../lib/geminiErrors';
import { motion, AnimatePresence } from 'motion/react';

const SCAN_MODEL = 'gemini-2.5-flash';

const SCAN_TYPES = [
  { id: 'Front Cover', icon: Book, priority: 'priority' },
  { id: 'Back Cover', icon: BookOpen, priority: 'priority' },
  { id: 'Receipt', icon: ReceiptText, priority: 'optional' },
  { id: 'Bank Invoice', icon: FileText, priority: 'optional' },
  { id: 'Website Page', icon: FileSearch, priority: 'optional' },
];

type FrontCoverScanResult = {
  detected: boolean;
  title?: string;
  author?: string;
  description?: string;
  price?: number;
};

type BackCoverScanResult = {
  detected: boolean;
};

function extractJsonPayload(text: string): string {
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return cleaned.slice(firstBrace, lastBrace + 1);
  }

  return cleaned;
}

function parseScanJson<T>(rawText: string | undefined): T | null {
  if (!rawText) return null;

  try {
    return JSON.parse(extractJsonPayload(rawText)) as T;
  } catch {
    return null;
  }
}

export default function SellScreen() {
  const navigate = useNavigate();
  const webcamRef = useRef<Webcam>(null);
  const isScanningRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [activeTab, setActiveTab] = useState('Front Cover');
  const [listingType, setListingType] = useState<'sale' | 'donation'>('sale');
  const [frontCoverData, setFrontCoverData] = useState<any>(null);
  const [frontCoverImage, setFrontCoverImage] = useState<string | null>(null);
  const [backCoverImage, setBackCoverImage] = useState<string | null>(null);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  
  const frontCoverRef = useRef<string | null>(null);
  const backCoverRef = useRef<string | null>(null);
  const receiptRef = useRef<string | null>(null);
  const [autoScanEnabled, setAutoScanEnabled] = useState(true);

  // Get active index for dynamic layout
  const activeIndex = useMemo(() => SCAN_TYPES.findIndex(t => t.id === activeTab), [activeTab]);

  const getImageForType = (typeId: string) => {
    switch (typeId) {
      case 'Front Cover': return frontCoverImage;
      case 'Back Cover': return backCoverImage;
      case 'Receipt': return receiptImage;
      default: return null;
    }
  };

  const buildFallbackFrontCoverData = useCallback(() => ({
    title: 'Untitled Book',
    author: 'Unknown Author',
    description: '',
    price: listingType === 'donation' ? 0 : 5,
    condition: 'Good',
    type: listingType,
  }), [listingType]);

  // Sync front cover data with listing type
  useEffect(() => {
    if (frontCoverData) {
      setFrontCoverData((prev: any) => ({
        ...prev,
        type: listingType,
        price: listingType === 'donation' ? 0 : (prev.price === 0 ? 5.00 : prev.price)
      }));
    }
  }, [listingType]);

  // Center the active tab on mount or change
  useEffect(() => {
    const container = scrollRef.current;
    if (container && activeIndex !== -1) {
      const cardWidth = 96; // (W=80 + gap-4=16) -> 96
      const scrollPos = (activeIndex * cardWidth) - (container.offsetWidth / 2) + (cardWidth / 2);
      
      container.scrollTo({ 
        left: scrollPos, 
        behavior: container.scrollLeft === 0 ? 'auto' : 'smooth' 
      });
    }
  }, [activeIndex]);

  const analyzeFrontCover = useCallback(async (base64String: string) => {
    const ai = getGeminiAI();
    if (!ai) return null;

    const response = await ai.models.generateContent({
      model: SCAN_MODEL,
      contents: {
        parts: [
          { text: 'Analyze this camera frame. Determine whether it clearly shows the FRONT COVER of a single physical book. If yes, extract the visible title and author, add a short marketplace-friendly description, and suggest a reasonable resale price between 3 and 9 USD. Return JSON only.' },
          { inlineData: { data: base64String, mimeType: 'image/jpeg' } }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            detected: { type: 'BOOLEAN' },
            title: { type: 'STRING' },
            author: { type: 'STRING' },
            description: { type: 'STRING' },
            price: { type: 'NUMBER' }
          },
          required: ['detected']
        }
      }
    });

    return parseScanJson<FrontCoverScanResult>(response.text);
  }, []);

  const analyzeBackCover = useCallback(async (base64String: string) => {
    const ai = getGeminiAI();
    if (!ai) return null;

    const response = await ai.models.generateContent({
      model: SCAN_MODEL,
      contents: {
        parts: [
          { text: 'Analyze this camera frame. Determine whether it clearly shows the BACK COVER or back page of a single physical book. Return JSON only.' },
          { inlineData: { data: base64String, mimeType: 'image/jpeg' } }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            detected: { type: 'BOOLEAN' }
          },
          required: ['detected']
        }
      }
    });

    return parseScanJson<BackCoverScanResult>(response.text);
  }, []);

  const captureAndAnalyze = useCallback(async (isManual = false) => {
    if (isScanningRef.current || !webcamRef.current) return;
    if (!cameraReady) {
      setError('Camera is not ready yet. Please allow camera access and try again.');
      return;
    }
    
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      setError('Unable to capture an image from the camera. Please try again.');
      return;
    }

    isScanningRef.current = true;
    setIsScanning(true);
    if (isManual) setError('');
    
    const base64String = imageSrc.split(',')[1];
    
    try {
      const ai = getGeminiAI();
      if (!ai) {
        setAutoScanEnabled(false);
        setError('AI scanning is not configured. Add `VITE_GEMINI_API_KEY` to enable automatic detection.');
        if (isManual) {
          if (activeTab === 'Front Cover') {
            const fallbackData = buildFallbackFrontCoverData();
            setFrontCoverData(fallbackData);
            setFrontCoverImage(imageSrc);
            frontCoverRef.current = imageSrc;
            setActiveTab('Back Cover');
          } else if (activeTab === 'Back Cover') {
            setBackCoverImage(imageSrc);
            backCoverRef.current = imageSrc;
            navigate('/sell/edit', {
              state: {
                images: [frontCoverRef.current, imageSrc, receiptRef.current].filter(Boolean),
                frontCoverData: frontCoverData || buildFallbackFrontCoverData(),
              }
            });
          } else if (activeTab === 'Receipt') {
            setReceiptImage(imageSrc);
            receiptRef.current = imageSrc;
          }
        }
        return;
      }

      if (activeTab === 'Front Cover') {
        const data = await analyzeFrontCover(base64String);

        if (data?.detected) {
          setError('');
          setFrontCoverData({
            title: data.title?.trim() || 'Untitled Book',
            author: data.author?.trim() || 'Unknown Author',
            description: data.description?.trim() || '',
            type: listingType,
            price: listingType === 'donation'
              ? 0
              : Math.min(9, Math.max(3, Number(data.price) || 5)),
            condition: 'Good',
          });
          setFrontCoverImage(imageSrc);
          frontCoverRef.current = imageSrc;
          setTimeout(() => {
            setActiveTab('Back Cover');
          }, 1000);
        } else if (isManual) {
          const fallbackData = buildFallbackFrontCoverData();
          setFrontCoverData(fallbackData);
          setFrontCoverImage(imageSrc);
          frontCoverRef.current = imageSrc;
          setActiveTab('Back Cover');
        } else if (!data) {
          setError('AI scan returned an unreadable result. Tap the shutter to continue manually.');
        }
      } else if (activeTab === 'Back Cover') {
        const data = await analyzeBackCover(base64String);

        if (data?.detected) {
          setError('');
          setBackCoverImage(imageSrc);
          backCoverRef.current = imageSrc;
          setTimeout(() => {
            navigate('/sell/edit', { 
              state: { 
                images: [frontCoverRef.current, imageSrc, receiptRef.current].filter(Boolean), 
                frontCoverData: frontCoverData || buildFallbackFrontCoverData()
              } 
            });
          }, 1500); 
        } else if (isManual) {
          setBackCoverImage(imageSrc);
          backCoverRef.current = imageSrc;
          navigate('/sell/edit', {
            state: {
              images: [frontCoverRef.current, imageSrc, receiptRef.current].filter(Boolean),
              frontCoverData: frontCoverData || buildFallbackFrontCoverData(),
            }
          });
        } else if (!data) {
          setError('AI scan returned an unreadable result. Tap the shutter to continue manually.');
        }
      } else if (activeTab === 'Receipt') {
        setReceiptImage(imageSrc);
        receiptRef.current = imageSrc;
      }
    } catch (err: any) {
      console.error(err);
      if (isGeminiQuotaError(err)) {
        setAutoScanEnabled(false);
        setError('Gemini API quota exceeded. Please try again in 1 minute or use a different network.');
      } else if (isManual) {
        setError('Failed to scan. Please try again with better lighting.');
      } else {
        setError('Automatic AI scan failed. Tap the shutter to continue manually.');
      }
    } finally {
      isScanningRef.current = false;
      setIsScanning(false);
    }
  }, [activeTab, analyzeBackCover, analyzeFrontCover, buildFallbackFrontCoverData, cameraReady, frontCoverData, listingType, navigate]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const runAutoScan = async () => {
      if (!autoScanEnabled || !cameraReady || cameraError) return;
      if (activeTab === 'Front Cover' || activeTab === 'Back Cover') {
        await captureAndAnalyze();
        timeoutId = setTimeout(runAutoScan, 8000); // 8s interval for AI detection
      }
    };
    runAutoScan();
    return () => clearTimeout(timeoutId);
  }, [autoScanEnabled, activeTab, captureAndAnalyze]);

  const handleManualCapture = () => captureAndAnalyze(true);
  const handleDone = () => navigate('/');
  const handleManualListing = () => {
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
    <div className="fixed inset-0 bg-[#1A8765] z-50 flex flex-col font-sans overflow-hidden text-white">
      {/* Header */}
      <div className="pt-12 pb-4 px-6 flex justify-between items-center z-50 relative">
        <div className="flex bg-white/10 backdrop-blur-xl rounded-2xl p-1 shadow-xl border border-white/10">
          <button 
            onClick={() => setListingType('sale')}
            className={`px-7 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
              listingType === 'sale' 
                ? 'bg-white text-[#1A8765] shadow-lg scale-105' 
                : 'text-white/80 hover:text-white hover:bg-white/5'
            }`}
          >
            SELL
          </button>
          <button 
            onClick={() => setListingType('donation')}
            className={`px-7 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
              listingType === 'donation' 
                ? 'bg-white text-[#1A8765] shadow-lg scale-105' 
                : 'text-white/80 hover:text-white hover:bg-white/5'
            }`}
          >
            DONATE
          </button>
        </div>
        <button 
          onClick={handleDone}
          className="px-6 py-2 bg-white/10 backdrop-blur-md border border-white/30 rounded-xl text-white text-sm font-bold hover:bg-white/20 transition-all active:scale-95 shadow-lg"
        >
          Done
        </button>
      </div>

      <div className="px-6 pb-2 shrink-0">
        <button
          onClick={handleManualListing}
          className="w-full rounded-2xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur-md hover:bg-white/15 transition-colors"
        >
          Enter Book Details Manually
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative flex flex-col items-center justify-center min-h-0 px-6">
        {/* Scanning Box */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative w-full aspect-[9/18] max-w-sm rounded-[50px] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.5)] border border-white/10 bg-black/20"
        >
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            screenshotQuality={0.92}
            videoConstraints={{ facingMode: "environment" }}
            onUserMedia={() => {
              setCameraReady(true);
              setCameraError('');
            }}
            onUserMediaError={() => {
              setCameraReady(false);
              setCameraError('Camera access failed. Please allow camera permission or try another browser/device.');
            }}
            className="w-full h-full object-cover"
          />

          {cameraError && (
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-center px-6">
              <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mb-4">
                <CameraOff className="w-7 h-7 text-white" />
              </div>
              <p className="text-sm font-bold">{cameraError}</p>
              <p className="text-xs text-white/80 mt-2">You can still continue after granting camera access and reopening this screen.</p>
            </div>
          )}
          
          {/* Corner Brackets */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-10 left-10 w-16 h-16 border-t-[5px] border-l-[5px] border-white rounded-tl-[32px] opacity-90"></div>
            <div className="absolute top-10 right-10 w-16 h-16 border-t-[5px] border-r-[5px] border-white rounded-tr-[32px] opacity-90"></div>
            <div className="absolute bottom-10 left-10 w-16 h-16 border-b-[5px] border-l-[5px] border-white rounded-bl-[32px] opacity-90"></div>
            <div className="absolute bottom-10 right-10 w-16 h-16 border-b-[5px] border-r-[5px] border-white rounded-br-[32px] opacity-90"></div>
          </div>

          <AnimatePresence>
            {isScanning && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-xl text-white px-6 py-2.5 rounded-full flex items-center gap-3 text-sm font-bold shadow-2xl border border-white/20"
              >
                <Loader2 className="w-4 h-4 animate-spin text-[#32B38B]" />
                <span>Scanning {activeTab}...</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 bg-red-500 text-white px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-wider text-center shadow-2xl border border-red-400 max-w-xs z-50"
          >
            {error}
            <button onClick={() => setError('')} className="ml-4 text-white/60 hover:text-white transition-colors">x</button>
          </motion.div>
        )}
      </div>

      {/* Bottom Interface */}
      <div className="relative pb-10 pt-4 shrink-0 overflow-hidden bg-gradient-to-t from-black/20 to-transparent">
        {/* Carousel Area */}
        <div 
          ref={scrollRef}
          className="flex overflow-x-auto hide-scrollbar snap-x snap-mandatory gap-4 px-[40%] py-6 h-52 items-center relative z-10"
        >
          {SCAN_TYPES.map((type, index) => {
            const isActive = activeTab === type.id;
            const diff = index - activeIndex;
            const Icon = type.icon;
            const scannedImage = getImageForType(type.id);
            
            // Animation values based on proximity to center
            const scale = isActive ? 1.25 : 0.85;
            const opacity = isActive ? 1 : 0.4;
            const brightness = isActive ? 'brightness(1.1)' : 'brightness(0.7)';
            const zIndex = isActive ? 50 : 50 - Math.abs(diff);

            return (
              <motion.button
                key={type.id}
                onClick={() => setActiveTab(type.id)}
                whileTap={{ scale: 0.95 }}
                animate={{
                  scale,
                  opacity,
                  filter: brightness,
                  zIndex,
                  x: diff * 8, // Ultra-compact perspective
                }}
                transition={{ 
                  duration: 0.4, 
                  ease: "easeInOut"
                }}
                className={`snap-center shrink-0 w-16 h-24 flex flex-col items-center justify-center gap-1.5 relative rounded-[22px] border transition-all duration-300 ${
                  isActive 
                    ? 'bg-white/90 backdrop-blur-md border-white shadow-[0_12px_30px_rgba(0,0,0,0.3)]' 
                    : 'bg-white/5 border-white/5'
                }`}
              >
                {/* Foreground Content */}
                <div className="relative z-10 flex flex-col items-center gap-1.5 w-full h-full p-1.5">
                  <div className={`w-full h-[70%] rounded-[16px] flex items-center justify-center overflow-hidden transition-colors ${
                    isActive ? 'bg-[#E8F5F0]' : 'bg-black/5'
                  }`}>
                    {scannedImage ? (
                      <img src={scannedImage} alt="Thumbnail" className="w-full h-full object-cover" />
                    ) : (
                      <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-[#1A8765]' : 'text-white/60'}`} />
                    )}
                  </div>
                  <span className={`text-[6px] font-black text-center leading-tight uppercase tracking-[0.1em] transition-colors ${
                    isActive ? 'text-[#1A8765]' : 'text-white/40'
                  }`}>
                    {type.id === 'Website Page' ? 'Web' : type.id.split(' ')[0]}
                  </span>
                </div>

                {/* Priority Indicator */}
                {type.priority === 'priority' && !scannedImage && (
                  <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${isActive ? 'bg-amber-400' : 'bg-amber-400/50'} shadow-lg`} />
                )}
                {scannedImage && (
                  <div className="absolute top-2 right-2 bg-[#1A8765] rounded-full p-0.5 shadow-lg">
                    <Check className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Action Controls */}
        <div className="flex justify-center items-center gap-10 mt-2 px-10 relative z-10">
          <div className="w-14 h-14" /> {/* Spacer */}

          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleManualCapture}
            disabled={isScanning || !!cameraError}
            className="relative w-20 h-20 rounded-full border-[5px] border-white/40 flex items-center justify-center p-1 group disabled:opacity-50"
          >
            <div className="w-full h-full bg-white rounded-full shadow-[0_0_30px_rgba(255,255,255,0.4)] group-active:scale-95 transition-transform" />
            <div className="absolute inset-2 border-2 border-[#1A8765]/20 rounded-full" />
          </motion.button>

          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate('/sell/edit', { 
              state: { 
                images: [frontCoverRef.current, backCoverRef.current, receiptRef.current].filter(Boolean), 
                frontCoverData 
              } 
            })}
            className="w-14 h-14 bg-white text-[#1A8765] rounded-2xl flex items-center justify-center shadow-2xl font-bold text-xs"
          >
            NEXT
          </motion.button>
        </div>
      </div>
      
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
