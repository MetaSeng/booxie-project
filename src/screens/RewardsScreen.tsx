import React, { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Award, Gift, Star, BookHeart, Trophy, ChevronRight, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function RewardsScreen() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (doc) => {
      if (doc.exists()) {
        setUserData(doc.data());
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <div className="flex flex-col h-full bg-[#F8FCF9] font-sans pb-24">
      <header className="px-4 pt-6 pb-4 bg-white shadow-sm z-10 sticky top-0 flex items-center gap-3">
        <button onClick={() => navigate('/profile')} className="relative z-50 p-2 -ml-2 rounded-full hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5 text-gray-800" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Rewards & Points</h1>
      </header>

      <div className="p-4 overflow-y-auto">
        {/* Points Display */}
        <div className="bg-gradient-to-br from-[#006A4E] to-[#004D38] rounded-3xl p-6 text-white shadow-xl shadow-[#006A4E]/20 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-yellow-400 opacity-20 rounded-full blur-2xl"></div>
          
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-4 shadow-inner border border-white/30">
              <Star className="w-8 h-8 text-yellow-400 fill-yellow-400" />
            </div>
            <p className="text-white/80 font-medium mb-1 text-sm">Total Saving Points</p>
            <h3 className="text-5xl font-black mb-6 tracking-tight">{userData?.rewardPoints || 1250}</h3>
            
            <div className="w-full bg-black/20 rounded-2xl p-4 backdrop-blur-sm border border-white/10">
              <div className="flex justify-between text-xs font-medium mb-2">
                <span className="text-yellow-400">Gold Member</span>
                <span className="text-white/80">1250 / 2000 pts</span>
              </div>
              <div className="w-full h-2 bg-black/30 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-400 w-[62.5%] rounded-full shadow-[0_0_10px_rgba(250,204,21,0.5)]"></div>
              </div>
              <p className="text-[10px] text-white/60 mt-2 text-left">Earn 750 more points to reach Platinum</p>
            </div>
          </div>
        </div>

        {/* Badges / Leaderboard Teaser */}
        <div 
          onClick={() => navigate('/leaderboard')}
          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-50 rounded-full flex items-center justify-center">
              <Trophy className="w-6 h-6 text-yellow-500" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Leaderboard Ranking</h3>
              <p className="text-xs text-gray-500">You are in top 15% this month</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>

        {/* How to earn */}
        <div className="flex items-center justify-between mb-4 px-1">
          <h3 className="font-bold text-gray-900">How to earn points</h3>
          <span onClick={() => navigate('/earn-points')} className="text-xs font-bold text-[#006A4E] cursor-pointer hover:underline">View All</span>
        </div>
        
        <div className="space-y-3">
          <RewardCard 
            icon={<BookHeart className="w-5 h-5 text-[#006A4E]" />}
            title="Donate a Book"
            desc="Help a student in need"
            points="+20 pts"
            color="bg-[#E8F5F0]"
          />
          <RewardCard 
            icon={<Award className="w-5 h-5 text-blue-500" />}
            title="Sell a Book"
            desc="Give your book a second life"
            points="+10 pts"
            color="bg-blue-50"
          />
          <RewardCard 
            icon={<Gift className="w-5 h-5 text-purple-500" />}
            title="Buy a Book"
            desc="Purchase any book on Booxie"
            points="+5 pts"
            color="bg-purple-50"
          />
        </div>
      </div>
    </div>
  );
}

function RewardCard({ icon, title, desc, points, color }: { icon: React.ReactNode, title: string, desc: string, points: string, color: string }) {
  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:bg-gray-50 transition-colors cursor-pointer">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${color}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-gray-900 text-sm truncate">{title}</h4>
        <p className="text-[10px] text-gray-500 truncate">{desc}</p>
      </div>
      <div className="font-black text-yellow-500 bg-yellow-50 px-3 py-1.5 rounded-full text-xs shrink-0 border border-yellow-100">
        {points}
      </div>
    </div>
  );
}
