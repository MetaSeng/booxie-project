import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, MapPin, Truck, CreditCard, ChevronDown, Search, LocateFixed, Store } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth } from '../firebase';
import { AbaPayIcon, AcledaPayIcon, CashIcon } from '../components/PaymentIcons';
import { useCart } from '../context/CartContext';
import BooxieLogo from '../components/BooxieLogo';
import { addRewardPoints, REWARD_POINTS } from '../lib/rewards';
import { createOrder } from '../lib/orders';

const COUNTRIES = [
  { code: '+855', flag: '🇰🇭', name: 'Cambodia' },
  { code: '+84', flag: '🇻🇳', name: 'Vietnam' },
  { code: '+66', flag: '🇹🇭', name: 'Thailand' },
  { code: '+1', flag: '🇺🇸', name: 'United States' },
  { code: '+44', flag: '🇬🇧', name: 'United Kingdom' },
  { code: '+81', flag: '🇯🇵', name: 'Japan' },
  { code: '+86', flag: '🇨🇳', name: 'China' },
  { code: '+82', flag: '🇰🇷', name: 'South Korea' },
  { code: '+33', flag: '🇫🇷', name: 'France' },
];

const MOCK_ADDRESSES = [
  "Street 2004, Phnom Penh",
  "Russian Boulevard, Phnom Penh",
  "Toul Kork District, Phnom Penh",
  "Sihanouk Boulevard, Phnom Penh",
  "Norodom Boulevard, Phnom Penh",
];

