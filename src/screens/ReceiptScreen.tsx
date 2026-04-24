import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, Download, Home, Share2 } from 'lucide-react';
import { format } from 'date-fns';
import BooxieLogo from '../components/BooxieLogo';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { fetchOrderById, OrderRecord } from '../lib/orders';

function formatOrderDate(value: any) {
  if (!value) return 'Pending';
  if (typeof value?.toDate === 'function') {
    return format(value.toDate(), 'MMMM d, yyyy h:mm a');
  }
  if (typeof value === 'string') {
    return value;
  }
  return 'Pending';
}

export default function ReceiptScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const receiptRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState('');
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const routeOrderId = params.id;
  const stateOrderId = location.state?.orderId;
  const orderDocId = routeOrderId || stateOrderId;

  useEffect(() => {
    let active = true;

    const loadOrder = async () => {
      if (!orderDocId) {
        setOrder(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const loadedOrder = await fetchOrderById(orderDocId);
        if (active) {
          setOrder(loadedOrder);
        }
      } catch (error) {
        console.error('Failed to load order:', error);
        if (active) {
          setMessage('Failed to load the receipt.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadOrder();

    return () => {
      active = false;
    };
  }, [orderDocId]);

  const orderDate = useMemo(() => formatOrderDate(order?.createdAt), [order?.createdAt]);

  const handleSavePDF = async () => {
    if (!receiptRef.current || !order) return;
    
    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width / 2, canvas.height / 2]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`Booxie_Receipt_${order.orderId}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setMessage('Failed to generate PDF. Please try again.');
    }
  };

  const handleShare = async () => {
    if (!order) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Booxie Order Receipt',
          text: `Check out my Booxie order receipt. Order ID: ${order.orderId}`,
          url: window.location.href
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      setMessage('Sharing is not supported on this browser.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8FCF9] p-4">
        <div className="w-10 h-10 border-4 border-[#006A4E] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500">Loading receipt...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8FCF9] p-4">
        <p className="text-gray-500 mb-4">No order data found.</p>
        <button onClick={() => navigate('/')} className="bg-[#006A4E] text-white px-6 py-2 rounded-full">
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FCF9] font-sans">
      {message && (
        <div className="fixed top-4 left-4 right-4 z-50 bg-white border border-gray-200 text-gray-700 p-4 rounded-2xl shadow-lg text-sm">
          <div className="flex items-center justify-between gap-4">
            <p>{message}</p>
            <button onClick={() => setMessage('')} className="text-xs font-bold text-[#006A4E]">
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="px-4 py-6 flex flex-col items-center bg-white border-b border-gray-100">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Payment Success!</h1>
        <p className="text-sm text-gray-500 mt-1">Your receipt has been generated</p>
      </div>

      <div className="flex-1 p-4">
        <div ref={receiptRef} className="bg-white rounded-3xl shadow-sm border border-[#f3f4f6] overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 flex justify-between px-4 -translate-y-1/2">
             {[...Array(10)].map((_, i) => (
               <div key={i} className="w-4 h-4 bg-[#F8FCF9] rounded-full"></div>
             ))}
          </div>

          <div className="p-6">
            <div className="flex justify-between items-start mb-8">
              <div className="flex items-center gap-2">
                <BooxieLogo className="w-8 h-8" />
                <span className="font-bold text-[#006A4E]">Booxie</span>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-[#9ca3af] uppercase font-bold tracking-wider">Order ID</p>
                <p className="text-sm font-mono font-bold text-[#111827]">{order.orderId}</p>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-sm">
                <span className="text-[#6b7280]">Date</span>
                <span className="text-[#111827] font-medium">{orderDate}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#6b7280]">Payment Method</span>
                <span className="text-[#111827] font-medium">{order.paymentMethod}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#6b7280]">Delivery Method</span>
                <span className="text-[#111827] font-medium">{order.deliveryMethod}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#6b7280]">Status</span>
                <span className="text-[#111827] font-medium capitalize">{order.status}</span>
              </div>
            </div>

            <div className="w-full h-px border-t border-dashed border-[#e5e7eb] mb-6"></div>

            <div className="space-y-4 mb-6">
              <p className="text-[10px] text-[#9ca3af] uppercase font-bold tracking-wider">Items</p>
              {order.items.map((item, idx) => (
                <div key={`${item.bookId}-${idx}`} className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-bold text-[#111827] line-clamp-1">{item.title}</p>
                    <p className="text-xs text-[#6b7280]">Qty: {item.quantity || 1}</p>
                  </div>
                  <span className="text-sm font-bold text-[#111827]">${(item.price * (item.quantity || 1)).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="w-full h-px border-t border-dashed border-[#e5e7eb] mb-6"></div>

            <div className="space-y-3 mb-8">
              <div className="flex justify-between text-sm text-[#4b5563]">
                <span>Subtotal</span>
                <span>${order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-[#4b5563]">
                <span>Delivery Fee</span>
                <span>${order.deliveryFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-black text-[#006A4E] pt-2">
                <span>Total Amount</span>
                <span>${order.total.toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-[#f9fafb] rounded-2xl p-4 mb-2">
              <p className="text-[10px] text-[#9ca3af] uppercase font-bold tracking-wider mb-2">Delivery to</p>
              <p className="text-xs text-[#374151] font-medium leading-relaxed">
                {order.shippingAddress.name}<br/>
                {order.shippingAddress.phone}<br/>
                {order.shippingAddress.address}
              </p>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 flex justify-between px-4 translate-y-1/2">
             {[...Array(10)].map((_, i) => (
               <div key={i} className="w-4 h-4 bg-[#F8FCF9] rounded-full"></div>
             ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-8">
          <button 
            onClick={handleSavePDF}
            className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 py-3 rounded-2xl text-sm font-bold shadow-sm hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Save PDF
          </button>
          <button 
            onClick={handleShare}
            className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 py-3 rounded-2xl text-sm font-bold shadow-sm hover:bg-gray-50 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </div>
      </div>

      <div className="p-4 pb-10">
        <button 
          onClick={() => navigate('/')}
          className="w-full bg-[#006A4E] text-white py-4 rounded-full font-bold text-base shadow-lg shadow-[#006A4E]/20 hover:bg-[#005C44] transition-colors flex items-center justify-center gap-2"
        >
          <Home className="w-5 h-5" />
          Back to Home
        </button>
      </div>
    </div>
  );
}
