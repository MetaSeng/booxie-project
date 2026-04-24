import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import BooxieLogo from '../components/BooxieLogo';
import { isDemoModeEnabled, logInAsDemo, signInWithGoogle } from '../firebase';
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
      const user = await signInWithGoogle();
      if (user) {
        navigate('/');
      }
    } catch (err: any) {
      console.error("Failed to sign in with Google", err);
      setError(err.message || 'Failed to sign in with Google');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGuestContinue = async () => {
    if (!isDemoModeEnabled()) {
      setError('Guest mode is unavailable in this environment.');
      return;
    }

    try {
      setIsGuestLoading(true);
      setError('');
      // Attempt real demo login first
      await logInAsDemo();
      navigate('/');
    } catch (err: any) {
      console.error("Failed to sign in as guest", err);
      
      // If even email/pass auth is disabled in the console, use local guest fallback
      if (err.code === 'auth/operation-not-allowed' || err.code === 'auth/admin-restricted-operation') {
        localStorage.setItem('guestMode', 'true');
        // Force a small delay to simulate loading for UX
        setTimeout(() => {
          navigate('/');
        }, 800);
      } else {
        setError('Connection error. Please try again or refresh the page.');
      }
    } finally {
      setIsGuestLoading(false);
    }
  };

  return (
    <div className="h-full h-dvh bg-[#F4FBF7] flex flex-col items-center justify-center p-6 text-center overflow-hidden font-sans">
      {error && (
        <div className="fixed top-4 left-4 right-4 z-50 bg-red-50 text-red-600 p-4 rounded-xl text-xs text-center border border-red-100 shadow-lg">
          {error}
          <button onClick={() => setError('')} className="ml-2 font-bold underline">Dismiss</button>
        </div>
      )}
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

        <button
          onClick={handleGuestContinue}
          disabled={isGuestLoading}
          className="w-full bg-white text-[#00845A] border-2 border-[#00845A] py-3.5 rounded-2xl font-bold text-xl hover:bg-[#E8F5F0] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          {isGuestLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Continue as Guest'}
        </button>
      </motion.div>
    </div>
  );
}
