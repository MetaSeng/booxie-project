import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signUpWithEmail } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { 
  User, Mail, Lock, ArrowLeft, Loader2, Camera, Phone, 
  Calendar, ChevronDown, Upload, Info, Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const COUNTRIES = [
  { code: '+855', flag: '🇰🇭', name: 'Cambodia' },
  { code: '+1', flag: '🇺🇸', name: 'United States' },
  { code: '+66', flag: '🇹🇭', name: 'Thailand' },
  { code: '+84', flag: '🇻🇳', name: 'Vietnam' },
  { code: '+44', flag: '🇬🇧', name: 'United Kingdom' },
  { code: '+81', flag: '🇯🇵', name: 'Japan' },
  { code: '+86', flag: '🇨🇳', name: 'China' },
];

export default function SignupScreen() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const studentIdInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user && !loading) {
      navigate('/');
    }
  }, [user, loading, navigate]);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [phone, setPhone] = useState('');
  const [showCountrySelector, setShowCountrySelector] = useState(false);
  const [birthday, setBirthday] = useState('');
  const [gender, setGender] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [studentIdImage, setStudentIdImage] = useState<string | null>(null);
  const [showDocInfo, setShowDocInfo] = useState(false);
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStudentIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setStudentIdImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Please fill in required fields');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      await signUpWithEmail(
        email, 
        password, 
        name, 
        `${country.code} ${phone}`, 
        birthday, 
        gender, 
        profileImage,
        studentIdImage
      );
      localStorage.removeItem('guestMode');
      // Pass a message to Login page
      navigate('/login', { state: { message: 'Account created successfully! Please log in.' } });
    } catch (err: any) {
      console.error(err);
      let msg = err.message || 'Failed to sign up. Please try again.';
      if (msg.includes('auth/network-request-failed')) {
        msg = 'Network connection failed. Try opening this app in a new tab or verify your Authorized Domains in Firebase.';
      }
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: 'spring' as const, stiffness: 300, damping: 24 }
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F7F4] flex flex-col font-sans overflow-y-auto selection:bg-[#00845A]/10">
      {/* Mesh Background Accent */}
      <div className="fixed inset-0 pointer-events-none opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#00845A]/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#B6E3D4]/20 blur-[120px] rounded-full" />
      </div>

      {/* Header */}
      <header className="px-6 py-6 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md bg-[#F0F7F4]/60">
        <motion.button 
          whileHover={{ x: -4 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/welcome')} 
          className="p-2.5 bg-white shadow-soft rounded-2xl text-gray-800"
        >
          <ArrowLeft className="w-5 h-5" />
        </motion.button>
        <motion.h1 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-lg font-bold text-gray-900 tracking-tight"
        >
          Join Booxie
        </motion.h1>
        <div className="w-10"></div>
      </header>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex-1 flex flex-col px-6 pb-12 max-w-md mx-auto w-full relative z-10"
      >
        {/* Profile Section */}
        <motion.div variants={itemVariants} className="flex flex-col items-center mb-10 mt-4">
          <div className="relative group">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleImageClick}
              className="w-32 h-32 rounded-[2.5rem] bg-white shadow-xl flex items-center justify-center overflow-hidden cursor-pointer ring-4 ring-white transition-all group-hover:shadow-2xl"
            >
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-1">
                   <User className="w-12 h-12 text-[#00845A] opacity-20" />
                   <span className="text-[10px] font-bold text-[#00845A]/40 uppercase tracking-tighter">Add Photo</span>
                </div>
              )}
            </motion.div>
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleImageClick}
              className="absolute -bottom-1 -right-1 bg-gray-900 p-3 rounded-2xl text-white shadow-lg z-10"
            >
              <Camera className="w-4 h-4" />
            </motion.button>
            <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
          </div>
        </motion.div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/80 backdrop-blur-sm p-4 rounded-3xl mb-8 border border-red-50 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-1">
               <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
               <span className="text-[11px] font-bold text-red-600 uppercase tracking-widest">Verification Status</span>
            </div>
            <p className="text-xs text-gray-600 pl-4">{error}</p>
          </motion.div>
        )}

        {/* Signup Form */}
        <form onSubmit={handleEmailSignup} className="space-y-6">
          <motion.div variants={itemVariants} className="space-y-4">
            <div className="group relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-focus-within:text-[#00845A] transition-colors" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                className="w-full pl-11 pr-4 py-4 bg-white border-transparent shadow-sm rounded-2xl text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#00845A]/10 focus:border-[#00845A] transition-all"
                required
              />
            </div>

            <div className="group relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-focus-within:text-[#00845A] transition-colors" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                className="w-full pl-11 pr-4 py-4 bg-white border-transparent shadow-sm rounded-2xl text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#00845A]/10 focus:border-[#00845A] transition-all"
                required
              />
            </div>

            <div className="group relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-focus-within:text-[#00845A] transition-colors" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full pl-11 pr-4 py-4 bg-white border-transparent shadow-sm rounded-2xl text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#00845A]/10 focus:border-[#00845A] transition-all"
                required
              />
            </div>

            <div className="group relative">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 mb-1.5 transition-colors group-focus-within:text-[#00845A]">
                Phone Number
              </label>
              <div className="flex items-center bg-white border border-transparent shadow-sm rounded-2xl px-2 py-1.5 focus-within:ring-2 focus-within:ring-[#00845A]/10 focus-within:border-[#00845A] transition-all">
                <button 
                  type="button"
                  onClick={() => setShowCountrySelector(!showCountrySelector)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors shrink-0"
                >
                  <span className="text-lg leading-none">{country.flag}</span>
                  <span className="text-sm font-bold text-gray-800">{country.code}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${showCountrySelector ? 'rotate-180' : ''}`} />
                </button>
                
                <div className="w-px h-6 bg-gray-100 mx-1"></div>
                
                <input 
                  type="tel" 
                  placeholder="012 345 678" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="flex-1 bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-gray-300 text-gray-700"
                />

                <AnimatePresence>
                  {showCountrySelector && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      className="absolute top-full left-0 mt-3 w-full max-h-60 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-50 py-2 flex flex-col"
                    >
                      <div className="px-5 py-3 border-b border-gray-50 flex items-center gap-3">
                        <Search className="w-4 h-4 text-gray-400" />
                        <input 
                          type="text" 
                          placeholder="Search country..."
                          className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400 font-medium"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div className="overflow-y-auto custom-scrollbar flex-1">
                        {COUNTRIES.map(c => (
                          <button
                            key={c.code}
                            type="button"
                            onClick={() => {
                              setCountry(c);
                              setShowCountrySelector(false);
                            }}
                            className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#F0F7F4] transition-colors text-left"
                          >
                            <div className="flex items-center gap-4">
                              <span className="text-xl leading-none">{c.flag}</span>
                              <span className="text-sm font-bold text-gray-800">{c.name}</span>
                            </div>
                            <span className="text-sm font-medium text-gray-400">{c.code}</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-1.5">
            <p className="text-[10px] font-bold text-[#00845A] uppercase tracking-[0.2em] ml-1 opacity-60">Birthday</p>
            <div className="relative group">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#00845A] transition-colors" />
              <input
                type="date"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                className="w-full pl-11 pr-4 py-4 bg-white border-transparent shadow-sm rounded-2xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#00845A]/10 focus:border-[#00845A] transition-all appearance-none"
              />
            </div>
            <p className="text-[10px] text-gray-400 ml-1 italic font-medium">Verify your age to join our trusted community.</p>
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-3">
             <p className="text-[10px] font-bold text-[#00845A] uppercase tracking-[0.2em] ml-1 opacity-60">Identity</p>
             <div className="flex gap-2">
               {['male', 'female', 'other'].map((opt) => (
                 <motion.button
                  key={opt}
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setGender(opt)}
                  className={`flex-1 py-4 px-2 rounded-2xl text-xs font-bold capitalize transition-all ${
                    gender === opt 
                      ? 'bg-[#00845A] text-white shadow-xl shadow-[#00845A]/20 transform-gpu' 
                      : 'bg-white text-gray-500 shadow-sm border border-transparent hover:border-gray-200'
                  }`}
                 >
                   {opt}
                 </motion.button>
               ))}
             </div>
          </motion.div>

          {/* Document Section */}
          <motion.div variants={itemVariants} className="space-y-4 pt-2 relative">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold text-[#00845A] uppercase tracking-[0.2em] ml-1 opacity-60">Verification*</span>
              <button 
                type="button"
                onClick={() => setShowDocInfo(!showDocInfo)}
                className="p-1 hover:bg-[#00845A]/5 rounded-full transition-colors group"
              >
                <Info className="w-3.5 h-3.5 text-[#00845A] group-hover:scale-110 transition-transform" />
              </button>
            </div>

            {showDocInfo && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="overflow-hidden"
              >
                <div className="bg-white border-l-4 border-[#00845A] shadow-soft rounded-2xl p-4 mb-4">
                  <p className="text-xs font-bold text-gray-800 mb-2">Required Proof Architecture</p>
                  <ul className="space-y-2 text-[11px] text-gray-600">
                    <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-gray-400" />Student Enrollment ID</li>
                    <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-gray-400" />National Identification</li>
                    <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-gray-400" />Legal Birth Record</li>
                  </ul>
                </div>
              </motion.div>
            )}
            
            <motion.div 
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => studentIdInputRef.current?.click()}
              className="group w-full h-44 border-2 border-dashed border-gray-200 bg-white/50 rounded-3xl flex flex-col items-center justify-center cursor-pointer transition-all hover:border-[#00845A]/30 hover:bg-[#00845A]/5 relative overflow-hidden shadow-sm"
            >
              {studentIdImage ? (
                <div className="relative w-full h-full p-2">
                   <img src={studentIdImage} alt="ID" className="w-full h-full object-cover rounded-2xl" />
                   <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <p className="text-white text-xs font-bold uppercase tracking-widest">Replace Document</p>
                   </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="p-4 bg-[#F0F7F4] rounded-full group-hover:bg-[#E0EFE8] transition-colors">
                    <Upload className="w-6 h-6 text-[#00845A]" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-gray-700">Scan or Upload Doc</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-tighter mt-0.5">High resolution is preferred</p>
                  </div>
                </div>
              )}
            </motion.div>
            <input type="file" ref={studentIdInputRef} onChange={handleStudentIdChange} className="hidden" accept="image/*" />
          </motion.div>

          {/* Action Button */}
          <motion.div variants={itemVariants} className="pt-4">
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isLoading}
              className="w-full bg-[#00845A] text-white py-4.5 rounded-[2rem] font-bold text-lg shadow-xl shadow-[#00845A]/20 hover:bg-[#00704d] active:shadow-md transition-all flex items-center justify-center relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              {isLoading ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm tracking-widest uppercase">Processing</span>
                </div>
              ) : (
                <span className="relative z-10">Create Profile</span>
              )}
            </motion.button>
            <p className="text-center mt-6 text-gray-400 text-xs font-medium tracking-tight">
               By joining, you agree to our <span className="text-[#00845A] border-b border-[#00845A]/30">Terms</span> and <span className="text-[#00845A] border-b border-[#00845A]/30">Privacy Ethos</span>.
            </p>
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
}

