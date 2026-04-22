import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, where, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Heart, ArrowLeft, Star, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BooxieLogo from '../components/BooxieLogo';

interface BookListing {
  id: string;
  title: string;
  author: string;
  price: number;
  imageUrl?: string;
  condition: string;
  type: string;
  sellerName: string;
  rating?: number;
}

export default function DonationScreen() {
  const [results, setResults] = useState<BookListing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDonations = async () => {
      setIsLoading(true);
      try {
        const q = query(
          collection(db, 'books'), 
          where('status', '==', 'available'),
          where('type', '==', 'donation'),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const booksData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as BookListing[];
        setResults(booksData);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'books');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDonations();
  }, []);

  return (
    <div className="flex flex-col h-full bg-[#F8FCF9] font-sans">
      {/* Header */}
      <div className="px-4 py-4 flex items-center justify-between bg-[#F8FCF9] z-10">
        <button onClick={() => navigate(-1)} className="relative z-50 p-2 -ml-2 text-gray-800">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex flex-col items-center">
          <h1 className="text-xl font-bold text-gray-900">Donation Books</h1>
          <span className="text-xs text-gray-500">Free books shared by the community.</span>
        </div>
        <div className="w-12 h-12 flex items-center justify-center overflow-hidden">
          <BooxieLogo className="w-12 h-12" />
        </div>
      </div>

      {/* Hero Section */}
      <div className="px-4 py-6">
        <div className="bg-[#E8F5F0] rounded-3xl p-6 flex items-center gap-4 border border-[#006A4E]/10">
          <div className="w-16 h-16 bg-[#006A4E] rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-[#006A4E]/20">
            <Heart className="w-8 h-8 text-white fill-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 leading-tight">Support Sustainable Learning</h2>
            <p className="text-xs text-gray-600 mt-1">Request a free book or donate yours to help others.</p>
          </div>
        </div>
      </div>

      {/* Book Grid */}
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-[#006A4E] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {results.map((book) => (
              <div 
                key={book.id}
                onClick={() => navigate(`/book/${book.id}`)}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col cursor-pointer hover:shadow-md transition-shadow"
              >
                {/* Image Container */}
                <div className="relative aspect-[3/4] bg-gray-100 shrink-0">
                  {book.imageUrl ? (
                    <img src={book.imageUrl} alt={book.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <BookOpen className="text-gray-400 w-8 h-8" />
                    </div>
                  )}
                  <div className="absolute top-2 left-2 bg-[#006A4E] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                    FREE
                  </div>
                </div>
                
                {/* Content */}
                <div className="p-3 flex flex-col flex-1">
                  <h4 className="font-bold text-gray-900 text-sm line-clamp-1 mb-2">{book.title}</h4>
                  
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-medium text-gray-600 bg-white border border-gray-200 px-2 py-0.5 rounded-md">
                      {book.condition}
                    </span>
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-2.5 h-2.5 text-[#FFB800] fill-[#FFB800]" />
                      ))}
                    </div>
                  </div>
                  
                  <div className="mt-auto">
                    <p className="text-[10px] text-gray-500 mb-2">Shared by {book.sellerName}</p>
                    <button 
                      className="w-full bg-[#006A4E] text-white text-xs font-medium py-2 rounded-lg hover:bg-[#00523B] transition-colors"
                    >
                      Request Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-10 h-10 text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium">No donation books available right now.</p>
            <button 
              onClick={() => navigate('/sell')}
              className="mt-4 text-[#006A4E] font-bold text-sm"
            >
              Be the first to donate!
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
