import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import { getGeminiAI } from '../lib/gemini';
import { Loader2, ReceiptText, FileText, Book, BookOpen, FileSearch, Check, CameraOff, ScanLine, Sparkles } from 'lucide-react';
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

const SCAN_GUIDANCE: Record<string, { title: string; hint: string }> = {
  'Front Cover': {
    title: 'Scan the front cover',
    hint: 'Center the book title and author inside the frame.',
  },
  'Back Cover': {
    title: 'Scan the back cover',
    hint: 'Flip the book and keep the full back page visible.',
  },
  'Receipt': {
    title: 'Scan receipt',
    hint: 'Place the full document in view with readable text.',
  },
  'Bank Invoice': {
    title: 'Scan bank invoice',
    hint: 'Keep the paper flat and avoid glare.',
  },
  'Website Page': {
    title: 'Scan website page',
    hint: 'Hold the screen steady and reduce reflections.',
  },
};

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
  const [lastDetectionMessage, setLastDetectionMessage] = useState('AI is ready to scan when the book is centered.');
  
  const frontCoverRef = useRef<string | null>(null);
  const backCoverRef = useRef<string | null>(null);
  const receiptRef = useRef<string | null>(null);
  const [autoScanEnabled, setAutoScanEnabled] = useState(true);

  // Get active index for dynamic layout
  const activeIndex = useMemo(() => SCAN_TYPES.findIndex(t => t.id === activeTab), [activeTab]);
  const activeGuidance = SCAN_GUIDANCE[activeTab] || SCAN_GUIDANCE['Front Cover'];

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

  useEffect(() => {
    setLastDetectionMessage(activeGuidance.hint);
  }, [activeGuidance.hint]);

  const goToEditScreen = useCallback((backImageSrc?: string | null) => {
    navigate('/sell/edit', {
      state: {
        images: [frontCoverRef.current, backImageSrc ?? backCoverRef.current, receiptRef.current].filter(Boolean),
        frontCoverData: frontCoverData || buildFallbackFrontCoverData(),
      }
    });
  }, [buildFallbackFrontCoverData, frontCoverData, navigate]);

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
            setLastDetectionMessage('Front cover captured. Now scan the back cover.');
            setActiveTab('Back Cover');
          } else if (activeTab === 'Back Cover') {
            setBackCoverImage(imageSrc);
            backCoverRef.current = imageSrc;
            setLastDetectionMessage('Back cover captured. Review and adjust your photos.');
            goToEditScreen(imageSrc);
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
          setLastDetectionMessage('Front cover detected. Preparing the next scan.');
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
          setLastDetectionMessage('Front cover captured manually. Next: back cover.');
          setActiveTab('Back Cover');
        } else if (!data) {
          setError('AI scan returned an unreadable result. Tap the shutter to continue manually.');
          setLastDetectionMessage('The AI could not read this frame. Try moving closer or tapping the shutter.');
        } else {
          setLastDetectionMessage('No clear front cover yet. Keep the whole cover inside the guide.');
        }
      } else if (activeTab === 'Back Cover') {
        const data = await analyzeBackCover(base64String);

        if (data?.detected) {
          setError('');
          setLastDetectionMessage('Back cover detected. Opening review.');
          setBackCoverImage(imageSrc);
          backCoverRef.current = imageSrc;
          setTimeout(() => {
            goToEditScreen(imageSrc);
          }, 1500); 
        } else if (isManual) {
          setBackCoverImage(imageSrc);
          backCoverRef.current = imageSrc;
          setLastDetectionMessage('Back cover captured manually. Opening review.');
          goToEditScreen(imageSrc);
        } else if (!data) {
          setError('AI scan returned an unreadable result. Tap the shutter to continue manually.');
          setLastDetectionMessage('The AI could not read this frame. Try pulling the book slightly closer.');
        } else {
          setLastDetectionMessage('No clear back cover yet. Keep the full back page inside the guide.');
        }
      } else if (activeTab === 'Receipt') {
        setReceiptImage(imageSrc);
        receiptRef.current = imageSrc;
        setLastDetectionMessage('Receipt captured.');
      }
    } catch (err: any) {
      console.error(err);
      if (isGeminiQuotaError(err)) {
        setAutoScanEnabled(false);
        setError('Gemini API quota exceeded. Please try again in 1 minute or use a different network.');
        setLastDetectionMessage('Auto scan paused because the AI quota was hit.');
      } else if (isManual) {
        setError('Failed to scan. Please try again with better lighting.');
        setLastDetectionMessage('Manual capture failed. Try brighter light and less glare.');
      } else {
        setError('Automatic AI scan failed. Tap the shutter to continue manually.');
        setLastDetectionMessage('Automatic scan failed. You can still capture manually.');
      }
    } finally {
      isScanningRef.current = false;
      setIsScanning(false);
    }
  }, [activeTab, analyzeBackCover, analyzeFrontCover, buildFallbackFrontCoverData, cameraReady, frontCoverData, goToEditScreen, listingType, navigate]);

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
        <div className="w-full max-w-md mb-4 rounded-[28px] border border-white/15 bg-black/20 backdrop-blur-md px-5 py-4 shadow-xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[#7FE2C4] text-[11px] font-black uppercase tracking-[0.18em] mb-2">
                <ScanLine className="w-4 h-4" />
                Automatic Scan
              </div>
              <h2 className="text-lg font-bold text-white leading-tight">{activeGuidance.title}</h2>
              <p className="text-sm text-white/75 mt-1">{lastDetectionMessage}</p>
            </div>
            <div className={`shrink-0 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] border ${isScanning ? 'bg-[#32B38B] text-white border-[#6FE0BE]' : 'bg-white/8 text-white/70 border-white/15'}`}>
              {isScanning ? 'Detecting' : 'Ready'}
            </div>
          </div>
        </div>

        {/* Scanning Box */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative w-full max-w-md md:max-w-lg aspect-[3/4] min-h-[480px] rounded-[42px] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.5)] border border-white/10 bg-black/20"
        >
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            screenshotQuality={0.98}
            minScreenshotWidth={1440}
            minScreenshotHeight={1920}
            videoConstraints={{ facingMode: "environment", aspectRatio: 0.75 }}
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
            <div className="absolute inset-x-[8%] top-[18%] bottom-[20%] rounded-[34px] border border-white/20 bg-black/10 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]" />
            <div className="absolute inset-x-[8%] top-[18%] bottom-[20%] rounded-[34px]">
              <div className="absolute top-0 left-0 w-20 h-20 border-t-[5px] border-l-[5px] border-white rounded-tl-[28px] opacity-95"></div>
              <div className="absolute top-0 right-0 w-20 h-20 border-t-[5px] border-r-[5px] border-white rounded-tr-[28px] opacity-95"></div>
              <div className="absolute bottom-0 left-0 w-20 h-20 border-b-[5px] border-l-[5px] border-white rounded-bl-[28px] opacity-95"></div>
              <div className="absolute bottom-0 right-0 w-20 h-20 border-b-[5px] border-r-[5px] border-white rounded-br-[28px] opacity-95"></div>
            </div>
            <div className="absolute left-1/2 top-[14%] -translate-x-1/2 rounded-full bg-black/55 border border-white/15 px-4 py-2 text-[11px] font-bold text-white/85 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#7FE2C4]" />
                {activeGuidance.hint}
              </div>
            </div>
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
      <div className="relative pb-8 pt-3 shrink-0 overflow-hidden bg-gradient-to-t from-black/35 to-transparent">
        {/* Carousel Area */}
        <div 
          ref={scrollRef}
          className="flex overflow-x-auto hide-scrollbar snap-x snap-mandatory gap-4 px-[32%] py-4 h-44 items-center relative z-10"
        >
          {SCAN_TYPES.map((type, index) => {
            const isActive = activeTab === type.id;
            const diff = index - activeIndex;
            const Icon = type.icon;
            const scannedImage = getImageForType(type.id);
            
            // Animation values based on proximity to center
            const scale = isActive ? 1.14 : 0.84;
            const opacity = isActive ? 1 : 0.46;
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
                className={`snap-center shrink-0 w-[72px] h-[104px] flex flex-col items-center justify-center gap-1.5 relative rounded-[24px] border transition-all duration-300 ${
                  isActive 
                    ? 'bg-white/95 backdrop-blur-md border-white shadow-[0_16px_36px_rgba(0,0,0,0.28)]' 
                    : 'bg-white/7 border-white/8'
                }`}
              >
                {/* Foreground Content */}
                <div className="relative z-10 flex flex-col items-center gap-1.5 w-full h-full p-2">
                  <div className={`w-full h-[68%] rounded-[18px] flex items-center justify-center overflow-hidden transition-colors ${
                    isActive ? 'bg-[#E8F5F0]' : 'bg-black/5'
                  }`}>
                    {scannedImage ? (
                      <img src={scannedImage} alt="Thumbnail" className="w-full h-full object-cover" />
                    ) : (
                      <Icon className={`w-[18px] h-[18px] transition-colors ${isActive ? 'text-[#1A8765]' : 'text-white/60'}`} />
                    )}
                  </div>
                  <span className={`text-[7px] font-black text-center leading-tight uppercase tracking-[0.14em] transition-colors ${
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
        <div className="mx-5 mt-2 rounded-[30px] border border-white/10 bg-black/20 backdrop-blur-xl px-5 py-4 shadow-[0_24px_50px_rgba(0,0,0,0.25)] relative z-10">
          <div className="flex items-center justify-between gap-4">
            <motion.button 
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate('/sell/edit', { 
                state: { 
                  images: [frontCoverRef.current, backCoverRef.current, receiptRef.current].filter(Boolean), 
                  frontCoverData 
                } 
              })}
              className="flex h-14 min-w-[72px] items-center justify-center rounded-2xl border border-white/15 bg-white/12 px-4 text-[11px] font-black uppercase tracking-[0.16em] text-white shadow-lg"
            >
              Next
            </motion.button>

            <div className="flex flex-col items-center">
              <motion.button 
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleManualCapture}
                disabled={isScanning || !!cameraError}
                className="relative w-24 h-24 rounded-full border-[6px] border-white/35 flex items-center justify-center p-1.5 group disabled:opacity-50 shadow-[0_0_0_10px_rgba(255,255,255,0.08)]"
              >
                <div className="w-full h-full bg-white rounded-full shadow-[0_0_30px_rgba(255,255,255,0.38)] group-active:scale-95 transition-transform" />
                <div className="absolute inset-2.5 border-2 border-[#1A8765]/18 rounded-full" />
              </motion.button>
              <span className="mt-3 text-[10px] font-black uppercase tracking-[0.18em] text-white/70">
                Tap To Capture
              </span>
            </div>

            <div className="flex min-w-[72px] justify-end">
              <div className="rounded-2xl border border-white/12 bg-white/8 px-3 py-2.5 text-right shadow-lg">
                <div className="text-[9px] font-black uppercase tracking-[0.16em] text-white/55">Mode</div>
                <div className="mt-1 text-[11px] font-bold text-white">{activeTab}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