export default function CheckoutScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartItems, clearCart } = useCart();
  
  // If a single book is passed via state (Buy Now), use it. Otherwise use selected cart items.
  const singleBook = location.state?.book;
  const checkoutItems = singleBook 
    ? [{
        ...singleBook,
        image: singleBook.image || singleBook.imageUrl || 'https://via.placeholder.com/150',
        quantity: 1,
        selected: true
      }] 
    : cartItems.filter(item => item.selected);
    
  const [fullName, setFullName] = useState('');
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [showCountrySelector, setShowCountrySelector] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  
  const [deliveryMethod, setDeliveryMethod] = useState('J&T Express');
  const [paymentMethod, setPaymentMethod] = useState('ABA PAY');
  
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAddressChange = (val: string) => {
    setAddress(val);
    if (val.length > 2) {
      const filtered = MOCK_ADDRESSES.filter(addr => addr.toLowerCase().includes(val.toLowerCase()));
      setAddressSuggestions(filtered);
      setShowAddressSuggestions(true);
    } else {
      setShowAddressSuggestions(false);
    }
  };

  const selectAddress = (addr: string) => {
    setAddress(addr);
    setShowAddressSuggestions(false);
  };

  const subtotal = checkoutItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = deliveryMethod === 'Self Pick UP' ? 0.00 : 1.00;
  const total = subtotal + deliveryFee;
  
  const deliveryMethods = ['Self Pick UP', 'J&T Express', 'Jalat', 'VET Express'];
  const paymentMethods = [
    { id: 'ABA PAY', label: 'ABA PAY', icon: <AbaPayIcon /> },
    { id: 'ACLEDA Pay', label: 'ACLEDA Pay', icon: <AcledaPayIcon /> },
    { id: 'Cash Pay', label: 'Cash Pay', icon: <CashIcon /> }
  ];

  const handlePlaceOrder = () => {
    if (!fullName || !phone || !address) {
      setErrorMessage('Please fill in your full name, phone number, and address to proceed with the order.');
      
      // Clear error message after 3 seconds
      setTimeout(() => {
        setErrorMessage('');
      }, 3000);
      return;
    }
    setErrorMessage('');
    setShowConfirmation(true);
  };

  const handleConfirmOrder = async () => {
    if (checkoutItems.length === 0) {
      setErrorMessage('Your checkout is empty.');
      return;
    }

    if (!auth.currentUser) {
      setErrorMessage('Please sign in with a real account before placing an order.');
      setShowConfirmation(false);
      return;
    }

    setIsProcessing(true);
    try {
      const createdOrder = await createOrder({
        userId: auth.currentUser.uid,
        items: checkoutItems.map((item) => ({
          bookId: item.id,
          title: item.title,
          price: item.price,
          quantity: item.quantity,
          image: item.image || item.imageUrl || 'https://via.placeholder.com/150',
          sellerId: item.sellerId,
        })),
        subtotal,
        deliveryFee,
        total,
        paymentMethod,
        deliveryMethod,
        shippingAddress: {
          name: fullName,
          phone: `${country.code} ${phone}`,
          address,
        },
      });

      if (!singleBook) {
        clearCart();
      }

      // Award points for buying (if logged in)
      if (auth.currentUser) {
        const pointsToAward = checkoutItems.length * REWARD_POINTS.BUY;
        await addRewardPoints(auth.currentUser.uid, pointsToAward, 'purchased');
      }

      navigate('/receipt', { state: { orderId: createdOrder.id } });
    } catch (error) {
      console.error("Purchase processing error:", error);
      setErrorMessage('We could not save your order. Please try again.');
    } finally {
      setIsProcessing(false);
      setShowConfirmation(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans relative">
      {/* Error Message Toast */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-4 right-4 z-50 pointer-events-none"
          >
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-4 rounded-2xl shadow-xl text-sm font-medium flex items-center gap-3 backdrop-blur-xl">
              <span className="text-lg">⚠️</span>
              <p>{errorMessage}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="px-6 py-6 flex items-center justify-between bg-white sticky top-0 z-10">
        <div className="flex items-center">
          <button onClick={() => navigate('/cart')} className="relative z-50 p-2.5 -ml-2.5 rounded-full hover:bg-black/5 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-800" />
          </button>
          <h1 className="text-xl font-bold text-gray-900 ml-4 tracking-tight">Checkout</h1>
        </div>
        <div className="w-10 h-10 rounded-2xl overflow-hidden flex items-center justify-center bg-white shadow-sm border border-gray-100">
          <BooxieLogo className="w-7 h-7" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-24">
        {/* Shipping Address */}
        <div className="space-y-6 mb-10 bg-[#F2F2F2] p-5 rounded-[32px]">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#006A4E]" />
            <h2 className="text-sm font-bold text-gray-700 tracking-tight">Shipping Address</h2>
          </div>
          
          <div className="space-y-3">
            <div className="group">
              <input 
                type="text" 
                placeholder="Full Name" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-white border border-transparent rounded-2xl px-5 py-4 text-sm outline-none placeholder:text-gray-300 shadow-sm focus:border-[#00845A] focus:ring-4 focus:ring-[#00845A]/5 transition-all text-gray-700"
              />
            </div>

            <div className="group relative">
              <div className="flex items-center bg-white border border-transparent rounded-2xl px-2 py-1.5 shadow-sm focus-within:border-[#00845A] focus-within:ring-4 focus-within:ring-[#00845A]/5 transition-all">
                <button 
                  type="button"
                  onClick={() => setShowCountrySelector(!showCountrySelector)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors shrink-0"
                >
                  <span className="text-lg leading-none">{country.flag}</span>
                  <span className="text-sm font-bold text-gray-800">{country.code}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${showCountrySelector ? 'rotate-180' : ''}`} />
                </button>
                
                <div className="w-px h-6 bg-gray-100 mx-1"></div>
                
                <input 
                  type="tel" 
                  placeholder="Phone Number" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="flex-1 bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-gray-300 text-gray-700"
                />

                {/* Country Selector Dropdown */}
                <AnimatePresence>
                  {showCountrySelector && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute top-full left-0 mt-3 w-full max-h-64 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-50 py-2 flex flex-col"
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
                            className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#F2F2F2] transition-colors text-left"
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

            <div className="group relative">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Your Address" 
                  value={address}
                  onChange={(e) => handleAddressChange(e.target.value)}
                  onFocus={() => address.length > 2 && setShowAddressSuggestions(true)}
                  className="w-full bg-white border border-transparent rounded-2xl px-5 py-4 text-sm outline-none placeholder:text-gray-300 shadow-sm focus:border-[#00845A] focus:ring-4 focus:ring-[#00845A]/5 transition-all text-gray-700"
                />

                {/* Address Suggestions */}
                <AnimatePresence>
                  {showAddressSuggestions && addressSuggestions.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full left-0 mt-3 w-full bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-40 py-2"
                    >
                      {addressSuggestions.map((addr, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => selectAddress(addr)}
                          className="w-full flex items-center gap-4 px-5 py-4 hover:bg-[#F2F2F2] transition-colors text-left group/item"
                        >
                          <div className="w-8 h-8 bg-[#F2F2F2] rounded-xl flex items-center justify-center shrink-0 group-hover/item:bg-[#E8F5F0] transition-colors">
                            <LocateFixed className="w-4 h-4 text-gray-400 group-hover/item:text-[#00845A]" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-400">
                              <span className="text-gray-900">{addr.substring(0, address.length)}</span>
                              <span className="text-[#00845A] font-black">{addr.substring(address.length)}</span>
                            </p>
                            <p className="text-[10px] text-gray-400 font-medium tracking-tight">Predicted Location</p>
                          </div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* Shipping Method */}
        <div className="space-y-4 mb-10 bg-[#F2F2F2] p-5 rounded-[32px]">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-[#006A4E]" />
            <h3 className="text-sm font-bold text-gray-700 tracking-tight">Shipping Method</h3>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {deliveryMethods.map(method => (
              <div 
                key={method}
                onClick={() => setDeliveryMethod(method)}
                className={`group flex items-center justify-between bg-white rounded-2xl px-5 py-4 cursor-pointer border-2 transition-all ${
                  deliveryMethod === method 
                    ? 'border-[#00845A] shadow-md shadow-[#00845A]/5' 
                    : 'border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1 transition-colors`}>
                    {method === 'Self Pick UP' ? (
                      <Store className={`w-4 h-4 ${deliveryMethod === method ? 'text-[#00845A]' : 'text-[#006A4E]'}`} />
                    ) : (
                      <Truck className={`w-4 h-4 ${deliveryMethod === method ? 'text-[#00845A]' : 'text-[#006A4E]'}`} />
                    )}
                  </div>
                  <span className={`text-[13px] font-medium transition-colors ${deliveryMethod === method ? 'text-gray-900' : 'text-gray-800'}`}>{method}</span>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${deliveryMethod === method ? 'border-[#00845A] bg-[#00845A]' : 'border-gray-200'}`}>
                  {deliveryMethod === method && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Method */}
        <div className="space-y-4 mb-10 bg-[#F2F2F2] p-5 rounded-[32px]">
          <h3 className="text-sm font-bold text-gray-700 tracking-tight">Payment Method</h3>
          <div className="grid grid-cols-1 gap-3">
            {paymentMethods.map(method => (
              <div 
                key={method.id}
                onClick={() => setPaymentMethod(method.id)}
                className={`group flex items-center justify-between bg-white rounded-2xl px-5 py-4 cursor-pointer border-2 transition-all ${
                  paymentMethod === method.id 
                    ? 'border-[#00845A] shadow-md shadow-[#00845A]/5' 
                    : 'border-transparent'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="shrink-0 scale-100">
                    {method.icon}
                  </div>
                  <span className={`text-[13px] font-medium transition-colors ${paymentMethod === method.id ? 'text-gray-900' : 'text-gray-800'}`}>{method.label}</span>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${paymentMethod === method.id ? 'border-[#00845A] bg-[#00845A]' : 'border-gray-200'}`}>
                  {paymentMethod === method.id && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-[#F2F2F2] rounded-[32px] p-6 mb-8 border border-transparent shadow-sm">
          <h4 className="text-sm font-bold text-gray-700 tracking-tight mb-4">Order Summary</h4>
          <div className="space-y-4 mb-6">
            {checkoutItems.map((item, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-xs text-gray-500 font-medium">{item.quantity}x {item.title}</span>
                <span className="text-xs font-bold text-gray-900">{(item.price * item.quantity).toFixed(0)}$</span>
              </div>
            ))}
          </div>
          
          <div className="space-y-3 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center text-xs text-gray-600 font-medium">
              <span>Shipping Fee</span>
              <span className="text-gray-900 font-bold">{deliveryFee.toFixed(0)}$</span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-sm font-bold text-gray-900">Total</span>
              <span className="text-sm font-bold text-gray-900">{total.toFixed(0)}$</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Button Bottom */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white to-transparent pointer-events-none">
        <div className="max-w-md mx-auto pointer-events-auto">
          <button 
            onClick={handlePlaceOrder}
            className="w-full bg-[#006A4E] text-white py-5 rounded-[24px] font-black text-sm tracking-widest uppercase shadow-[0_20px_40px_rgba(0,106,78,0.2)] hover:bg-[#005C44] transition-all active:scale-95 flex items-center justify-center gap-3"
          >
            Confirm & Pay ${total.toFixed(2)}
          </button>
        </div>
      </div>

      {/* Confirmation Popup */}
      <AnimatePresence>
        {showConfirmation && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirmation(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[40px] p-8 w-full max-w-sm flex flex-col items-center text-center shadow-[0_30px_60px_rgba(0,0,0,0.3)] relative z-10"
            >
              <div className="w-16 h-16 bg-[#E8F5F0] rounded-3xl flex items-center justify-center mb-6">
                <CreditCard className="w-8 h-8 text-[#00845A]" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">Final Confirmation</h3>
              <p className="text-sm text-gray-500 font-medium leading-relaxed mb-10">
                You're about to purchase {checkoutItems.length} {checkoutItems.length === 1 ? 'book' : 'books'} for a total of <span className="font-bold text-[#00845A]">${total.toFixed(2)}</span>.
              </p>
              
              <div className="space-y-3 w-full">
                <button 
                  onClick={handleConfirmOrder}
                  disabled={isProcessing}
                  className="w-full bg-[#006A4E] text-white py-4 rounded-2xl font-black text-sm tracking-widest uppercase hover:bg-[#005C44] transition-all disabled:opacity-50 shadow-lg"
                >
                  {isProcessing ? 'Processing...' : 'Pay Now'}
                </button>
                <button 
                  onClick={() => setShowConfirmation(false)}
                  disabled={isProcessing}
                  className="w-full bg-transparent text-gray-400 py-4 rounded-2xl font-bold text-sm tracking-wide hover:text-gray-900 transition-all disabled:opacity-50"
                >
                  Go Back
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { bg: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
        .custom-scrollbar { scrollbar-width: thin; scrollbar-color: #E2E8F0 transparent; }
      `}</style>
    </div>
  );
}
