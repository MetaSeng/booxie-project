import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logOut } from '../firebase';
import { Settings, LogOut, Package, Heart, Star, Award, MessageCircle } from 'lucide-react';
import { fetchUserOrders, OrderRecord } from '../lib/orders';

const ORDER_TABS = ['Orders', 'Listing', 'Coupon'];

export default function ProfileScreen() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Orders');
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadOrders = async () => {
      if (!user?.uid) {
        if (active) {
          setOrders([]);
          setOrdersLoading(false);
        }
        return;
      }

      setOrdersLoading(true);
      try {
        const loadedOrders = await fetchUserOrders(user.uid);
        if (active) {
          setOrders(loadedOrders);
        }
      } catch (error) {
        console.error("Failed to load orders", error);
      } finally {
        if (active) {
          setOrdersLoading(false);
        }
      }
    };

    void loadOrders();
    return () => {
      active = false;
    };
  }, [user?.uid]);

  const handleLogout = async () => {
    try {
      await logOut();
      localStorage.removeItem('guestMode');
      navigate('/welcome');
    } catch (error) {
      console.error("Logout failed", error);
      // Even if firebase logout fails, clear local state and go to welcome
      localStorage.removeItem('guestMode');
      navigate('/welcome');
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F8FCF9] font-sans">
      {/* Header */}
      <div className="px-4 pt-2 pb-4 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your account</p>
        </div>
        <button 
          onClick={() => navigate('/settings')}
          className="p-2 text-gray-500 hover:bg-gray-200 rounded-full transition-colors"
        >
          <Settings className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-4 pb-24">
        {/* Main Profile Card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          {/* User Info */}
          <div className="flex items-center gap-4 mb-4">
            <button 
              onClick={() => navigate('/edit-profile')}
              className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#006A4E] shrink-0"
            >
              {profile?.photoURL || user?.photoURL ? (
                <img src={profile?.photoURL || user?.photoURL || ''} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full bg-[#006A4E] flex items-center justify-center text-white text-2xl font-bold">
                  {profile?.name ? profile.name.charAt(0).toUpperCase() : (user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'G')}
                </div>
              )}
            </button>
            <div>
              <h2 className="text-base font-bold text-gray-900">{profile?.name || user?.displayName || 'Guest User'}</h2>
              <p className="text-xs text-gray-500">{profile?.email || user?.email || 'Guest Account'}</p>
              {profile?.phone && <p className="text-xs text-gray-500 mb-2">{profile.phone}</p>}
              <button 
                onClick={() => navigate('/membership')}
                className="px-3 py-1 bg-[#006A4E] text-white text-[10px] font-bold rounded-md"
              >
                Membership
              </button>
            </div>
          </div>

          <div className="w-full h-px bg-gray-200 mb-4"></div>

          {/* Admin Access Button (Only visible to admins) */}
          {(profile?.role === 'admin' || user?.email === 'sh6025010078@camtech.edu.kh') && (
            <button
              onClick={() => navigate('/admin')}
              className="w-full flex items-center justify-between p-3 mb-4 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <Settings className="w-4 h-4 text-gray-600" />
                </div>
                <span className="text-sm font-bold text-gray-900">Admin Dashboard</span>
              </div>
              <span className="text-xs text-gray-500">Manage Platform</span>
            </button>
          )}

          {/* Saving Points Card */}
          <div className="border border-[#006A4E] rounded-xl p-4">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#006A4E] rounded-full flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-900">Saving Points</h3>
                  <p className="text-[10px] text-gray-500">Use for discount when purchasing</p>
                </div>
              </div>
              <span className="text-[10px] text-gray-500 whitespace-nowrap ml-2">{profile?.rewardPoints || 0} Points</span>
            </div>

            <div className="mb-4">
              <div className="flex justify-between text-[10px] text-gray-900 mb-1">
                <span>{profile?.rewardPoints >= 1500 ? 'Platinum level' : profile?.rewardPoints >= 1000 ? 'Gold level' : 'Silver level'}</span>
                <span>{profile?.rewardPoints || 0}/2000</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#006A4E] transition-all duration-500 rounded-full" 
                  style={{ width: `${Math.min(((profile?.rewardPoints || 0) / 2000) * 100, 100)}%` }}
                ></div>
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <div className="text-center flex-1">
                <p className="font-bold text-gray-900 text-sm">{profile?.purchasedCount || 0}</p>
                <p className="text-[10px] text-gray-900">Purchased</p>
              </div>
              <div className="text-center flex-1">
                <p className="font-bold text-gray-900 text-sm">{profile?.soldCount || 0}</p>
                <p className="text-[10px] text-gray-900">Sold</p>
              </div>
              <div className="text-center flex-1">
                <p className="font-bold text-gray-900 text-sm">{profile?.donatedCount || 0}</p>
                <p className="text-[10px] text-gray-900">Donate</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-3 gap-3">
          <button 
            onClick={() => navigate('/orders')}
            className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
          >
            <Package className="w-6 h-6 text-gray-900" />
            <span className="text-xs font-bold text-gray-900">My Order</span>
            <span className="text-[10px] text-gray-400">{orders.length} Total</span>
          </button>
          <button 
            onClick={() => navigate('/donations')}
            className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
          >
            <Heart className="w-6 h-6 text-gray-900" />
            <span className="text-xs font-bold text-gray-900">Donation</span>
            <span className="text-[10px] text-gray-400">8 Books</span>
          </button>
          <button 
            onClick={() => navigate('/favorites')}
            className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
          >
            <Star className="w-6 h-6 text-gray-900" />
            <span className="text-xs font-bold text-gray-900">Favorite</span>
            <span className="text-[10px] text-gray-400">12 Items</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-gray-200/60 p-1 rounded-full flex">
          {ORDER_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-sm font-bold rounded-full transition-colors ${
                activeTab === tab 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'Orders' && (
            <div className="space-y-4">
              {ordersLoading && (
                <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm text-center text-sm text-gray-500">
                  Loading orders...
                </div>
              )}
              {!ordersLoading && orders.length === 0 && (
                <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm text-center text-sm text-gray-500">
                  No orders yet.
                </div>
              )}
              {!ordersLoading && orders.map((order) => {
                const firstItem = order.items[0];
                return (
                  <div key={order.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm relative">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-sm font-bold text-gray-900">{order.orderId}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{order.items.length} item{order.items.length === 1 ? '' : 's'}</p>
                      </div>
                      <span className="px-3 py-1 bg-[#006A4E] text-white text-[10px] font-bold rounded-full capitalize">{order.status}</span>
                    </div>
                    
                    <button 
                      onClick={() => navigate(`/order/${order.id}`)}
                      className="flex gap-4 items-center mt-4 text-left w-full"
                    >
                      <div className="w-16 h-24 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                        {firstItem?.image ? (
                          <img src={firstItem.image} alt={firstItem.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-[#E8F5F0]"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-gray-900 line-clamp-2 leading-tight">{firstItem?.title || 'Order items'}</h4>
                        <p className="text-xs text-gray-500 mt-1">Status: {order.status}</p>
                        <p className="text-base font-bold text-[#006A4E] mt-2">${order.total.toFixed(2)}</p>
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          {activeTab === 'Listing' && (
            <div className="text-center py-8 text-gray-400">
              <p className="text-sm">No active listings.</p>
            </div>
          )}
          {activeTab === 'Coupon' && (
            <div className="text-center py-8 text-gray-400">
              <p className="text-sm">No coupons available.</p>
            </div>
          )}
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 p-4 bg-white rounded-2xl shadow-sm border border-gray-100 text-red-500 font-bold hover:bg-red-50 transition-colors mt-6"
        >
          <LogOut className="w-5 h-5" />
          Log Out
        </button>
      </div>

      {/* Floating Chat Button */}
      <div className="fixed bottom-28 left-0 right-0 md:max-w-md md:mx-auto pointer-events-none z-30 w-full">
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
