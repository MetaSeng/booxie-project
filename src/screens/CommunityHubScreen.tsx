import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, arrayUnion, arrayRemove, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Users, Heart, MessageCircle, Plus, X, Send, TrendingUp, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

const TABS = ['All Posts', 'Recommended', 'Study Groups'];

export default function CommunityHubScreen() {
  const { user, profile } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('All Posts');
  const [isComposing, setIsComposing] = useState(false);
  const [text, setText] = useState('');
  const [commentingOn, setCommentingOn] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [selectedHashtag, setSelectedHashtag] = useState<string | null>(null);

  const samplePosts = [
    {
      id: 'sample-1',
      authorName: 'Alex Reader',
      authorPhoto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
      content: 'Just finished reading "Khmer Literature" and it was fascinating! Does anyone have recommendations for similar classic literature?',
      likedBy: ['user1', 'user2'],
      comments: [
        { id: 'c1', authorName: 'Sokha', content: 'You should try reading the Sastra series!', createdAt: new Date().toISOString() }
      ],
      createdAt: { toDate: () => new Date(Date.now() - 3600000) }
    },
    {
      id: 'sample-2',
      authorName: 'Bookworm_KH',
      authorPhoto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bookworm',
      content: 'Giving away my Grade 12 Math books for free. They are in great condition. Pick up near Royal University of Phnom Penh.',
      likedBy: ['user3', 'user4', 'user5'],
      comments: [],
      createdAt: { toDate: () => new Date(Date.now() - 7200000) }
    }
  ];

  useEffect(() => {
    // guests can see posts, but they might not be able to interact with them fully without an auth account
    const q = query(
      collection(db, 'communityPosts'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const p = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // If database is empty, show sample posts for the demo
      if (p.length === 0) {
        setPosts(samplePosts);
      } else {
        setPosts(p);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'communityPosts');
    });

    return () => unsubscribe();
  }, [user]);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    // Allow posting if there is a firebase user OR a guest profile
    if (!user && !profile?.uid) return;

    const postText = text.trim();
    
    // Extract hashtags
    const hashtags = postText.match(/#\w+/g) || [];
    const uniqueHashtags = Array.from(new Set(hashtags.map(tag => tag.toLowerCase())));

    setText('');
    setIsComposing(false);

    try {
      await addDoc(collection(db, 'communityPosts'), {
        authorId: user?.uid || profile?.uid || 'guest-demo-id',
        authorName: user?.displayName || profile?.name || 'Alex (Guest)',
        authorPhoto: user?.photoURL || profile?.photoURL || null,
        content: postText,
        hashtags: uniqueHashtags,
        likedBy: [],
        comments: [],
        createdAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'communityPosts');
    }
  };

  const handleLike = async (postId: string, isLiked: boolean) => {
    const currentUid = user?.uid || profile?.uid;
    if (!currentUid) return;
    
    try {
      const postRef = doc(db, 'communityPosts', postId);
      if (isLiked) {
        await updateDoc(postRef, {
          likedBy: arrayRemove(currentUid)
        });
      } else {
        await updateDoc(postRef, {
          likedBy: arrayUnion(currentUid)
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `communityPosts/${postId}`);
    }
  };

  const handleDelete = async (postId: string) => {
    // allow delete if user is owner (real account or guest)
    if (!user && !profile?.uid) return;
    try {
      await deleteDoc(doc(db, 'communityPosts', postId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `communityPosts/${postId}`);
    }
  };

  const handleComment = async (e: React.FormEvent, postId: string) => {
    e.preventDefault();
    const currentUid = user?.uid || profile?.uid;
    if (!commentText.trim() || !currentUid) return;

    try {
      const postRef = doc(db, 'communityPosts', postId);
      await updateDoc(postRef, {
        comments: arrayUnion({
          id: Date.now().toString(),
          authorId: currentUid,
          authorName: user?.displayName || profile?.name || 'Anonymous',
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

  // Calculate trending topics accurately based on frequency in available posts
  const getTrendingTopics = () => {
    const counts: Record<string, number> = {};
    posts.forEach(post => {
      const tags = post.hashtags || [];
      tags.forEach((tag: string) => {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    });
    
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(entry => entry[0]);
  };

  const trendingTopics = getTrendingTopics();
  const currentTrending = trendingTopics.length > 0 ? trendingTopics : ['#StudyTips', '#BookReviews', '#ExamPrep'];

  const filteredPosts = posts.filter(post => {
    // If a hashtag is selected from trending, filter by it
    if (selectedHashtag) {
      return post.hashtags?.includes(selectedHashtag.toLowerCase());
    }
    
    // Otherwise rely on tabs
    if (activeTab === 'All Posts') return true;
    if (activeTab === 'Recommended') return post.likedBy?.length > 0;
    if (activeTab === 'Study Groups') return post.content.toLowerCase().includes('study') || post.hashtags?.includes('#study');
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-[#F8FCF9] font-sans relative">
      {/* Header */}
      <div className="bg-white px-4 pt-6 pb-2 shadow-sm z-10 sticky top-0">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xl font-bold text-gray-900">Book reading community</h2>
          {selectedHashtag && (
            <button 
              onClick={() => setSelectedHashtag(null)}
              className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full flex items-center gap-1 font-medium"
            >
              Clear filter <X className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
        <p className="text-xs text-gray-500 mb-4">Share experiences and seek understanding.</p>
        
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setSelectedHashtag(null);
              }}
              className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${
                activeTab === tab && !selectedHashtag
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
        {/* Trending Topics */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-[#E8F5F0]">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-red-500" />
            <h3 className="font-bold text-sm text-gray-900">Trending Topics</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {currentTrending.map(topic => (
              <span 
                key={topic} 
                onClick={() => setSelectedHashtag(topic === selectedHashtag ? null : topic)}
                className={`text-[10px] font-medium px-2.5 py-1 rounded-full cursor-pointer transition-colors ${
                  selectedHashtag === topic 
                    ? 'bg-[#006A4E] text-white' 
                    : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {topic}
              </span>
            ))}
          </div>
        </div>

        {/* Posts Feed */}
        {filteredPosts.map(post => {
          const currentUid = user?.uid || profile?.uid;
          const isLiked = post.likedBy?.includes(currentUid);
          const likesCount = post.likedBy?.length || 0;
          const commentsCount = post.comments?.length || 0;
          const isOwner = currentUid === post.authorId;

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
                {isOwner && (
                  <button 
                    onClick={() => handleDelete(post.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-gray-700 text-sm mb-4 leading-relaxed">{post.content}</p>
              
              {/* Dynamic Hashtags on Post */}
              {post.hashtags && post.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.hashtags.map((tag: string) => (
                    <span 
                      key={tag} 
                      onClick={() => setSelectedHashtag(tag)}
                      className="text-[10px] text-[#006A4E] bg-[#E8F5F0] px-2 py-0.5 rounded cursor-pointer hover:bg-[#D1EBE0]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

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
      <div className="fixed bottom-28 left-0 right-0 md:max-w-md md:mx-auto pointer-events-none z-20 w-full">
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
                placeholder="Write something to the community..."
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
