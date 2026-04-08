import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, arrayUnion, arrayRemove, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Users, Heart, MessageCircle, Plus, X, Send, TrendingUp, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

const TABS = ['All Posts', 'Recommended', 'Study Groups'];
const TRENDING_TOPICS = ['#StudyTips', '#BookReviews', '#ExamPrep', '#SaveMoney', '#BookDonation'];

export default function CommunityHubScreen() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('All Posts');
  const [isComposing, setIsComposing] = useState(false);
  const [text, setText] = useState('');
  const [commentingOn, setCommentingOn] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'communityPosts'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const p = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPosts(p);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'communityPosts');
    });

    return () => unsubscribe();
  }, [user]);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !user) return;

    const postText = text.trim();
    setText('');
    setIsComposing(false);

    try {
      await addDoc(collection(db, 'communityPosts'), {
        authorId: user.uid,
        authorName: user.displayName || 'Anonymous',
        authorPhoto: user.photoURL || null,
        content: postText,
        likedBy: [],
        comments: [],
        createdAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'communityPosts');
    }
  };

  const handleLike = async (postId: string, isLiked: boolean) => {
    if (!user) return;
    try {
      const postRef = doc(db, 'communityPosts', postId);
      if (isLiked) {
        await updateDoc(postRef, {
          likedBy: arrayRemove(user.uid)
        });
      } else {
        await updateDoc(postRef, {
          likedBy: arrayUnion(user.uid)
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `communityPosts/${postId}`);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'communityPosts', postId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `communityPosts/${postId}`);
    }
  };

  const handleComment = async (e: React.FormEvent, postId: string) => {
    e.preventDefault();
    if (!commentText.trim() || !user) return;

    try {
      const postRef = doc(db, 'communityPosts', postId);
      await updateDoc(postRef, {
        comments: arrayUnion({
          id: Date.now().toString(),
          authorId: user.uid,
          authorName: user.displayName || 'Anonymous',
          content: commentText.trim(),
          createdAt: new Date().toISOString()
        })
      });
      setCommentText('');
      setCommentingOn(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `communityPosts/${postId}`);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F8FCF9] font-sans relative">
      {/* Header */}
      <div className="bg-white px-4 pt-6 pb-2 shadow-sm z-10 sticky top-0">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Book reading community</h2>
        <p className="text-xs text-gray-500 mb-4">Share experiences and seek understanding.</p>
        
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${
                activeTab === tab 
                  ? 'bg-[#006A4E] text-white border-[#006A4E]' 
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {/* Create Post Input Trigger */}
        <div 
          onClick={() => setIsComposing(true)}
          className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 cursor-text"
        >
          <p className="text-sm text-gray-400">Share your ideas with the community...</p>
        </div>

        {/* Trending Topics */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-[#E8F5F0]">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-red-500" />
            <h3 className="font-bold text-sm text-gray-900">Trending Topics</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {TRENDING_TOPICS.map(topic => (
              <span key={topic} className="text-[10px] font-medium text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full cursor-pointer hover:bg-gray-200">
                {topic}
              </span>
            ))}
          </div>
        </div>

        {/* Posts Feed */}
        {posts.filter(post => {
          if (activeTab === 'All Posts') return true;
          if (activeTab === 'Recommended') return post.likedBy?.length > 0;
          if (activeTab === 'Study Groups') return post.content.toLowerCase().includes('study');
          return true;
        }).map(post => {
          const isLiked = post.likedBy?.includes(user?.uid);
          const likesCount = post.likedBy?.length || 0;
          const commentsCount = post.comments?.length || 0;

          return (
            <div key={post.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center">
                    {post.authorPhoto ? (
                      <img src={post.authorPhoto} alt={post.authorName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <span className="text-[#006A4E] font-bold text-sm">{post.authorName.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{post.authorName}</p>
                    {post.createdAt && (
                      <p className="text-[10px] text-gray-400">{format(post.createdAt.toDate(), 'MMM d, h:mm a')}</p>
                    )}
                  </div>
                </div>
                {user?.uid === post.authorId && (
                  <button 
                    onClick={() => handleDelete(post.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-gray-700 text-sm mb-4 leading-relaxed">{post.content}</p>
              
              {/* Example Tags on Post (Mocked for UI) */}
              <div className="flex gap-2 mb-4">
                 <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded">#StudyTips</span>
              </div>

              <div className="flex items-center gap-6 text-gray-500 pt-3 border-t border-gray-50">
                <button 
                  onClick={() => handleLike(post.id, isLiked)}
                  className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${isLiked ? 'text-red-500' : 'hover:text-red-500'}`}
                >
                  <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                  <span>{likesCount}</span>
                </button>
                <button 
                  onClick={() => setCommentingOn(commentingOn === post.id ? null : post.id)}
                  className="flex items-center gap-1.5 text-xs font-medium hover:text-[#006A4E] transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{commentsCount}</span>
                </button>
              </div>

              {/* Comments Section */}
              {commentingOn === post.id && (
                <div className="mt-4 pt-4 border-t border-gray-50">
                  {post.comments?.map((comment: any) => (
                    <div key={comment.id} className="mb-3 last:mb-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-xs text-gray-900">{comment.authorName}</span>
                        <span className="text-[10px] text-gray-400">
                          {format(new Date(comment.createdAt), 'MMM d, h:mm a')}
                        </span>
                      </div>
                      <p className="text-xs text-gray-700">{comment.content}</p>
                    </div>
                  ))}
                  
                  <form onSubmit={(e) => handleComment(e, post.id)} className="mt-3 flex gap-2">
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Write a comment..."
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#006A4E]"
                    />
                    <button 
                      type="submit"
                      disabled={!commentText.trim()}
                      className="bg-[#006A4E] text-white p-2 rounded-full disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              )}
            </div>
          );
        })}
        
        {posts.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="font-medium text-sm">No posts yet. Be the first to share!</p>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-28 left-0 right-0 max-w-md mx-auto pointer-events-none z-20">
        <button 
          onClick={() => setIsComposing(true)}
          className="absolute right-4 w-14 h-14 bg-[#006A4E] text-white rounded-full flex items-center justify-center shadow-lg hover:bg-[#005C44] transition-colors pointer-events-auto"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Compose Modal */}
      {isComposing && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-white w-full sm:w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Create Post</h3>
              <button onClick={() => setIsComposing(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handlePost}>
              <textarea
                autoFocus
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Share your ideas with the community..."
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-4 focus:outline-none focus:ring-2 focus:ring-[#006A4E] resize-none h-32 text-sm"
              />
              <button 
                type="submit"
                disabled={!text.trim()}
                className="w-full bg-[#006A4E] text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 shadow-md"
              >
                <Send className="w-4 h-4" />
                Post
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
