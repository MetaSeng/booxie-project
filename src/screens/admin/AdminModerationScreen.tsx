import React, { useState } from 'react';
import { Search, CheckCircle, XCircle, ShieldOff, AlertTriangle } from 'lucide-react';

const MOCK_FLAGGED = [
  { id: 'FLG-001', image: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=100&h=150', title: 'Suspicious Book Title', seller: 'User123', reason: 'Fake academic book', confidence: 92 },
  { id: 'FLG-002', image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=100&h=150', title: 'Not a book', seller: 'Spammer99', reason: 'Non-book item', confidence: 98 },
  { id: 'FLG-003', image: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=100&h=150', title: 'Duplicate Math Book', seller: 'Sokha Chen', reason: 'Duplicate listing', confidence: 85 },
  { id: 'FLG-004', image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=100&h=150', title: 'Inappropriate Cover', seller: 'BadActor', reason: 'Pornographic content', confidence: 99 },
];

export default function AdminModerationScreen() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredListings = MOCK_FLAGGED.filter(listing => {
    return listing.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
           listing.seller.toLowerCase().includes(searchTerm.toLowerCase()) ||
           listing.reason.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Moderation System</h1>
          <p className="text-sm text-gray-500 mt-1">Review listings flagged by the AI moderation system.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search by title, seller, or reason..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#006A4E]/20 focus:border-[#006A4E]"
          />
        </div>
      </div>

      {/* Flagged Listings Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-600 font-medium">
              <tr>
                <th className="px-6 py-4">Book Image</th>
                <th className="px-6 py-4">Listing Title</th>
                <th className="px-6 py-4">AI Warning Reason</th>
                <th className="px-6 py-4">Confidence</th>
                <th className="px-6 py-4">Seller Name</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredListings.map((listing) => (
                <tr key={listing.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="w-12 h-16 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                      <img src={listing.image} alt={listing.title} className="w-full h-full object-cover" />
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900 max-w-[200px] truncate">{listing.title}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-red-600 font-medium">
                      <AlertTriangle className="w-4 h-4" />
                      {listing.reason}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${listing.confidence > 90 ? 'bg-red-500' : 'bg-orange-500'}`} 
                          style={{ width: `${listing.confidence}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-medium text-gray-700">{listing.confidence}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-700">{listing.seller}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Approve Listing (False Positive)">
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Remove Listing">
                        <XCircle className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors" title="Suspend Seller">
                        <ShieldOff className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredListings.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No flagged listings found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
