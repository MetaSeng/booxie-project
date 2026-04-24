import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, where, doc, getDoc, setDoc, deleteDoc, orderBy, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { BookOpen, Search, Heart, Star, ChevronRight, MessageCircle, Loader2, Filter, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

interface BookListing {
  id: string;
  title: string;
  author: string;
  price: number;
  imageUrl?: string;
  condition: string;
  type: string;
  sellerName: string;
  sellerId: string;
  status?: 'available' | 'sold';
  createdAt?: any;
}

const CATEGORIES = [
  { id: 'All', label: 'All', icon: 'https://cdn-icons-png.flaticon.com/512/1048/1048927.png' },
  { id: 'Textbook', label: 'Textbooks', icon: 'https://lh3.googleusercontent.com/d/1gBac4HB_fvzjXfK9d7hW0baFjuqbSz9u' },
  { id: 'English', label: 'English', icon: 'https://lh3.googleusercontent.com/d/1AmUQyGxG0RePF4kwfeqvPJOt2EOeFi5S' },
  { id: 'Science', label: 'Science', icon: 'https://lh3.googleusercontent.com/d/1J4KjM6YwRr0RDuazZ6Qyirp37ZQ9hVIl' },
  { id: 'Novels', label: 'Novels', icon: 'https://lh3.googleusercontent.com/d/1bPAh10cr4W4jNkilGR_yKNCnFuifT_4B' },
  { id: 'Grade 12', label: 'Grade 12', icon: 'https://lh3.googleusercontent.com/d/18Aj2zUXaHnZeWcZomnLlWqSo_wq3GslT' },
];

export default function HomeScreen() {
  const [books, setBooks] = useState<BookListing[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedGenre, setSelectedGenre] = useState('All');
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      // Fetch favorites
      const fetchFavorites = async () => {
        try {
          const favRef = doc(db, 'users', user.uid);
          const favSnap = await getDoc(favRef);
          if (favSnap.exists() && favSnap.data().favorites) {
            setFavorites(favSnap.data().favorites);
          }
        } catch (error) {
          console.error("Error fetching favorites:", error);
        }
      };
      fetchFavorites();
    }

    let q = query(
      collection(db, 'books'),
      ...(selectedGenre !== 'All' ? [where('category', '==', selectedGenre)] : []),
      orderBy('createdAt', 'desc'),
      limit(6)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const booksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as BookListing[];
      
      setBooks(booksData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'books');
    });

    return () => unsubscribe();
  }, [user, selectedGenre]);

  const toggleFavorite = async (e: React.MouseEvent, bookId: string) => {
    e.stopPropagation();
    if (!user) return;

    const newFavorites = favorites.includes(bookId)
      ? favorites.filter(id => id !== bookId)
      : [...favorites, bookId];

    setFavorites(newFavorites);

    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { favorites: newFavorites }, { merge: true });
    } catch (error) {
      console.error("Error updating favorites:", error);
      // Revert on error
      setFavorites(favorites);
    }
  };

  return (
    <div className="p-4 font-sans bg-[#F8FCF9] min-h-full pb-24 relative">
      {/* Hero Section */}
      <div className="text-center mb-6 mt-2">
        <h2 className="text-lg font-bold text-[#006A4E] mb-1">Buy, sell and donate books</h2>
        <p className="text-xs text-gray-500 px-4 leading-relaxed">
          Cambodia's first platform for sustainable learning.<br/>
          Save money, reduce waste, and support students
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative mb-8">
        <div className="flex items-center border border-[#006A4E] rounded-full bg-white overflow-hidden p-1 pl-4 shadow-sm">
          <Search className="w-5 h-5 text-gray-400 shrink-0" />
          <input 
            type="text" 
            placeholder="Search for textbooks..." 
            className="flex-1 bg-transparent border-none outline-none px-2 text-sm text-gray-700 placeholder-gray-400 min-w-0"
            onClick={() => navigate('/search')}
          />
          <button className="bg-[#006A4E] text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-[#005C44] transition-colors shrink-0">
            Search
          </button>
        </div>
      </div>

      {/* Book Categories Filter */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-900">Top Categories</h3>
          <button onClick={() => navigate('/search')} className="text-[#006A4E] text-sm font-medium">View all</button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 scroll-smooth">
          {CATEGORIES.map(cat => (
            <div 
              key={cat.id} 
              onClick={() => setSelectedGenre(cat.id)}
              className="flex flex-col items-center gap-2 min-w-[72px] cursor-pointer shrink-0 transition-transform active:scale-95"
            >
              <div className={`w-16 h-16 rounded-full border flex items-center justify-center overflow-hidden shadow-sm transition-all p-2 ${
                selectedGenre === cat.id ? 'border-booxie-green bg-booxie-green/5 ring-4 ring-booxie-green/10' : 'border-gray-200 bg-white hover:border-[#006A4E]'
              }`}>
                <img src={cat.icon} alt={cat.label} className="w-full h-full object-contain" />
              </div>
              <span className={`text-[11px] text-center leading-tight font-medium ${
                selectedGenre === cat.id ? 'text-booxie-green font-bold' : 'text-gray-700'
              }`}>{cat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Best-selling books */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-900">
            {selectedGenre === 'All' ? 'Best-selling books' : `${selectedGenre} Picks`}
          </h3>
          {books.length > 0 && (
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-100 px-2 py-0.5 rounded">
              {books.length} RESULTS
            </span>
          )}
        </div>
        
        {books.length === 0 && selectedGenre !== 'All' ? (
          <div className="bg-white rounded-3xl p-8 border border-dashed border-gray-200 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mb-3">
              <Filter className="w-6 h-6 text-gray-300" />
            </div>
            <h4 className="text-sm font-bold text-gray-800">No books found</h4>
            <p className="text-xs text-gray-500 mt-1 max-w-[200px]">We couldn't find any books in {selectedGenre} right now.</p>
            <button 
              onClick={() => setSelectedGenre('All')}
              className="mt-4 text-booxie-green text-xs font-bold underline"
            >
              Show all books
            </button>
          </div>
        ) : books.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-dashed border-gray-200 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-[#E8F5F0] rounded-2xl flex items-center justify-center mb-3">
              <BookOpen className="w-6 h-6 text-[#006A4E]" />
            </div>
            <h4 className="text-sm font-bold text-gray-800">No books listed yet</h4>
            <p className="text-xs text-gray-500 mt-1 max-w-[240px]">Seller-created books will appear here as soon as someone lists their first book.</p>
            <button
              onClick={() => navigate('/sell/details', { state: { manualEntry: true, scannedData: { type: 'sale', condition: 'Good', price: '', title: '', author: '', description: '' } } })}
              className="mt-4 text-booxie-green text-xs font-bold underline"
            >
              Add the first listing
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <AnimatePresence>
              {books.map((book, idx) => (
                <motion.div 
                  key={book.id} 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => navigate(`/book/${book.id}`)}
                  className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow flex flex-col relative"
                >
                  <button 
                    onClick={(e) => toggleFavorite(e, book.id)}
                    className="absolute top-4 right-4 z-10 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm"
                  >
                    <Heart className={`w-4 h-4 ${favorites.includes(book.id) ? 'text-red-500 fill-red-500' : 'text-gray-400'}`} />
                  </button>
                  
                  <div className="aspect-[3/4] w-full bg-gray-50 rounded-xl mb-3 overflow-hidden shrink-0">
                    {book.imageUrl ? (
                      <img src={book.imageUrl} alt={book.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-8 h-8 text-gray-300" />
                      </div>
                    )}
                    {book.status === 'sold' && (
                      <div className="absolute left-5 top-5 rounded-full bg-gray-900/85 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                        Sold
                      </div>
                    )}
                  </div>
                  
                  <h4 className="font-medium text-gray-900 text-sm line-clamp-2 mb-1 leading-tight h-10">{book.title}</h4>
                  <p className="text-[10px] text-gray-400 mb-2 line-clamp-1 italic">{book.author}</p>
                  
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-booxie-green font-bold bg-booxie-green/5 px-1.5 py-0.5 rounded capitalize">
                      {book.condition}
                    </span>
                    <div className="flex items-center gap-0.5">
                      <Star className="w-2.5 h-2.5 text-[#FFB800] fill-[#FFB800]" />
                      <span className="text-[10px] text-gray-500 font-bold ml-0.5">5.0</span>
                    </div>
                  </div>
                  
                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="font-bold text-[#006A4E] text-sm leading-tight">
                        ${book.price}
                      </span>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (book.status === 'sold') return;
                        addToCart({ ...book, originalPrice: book.price * 1.5 });
                        navigate('/cart');
                      }}
                      disabled={book.status === 'sold'}
                      className="bg-[#006A4E] text-white text-[10px] font-bold p-2 px-3 rounded-xl hover:bg-[#005C44] transition-colors shadow-sm disabled:cursor-not-allowed disabled:bg-gray-300"
                    >
                      {book.status === 'sold' ? 'Sold' : 'Buy'}
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Donation Books Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-900">Donation books</h3>
          <button onClick={() => navigate('/donations')} className="text-[#006A4E] text-sm font-medium">View all</button>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#E8F5F0] flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/donations')}>
          <div className="w-16 h-16 bg-[#006A4E] rounded-xl flex items-center justify-center shrink-0">
            <Heart className="w-8 h-8 text-white fill-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-gray-900 text-sm">Free Books for Students</h4>
            <p className="text-xs text-gray-500 mt-1">Browse books donated by the community to support your studies.</p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>
      </div>

      {/* News & Promotions */}
      <div className="mb-8">
        <h3 className="font-bold text-gray-900 mb-4">News & Promotions</h3>
        <div 
          onClick={() => navigate('/search')}
          className="w-full bg-[#E8F5F0] rounded-2xl overflow-hidden relative flex items-center justify-center cursor-pointer hover:shadow-md transition-shadow"
        >
          <img src="https://lh3.googleusercontent.com/d/1z5VOQKth40YJQBb_GYVceG3mIt034e31" alt="High School Awards 2026" className="w-full h-auto object-contain" referrerPolicy="no-referrer" />
          {/* Pagination dots */}
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
            <div className="w-4 h-1.5 bg-white rounded-full"></div>
            <div className="w-1.5 h-1.5 bg-white/50 rounded-full"></div>
            <div className="w-1.5 h-1.5 bg-white/50 rounded-full"></div>
            <div className="w-1.5 h-1.5 bg-white/50 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Floating Chat Button */}
      <div className="fixed bottom-28 left-0 right-0 max-w-md mx-auto pointer-events-none z-30">
        <button 
          onClick={() => navigate('/gemini')}
          className="absolute right-4 w-14 h-14 bg-[#006A4E] rounded-full shadow-lg flex items-center justify-center text-white hover:bg-[#005C44] transition-colors pointer-events-auto"
        >
          <MessageCircle className="w-6 h-6" />
          <span className="absolute top-3 right-3 w-3 h-3 bg-red-500 rounded-full border-2 border-[#006A4E]"></span>
        </button>
      </div>
    </div>
  );
}
