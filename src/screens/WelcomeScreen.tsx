import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import BooxieLogo from '../components/BooxieLogo';
import { signInAnonymously, signInWithGoogle } from '../firebase';
import { Loader2 } from 'lucide-react';

export default function WelcomeScreen() {
  const navigate = useNavigate();
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    try {
      setIsGoogleLoading(true);
      setError('');
      await signInWithGoogle();
      navigate('/');
    } catch (err: any) {
      console.error("Failed to sign in with Google", err);
      setError(err.message || 'Failed to sign in with Google');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGuestContinue = async () => {
    try {
      setIsGuestLoading(true);
      await signInAnonymously();
      navigate('/');
    } catch (error) {
      console.error("Failed to sign in as guest", error);
      // Fallback to old behavior if anonymous auth fails (e.g. not enabled in console)
      localStorage.setItem('guestMode', 'true');
      navigate('/');
    } finally {
      setIsGuestLoading(false);
    }
  };

  return (
    <div className="h-full h-dvh bg-[#F4FBF7] flex flex-col items-center justify-center p-6 text-center overflow-hidden font-sans">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col items-center mb-16 shrink-0"
      >
        <div className="mb-8 flex items-center justify-center">
          <BooxieLogo className="w-48 h-48 md:w-56 md:h-56" />
        </div>
        
        <motion.h1 
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-5xl md:text-6xl font-bold text-[#006A4E] tracking-tight"
        >
          Booxie
        </motion.h1>
      </motion.div>
      
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="w-full max-w-xs flex flex-col gap-5 shrink-0"
      >
        <button
          onClick={() => navigate('/signup')}
          className="w-full bg-white text-[#00845A] border-2 border-[#00845A] py-3.5 rounded-2xl font-bold text-xl hover:bg-[#E8F5F0] transition-all active:scale-[0.98]"
        >
          Sign Up
        </button>
        
        <button
          onClick={() => navigate('/login')}
          className="w-full bg-white text-[#00845A] border-2 border-[#00845A] py-3.5 rounded-2xl font-bold text-xl hover:bg-[#E8F5F0] transition-all active:scale-[0.98]"
        >
          Log In
        </button>
      </motion.div>
    </div>
  );
}
