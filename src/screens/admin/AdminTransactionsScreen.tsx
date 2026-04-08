import React, { useState } from 'react';
import { Search, Eye, RotateCcw, AlertTriangle, Flag } from 'lucide-react';

const MOCK_TRANSACTIONS = [
  { id: 'TRX-9001', buyer: 'Sokha Chen', seller: 'Vannak Lim', book: 'Math Grade 12', price: 12.50, method: 'ABA PAY', status: 'Completed', date: '2026-04-07 10:30 AM' },
  { id: 'TRX-9002', buyer: 'Bopha Nguon', seller: 'Dara Keo', book: 'History of Cambodia', price: 8.00, method: 'Cash Pay', status: 'Pending', date: '2026-04-07 09:15 AM' },
  { id: 'TRX-9003', buyer: 'Sophea Meas', seller: 'Vannak Lim', book: 'Physics Fundamentals', price: 15.00, method: 'ACLEDA Pay', status: 'Disputed', date: '2026-04-06 14:20 PM' },
  { id: 'TRX-9004', buyer: 'Dara Keo', seller: 'Sokha Chen', book: 'English Grammar', price: 5.50, method: 'ABA PAY', status: 'Refunded', date: '2026-04-05 11:45 AM' },
  { id: 'TRX-9005', buyer: 'Vannak Lim', seller: 'Bopha Nguon', book: 'Chemistry Grade 11', price: 9.00, method: 'ABA PAY', status: 'Completed', date: '2026-04-04 16:10 PM' },
];

export default function AdminTransactionsScreen() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filteredTransactions = MOCK_TRANSACTIONS.filter(trx => {
    const matchesSearch = trx.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          trx.buyer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          trx.seller.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          trx.book.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || trx.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Completed': return 'bg-green-50 text-green-700';
      case 'Pending': return 'bg-yellow-50 text-yellow-700';
      case 'Disputed': return 'bg-red-50 text-red-700';
      case 'Refunded': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Monitor Transactions</h1>
          <p className="text-sm text-gray-500 mt-1">Track and manage all book purchases.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search by ID, buyer, seller, or book..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#006A4E]/20 focus:border-[#006A4E]"
          />
        </div>
        <div className="flex gap-4">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#006A4E]/20 focus:border-[#006A4E]"
          >
            <option value="All">All Status</option>
            <option value="Completed">Completed</option>
            <option value="Pending">Pending</option>
            <option value="Disputed">Disputed</option>
            <option value="Refunded">Refunded</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-600 font-medium">
              <tr>
                <th className="px-6 py-4">Transaction ID</th>
                <th className="px-6 py-4">Buyer</th>
                <th className="px-6 py-4">Seller</th>
                <th className="px-6 py-4">Book Title</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Payment</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTransactions.map((trx) => (
                <tr key={trx.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{trx.id}</td>
                  <td className="px-6 py-4 text-gray-700">{trx.buyer}</td>
                  <td className="px-6 py-4 text-gray-700">{trx.seller}</td>
                  <td className="px-6 py-4 text-gray-700 truncate max-w-[150px]">{trx.book}</td>
                  <td className="px-6 py-4 font-medium text-[#006A4E]">${trx.price.toFixed(2)}</td>
                  <td className="px-6 py-4 text-gray-500">{trx.method}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${getStatusColor(trx.status)}`}>
                      {trx.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 whitespace-nowrap">{trx.date}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-1.5 text-gray-400 hover:text-[#006A4E] hover:bg-[#006A4E]/10 rounded-lg transition-colors" title="View Details">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Refund Transaction">
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors" title="Mark Dispute">
                        <AlertTriangle className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Flag Suspicious">
                        <Flag className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                    No transactions found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination placeholder */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
          <span>Showing 1 to {filteredTransactions.length} of {filteredTransactions.length} entries</span>
          <div className="flex gap-1">
            <button className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50" disabled>Previous</button>
            <button className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50" disabled>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
