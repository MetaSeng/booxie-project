import React, { useState } from 'react';
import { Search, CheckCircle, XCircle, EyeOff } from 'lucide-react';

const MOCK_REPORTS = [
  { id: 'RPT-001', reporter: 'Vannak Lim', book: 'Math Grade 12', reason: 'Counterfeit book', date: '2026-04-07 10:30 AM', status: 'Pending' },
  { id: 'RPT-002', reporter: 'Bopha Nguon', book: 'History of Cambodia', reason: 'Offensive content in description', date: '2026-04-07 09:15 AM', status: 'Pending' },
  { id: 'RPT-003', reporter: 'Sophea Meas', book: 'Physics Fundamentals', reason: 'Seller asked for payment outside app', date: '2026-04-06 14:20 PM', status: 'Reviewed' },
];

export default function AdminReportsScreen() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredReports = MOCK_REPORTS.filter(report => {
    return report.book.toLowerCase().includes(searchTerm.toLowerCase()) || 
           report.reporter.toLowerCase().includes(searchTerm.toLowerCase()) ||
           report.reason.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Review listings reported by users.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search by book, reporter, or reason..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#006A4E]/20 focus:border-[#006A4E]"
          />
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-600 font-medium">
              <tr>
                <th className="px-6 py-4">Report ID</th>
                <th className="px-6 py-4">Reporter</th>
                <th className="px-6 py-4">Book Title</th>
                <th className="px-6 py-4">Reason</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredReports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{report.id}</td>
                  <td className="px-6 py-4 text-gray-700">{report.reporter}</td>
                  <td className="px-6 py-4 text-gray-700 max-w-[150px] truncate">{report.book}</td>
                  <td className="px-6 py-4 text-gray-700 max-w-[200px] truncate">{report.reason}</td>
                  <td className="px-6 py-4 text-gray-500 whitespace-nowrap">{report.date}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${
                      report.status === 'Pending' ? 'bg-yellow-50 text-yellow-700' : 'bg-green-50 text-green-700'
                    }`}>
                      {report.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-1.5 text-gray-400 hover:text-[#006A4E] hover:bg-[#006A4E]/10 rounded-lg transition-colors" title="Review Listing">
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Remove Listing">
                        <XCircle className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Ignore Report">
                        <EyeOff className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredReports.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No reports found.
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
