'use client';

import { Dispute, DisputeService } from '@/lib/services/dispute-service';
import { AlertCircle, CheckCircle2, ChevronRight, Clock, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface DisputesTabProps {
  bookings: any[]; 
  disputes: Dispute[];
}

export default function DisputesTab({ bookings, disputes }: DisputesTabProps) {
  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDisputeBookingId, setNewDisputeBookingId] = useState('');
  const [newDisputeDescription, setNewDisputeDescription] = useState('');
  const [newDisputeRefund, setNewDisputeRefund] = useState('');
  
  // Details Modal State
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);

  // Use local state only for adding new disputes optimistically or force reload if needed
  // But for now we rely on the parent passed prop
  
  const handleCreateDispute = async () => {
    if (!newDisputeBookingId || !newDisputeDescription) {
      toast.error('Please select a booking and provide a description');
      return;
    }
    
    try {
      const refundAmount = newDisputeRefund ? parseFloat(newDisputeRefund) : undefined;
      await DisputeService.createDispute(newDisputeBookingId, newDisputeDescription, refundAmount);
      
      // Ideally trigger a refresh in parent, but for now we can rely on page reload or 
      // adding to a local list if we copied the prop to state. 
      // User asked to make it like other tabs, which usually just display data.
      setShowCreateModal(false);
      
      // Reset form
      setNewDisputeBookingId('');
      setNewDisputeDescription('');
      setNewDisputeRefund('');
      
      toast.success('Dispute submitted successfully (Refresh to see updates)');
      window.location.reload(); // Simple refresh for now as we moved state up
    } catch (error) {
      console.error('Failed to create dispute:', error);
      toast.error('Failed to submit dispute');
    }
  };

  const completedBookings = bookings.filter(b => b.status === 'COMPLETED' || b.status === 'CONFIRMED');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'RESOLVED': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'REJECTED': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  return (
    <div className="animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">My Disputes</h2>
          <p className="text-sm text-slate-500">Track and manage your reported issues</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary-700 transition-colors flex items-center gap-2 mr-12 mb-3"
        >
          <Plus className="w-4 h-4" />
          File New Dispute
        </button>
      </div>

      {/* Disputes List */}
      {disputes.length === 0 ? (
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-8 border border-slate-200 dark:border-slate-700 border-dashed text-center">
          <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-900 dark:text-white mb-1">No Active Disputes</h3>
          <p className="text-sm text-slate-500">You don't have any reported issues. That's great!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {disputes.map((dispute) => (
            <div 
              key={dispute.id}
              onClick={() => setSelectedDispute(dispute)}
              className="group bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getStatusColor(dispute.status)}`}>
                      {dispute.status}
                    </span>
                    <span className="text-xs text-slate-400">
                      ID: {dispute.id.substring(0, 8)}...
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(dispute.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                    {dispute.booking?.professional?.name 
                      ? `Issue with ${dispute.booking.professional.name}`
                      : 'Booking Issue'}
                  </h4>
                  <p className="text-sm text-slate-500 line-clamp-1 mt-1">{dispute.description}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary-500 transition-colors" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-900 dark:text-white">File New Dispute</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Select Booking *</label>
                <select
                  value={newDisputeBookingId}
                  onChange={(e) => setNewDisputeBookingId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none"
                >
                  <option value="">Select booking...</option>
                  {completedBookings.map((booking: any) => (
                    <option key={booking.id} value={booking.id}>
                      {booking.professional?.name || 'Professional'} - {new Date(booking.startTime).toLocaleDateString()}
                    </option>
                  ))}
                </select>
                {completedBookings.length === 0 && (
                   <p className="text-xs text-amber-600 mt-2">You have no eligible bookings to dispute.</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Description *</label>
                <textarea
                  value={newDisputeDescription}
                  onChange={(e) => setNewDisputeDescription(e.target.value)}
                  placeholder="Describe the issue in detail..."
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Requested Refund Amount (Optional)</label>
                <input
                  type="number"
                  value={newDisputeRefund}
                  onChange={(e) => setNewDisputeRefund(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateDispute}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20"
                >
                  Submit Dispute
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setSelectedDispute(null)} />
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${getStatusColor(selectedDispute.status)}`}>
                    {selectedDispute.status}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(selectedDispute.createdAt).toLocaleString()}
                  </span>
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Dispute Details</h3>
              </div>
              <button onClick={() => setSelectedDispute(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-6">
              {selectedDispute.booking && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Booking Reference</p>
                  <p className="font-bold text-slate-900 dark:text-white">
                    {selectedDispute.booking.professional?.name || 'Professional'}
                  </p>
                  <p className="text-sm text-slate-500">
                    {new Date(selectedDispute.booking.startTime).toLocaleDateString()}
                  </p>
                </div>
              )}

              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white mb-2">Description</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                  {selectedDispute.description}
                </p>
              </div>

              {selectedDispute.statusNote && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <p className="text-sm font-bold text-blue-700 dark:text-blue-300">Admin Response</p>
                  </div>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    {selectedDispute.statusNote}
                  </p>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setSelectedDispute(null)}
                  className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
