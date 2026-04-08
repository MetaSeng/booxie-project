import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, ArrowLeft, Search, MoreVertical } from 'lucide-react';
import { format } from 'date-fns';

interface Conversation {
  id: string;
  bookTitle?: string;
  lastMessage?: string;
  updatedAt?: any;
  participants: string[];
}

export default function ChatListScreen() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const convs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Conversation[];
      
      convs.sort((a, b) => {
        const timeA = a.updatedAt?.toMillis?.() || 0;
        const timeB = b.updatedAt?.toMillis?.() || 0;
        return timeB - timeA;
      });
      
      setConversations(convs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'conversations');
    });

    return () => unsubscribe();
  }, [user]);

  const filteredConversations = conversations.filter(conv => 
    conv.bookTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-[#F8FCF9] font-sans">
      <header className="px-4 pt-6 pb-4 bg-white shadow-sm z-10 sticky top-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="relative z-50 p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
              <ArrowLeft className="w-6 h-6 text-gray-800" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Messages</h1>
          </div>
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#006A4E] focus:border-[#006A4E] sm:text-sm transition-colors"
          />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* AI Help Chat (Static) */}
        <div 
          onClick={() => navigate('/gemini')}
          className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4 items-center cursor-pointer hover:bg-gray-50 transition-colors"
        >
          <div className="w-12 h-12 bg-[#006A4E] rounded-full flex items-center justify-center flex-shrink-0 relative">
            <span className="text-white font-bold text-xl">🤖</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-baseline mb-1">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-900 text-sm truncate">Booxie AI Help</h3>
                <span className="text-[10px] text-[#006A4E] bg-[#E8F5F0] px-1.5 py-0.5 rounded font-bold">AI</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 truncate">Hi! I'm Booxie's AI assistant. How can I help you today?</p>
          </div>
        </div>

        {filteredConversations.map(conv => (
          <div 
            key={conv.id}
            onClick={() => navigate(`/chat/${conv.id}`)}
            className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4 items-center cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <div className="w-12 h-12 bg-[#E8F5F0] rounded-full flex items-center justify-center flex-shrink-0 relative">
              <MessageCircle className="w-6 h-6 text-[#006A4E]" />
              {/* Unread indicator mock */}
              <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-white rounded-full"></div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline mb-1">
                <h3 className="font-bold text-gray-900 text-sm truncate pr-2">{conv.bookTitle || 'Unknown Book'}</h3>
                {conv.updatedAt && (
                  <span className="text-[10px] font-medium text-gray-400 whitespace-nowrap shrink-0">
                    {format(conv.updatedAt.toDate(), 'h:mm a')}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 truncate">{conv.lastMessage || 'Start a conversation'}</p>
            </div>
          </div>
        ))}

        {filteredConversations.length === 0 && (
          <div className="text-center py-20 px-6 flex flex-col items-center justify-center h-full">
            <div className="w-24 h-24 bg-[#E8F5F0] rounded-full flex items-center justify-center mb-6">
              <MessageCircle className="w-10 h-10 text-[#006A4E]" />
            </div>
            <p className="font-medium text-gray-900 text-lg mb-2">No messages yet</p>
            <p className="text-sm text-gray-500 text-center">Start chatting by contacting a seller.</p>
          </div>
        )}
      </div>
    </div>
  );
}
