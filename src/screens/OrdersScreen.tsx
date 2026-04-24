import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Package } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { fetchUserOrders, OrderRecord } from '../lib/orders';
import BooxieLogo from '../components/BooxieLogo';

function formatCreatedAt(value: any) {
  if (typeof value?.toDate === 'function') {
    return format(value.toDate(), 'MMM d, yyyy');
  }
  return 'Pending';
}

export default function OrdersScreen() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadOrders = async () => {
      if (!user?.uid) {
        if (active) {
          setOrders([]);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      try {
        const loadedOrders = await fetchUserOrders(user.uid);
        if (active) {
          setOrders(loadedOrders);
        }
      } catch (error) {
        console.error('Failed to load orders:', error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadOrders();
    return () => {
      active = false;
    };
  }, [user?.uid]);

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FCF9] font-sans">
      <header className="px-4 pt-6 pb-4 flex items-center justify-between bg-[#F8FCF9] z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/profile')} className="relative z-50 p-2 -ml-2 hover:bg-gray-200 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-gray-900" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-tight">My Orders</h1>
            <p className="text-xs text-gray-500">Track your recent purchases</p>
          </div>
        </div>
        <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-[#E8F5F0]">
          <BooxieLogo className="w-8 h-8" />
        </div>
      </header>

      <div className="flex-1 px-4 pb-8">
        {!user && (
          <div className="bg-white rounded-3xl p-8 text-center border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-500">Orders are only available for signed-in accounts.</p>
          </div>
        )}

        {user && loading && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-[#006A4E] border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {user && !loading && orders.length === 0 && (
          <div className="bg-white rounded-3xl p-8 text-center border border-gray-100 shadow-sm">
            <div className="w-14 h-14 bg-[#E8F5F0] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Package className="w-7 h-7 text-[#006A4E]" />
            </div>
            <p className="text-sm font-bold text-gray-900">{profile?.name || 'You'} have no orders yet.</p>
            <button onClick={() => navigate('/search')} className="mt-4 text-sm font-bold text-[#006A4E]">
              Browse books
            </button>
          </div>
        )}

        {user && !loading && orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((order) => {
              const firstItem = order.items[0];
              return (
                <div key={order.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm relative">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-sm font-bold text-gray-900">{order.orderId}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Placed on {formatCreatedAt(order.createdAt)}</p>
                    </div>
                    <span className="px-3 py-1 bg-[#006A4E] text-white text-[10px] font-bold rounded-full capitalize">
                      {order.status}
                    </span>
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
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-gray-900 line-clamp-2 leading-tight">{firstItem?.title || 'Order items'}</h4>
                      <p className="text-xs text-gray-500 mt-1">{order.items.length} item{order.items.length === 1 ? '' : 's'}</p>
                      <p className="text-base font-bold text-[#006A4E] mt-2">${order.total.toFixed(2)}</p>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
