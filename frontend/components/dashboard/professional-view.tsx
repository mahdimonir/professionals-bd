'use client';

import { BookingService } from '@/lib/services/booking-service';
import { Dispute, DisputeService } from '@/lib/services/dispute-service';
import { ProfessionalService } from '@/lib/services/professional-service';
import { Review, ReviewService } from '@/lib/services/review-service';
import { Booking, BookingStatus, ProfessionalProfile } from '@/lib/types';
import {
    AlertCircle,
    Calendar,
    Clock,
    Loader2,
    Scale,
    Star, TrendingUp,
    Wallet,
    XCircle
} from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import ConfirmationDialog from '../ui/confirmation-dialog';
import RescheduleModal from '../ui/reschedule-modal';

type TabType = 'overview' | 'bookings' | 'earnings' | 'availability' | 'reviews' | 'disputes';

interface TimeSlot {
  start: string;
  end: string;
}
interface DaySchedule {
  enabled: boolean;
  slots: TimeSlot[];
}
type WeeklySchedule = Record<string, DaySchedule>;

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function ProfessionalView({ userProfile }: { userProfile?: ProfessionalProfile }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Tab State synced with URL
  const activeTab = (searchParams.get('tab') as TabType) || 'overview';
  
  const setActiveTab = (tab: TabType) => {
      const params = new URLSearchParams(searchParams);
      params.set('tab', tab);
      router.push(`${pathname}?${params.toString()}`);
  };

  const [isLoading, setIsLoading] = useState(false);
  
  // Data States
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [earnings, setEarnings] = useState<{ totalEarnings: string | number; pendingEarnings: string | number; withdrawn: string | number; currency?: string } | null>(null);
  const [withdrawHistory, setWithdrawHistory] = useState<any[]>([]);
  const [availability, setAvailability] = useState<WeeklySchedule>({});
  const [disputes, setDisputes] = useState<Dispute[]>([]);

  // Stats
  const [stats, setStats] = useState({
    pendingRequests: 0,
    upcomingSessions: 0,
  });

  // Action States
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => Promise<void>;
    type: 'danger' | 'warning' | 'info';
    confirmText?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    action: async () => {},
    type: 'info',
  });
  
  const [rescheduleModal, setRescheduleModal] = useState<{
    isOpen: boolean;
    booking: Booking | null;
  }>({ isOpen: false, booking: null });

  // --- Optimized Fetchers ---

  // 1. Overview: Needs Stats (Bookings count) + Earnings Summary
  const fetchOverviewData = useCallback(async () => {
    setIsLoading(true);
    try {
        const [bookingsRes, earningsRes] = await Promise.all([
            BookingService.getProfessionalBookings(),
            ProfessionalService.getEarnings(),
        ]);
        const allBookings = bookingsRes.data || [];
        setBookings(allBookings); // Cache for summary list
        setEarnings(earningsRes.data);
        
        setStats({
            pendingRequests: allBookings.filter(b => b.status === BookingStatus.PAID).length,
            upcomingSessions: allBookings.filter(b => b.status === BookingStatus.CONFIRMED).length,
        });
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  }, []);

  // 2. Bookings Tab
  const fetchBookings = useCallback(async () => {
      setIsLoading(true);
      try {
          const res = await BookingService.getProfessionalBookings();
          setBookings(res.data || []);
      } catch (e) { console.error(e); }
      finally { setIsLoading(false); }
  }, []);

  // 3. Earnings Tab
  const fetchEarningsData = useCallback(async () => {
      setIsLoading(true);
      try {
          const [eRes, wRes] = await Promise.all([
              ProfessionalService.getEarnings(),
              ProfessionalService.getWithdrawHistory()
          ]);
          setEarnings(eRes.data);
          setWithdrawHistory(Array.isArray(wRes.data) ? wRes.data : []);
      } catch (e) { console.error(e); }
      finally { setIsLoading(false); }
  }, []);

  // 4. Reviews Tab
  const fetchReviews = useCallback(async () => {
      if (!userProfile?.userId) return; // Reviews usually fetched by professional userId not profile Id? Service check needed.
      // ReviewService.getProfessionalReviews expects professional USER ID usually.
      // Adjust if needed. Assuming userProfile.id or userId. 
      // Existing code used userProfile.id.
      if (!userProfile?.id) return;

      setIsLoading(true);
      try {
          const res = await ReviewService.getProfessionalReviews(userProfile.id);
          setReviews(res.data?.reviews || []);
      } catch (e) { console.error(e); }
      finally { setIsLoading(false); }
  }, [userProfile?.id, userProfile?.userId]);

  // 5. Disputes Tab
  const fetchDisputes = useCallback(async () => {
      setIsLoading(true);
      try {
          const res = await DisputeService.getMyDisputes();
          setDisputes(res.data || []);
      } catch (e) { console.error(e); }
      finally { setIsLoading(false); }
  }, []);

  // 6. Availability Tab - Load latest from profile (re-fetch profile not strictly needed if passed as prop, but user asked for api calls)
  // We will respect prop for initial, but could re-fetch. 
  // Let's rely on props + local state for now to avoid redundant profile fetches, 
  // BUT the user specifically said "availability... not calling any api".
  // So maybe we should fetch the latest profile?
  const fetchLatestProfile = useCallback(async () => {
      if (!userProfile?.id) return;
      setIsLoading(true);
      try {
          const res = await ProfessionalService.getProfessionalById(userProfile.id);
          if (res.data?.availability) {
              setAvailability(res.data.availability);
          }
      } catch (e) { console.error(e); }
      finally { setIsLoading(false); }
  }, [userProfile?.id]);


  // Routing Effect
  useEffect(() => {
      switch (activeTab) {
          case 'overview': fetchOverviewData(); break;
          case 'bookings': fetchBookings(); break;
          case 'earnings': fetchEarningsData(); break;
          case 'reviews': fetchReviews(); break;
          case 'disputes': fetchDisputes(); break;
          case 'availability': 
              // Set initial from props then fetch fresh
               if (userProfile?.availability && Object.keys(availability).length === 0) {
                   setAvailability(userProfile.availability);
               }
               fetchLatestProfile(); 
               break;
      }
  }, [activeTab, fetchOverviewData, fetchBookings, fetchEarningsData, fetchReviews, fetchDisputes, fetchLatestProfile]);

  // Actions
  const handleBookingAction = (booking: Booking, action: 'accept' | 'decline' | 'cancel_confirmed' | 'complete') => {
      let title = '', message = '', type: 'info' | 'danger' | 'warning' = 'info', confirmText = 'Confirm';
      
      if (action === 'accept') {
          title = 'Accept Booking?';
          message = 'This will confirm the session. The payment (held in escrow) will be released to you after completion.';
          confirmText = 'Accept & Confirm';
      } else if (action === 'decline') {
          title = 'Decline Booking Request?';
          message = 'Declining a paid request requires moderator approval. A cancellation request will be filed, and the moderator will review the refund.';
          type = 'warning';
          confirmText = 'Request Decline';
      } else if (action === 'cancel_confirmed') {
          title = 'File Cancellation Request?';
          message = 'This booking is already confirmed. Cancelling now requires Admin review. A dispute ticket will be created on your behalf.';
          type = 'warning';
          confirmText = 'File Dispute / Cancel';
      } else if (action === 'complete') {
          title = 'Mark Session Complete?';
          message = 'Only mark this as complete if the session has successfully finished. This triggers the payment release process.';
          confirmText = 'Complete Session';
      }

      setDialogState({
          isOpen: true,
          title,
          message,
          type,
          confirmText,
          action: async () => {
              setProcessingId(booking.id);
              try {
                  if (action === 'accept') {
                      await BookingService.updateBookingStatus(booking.id, BookingStatus.CONFIRMED);
                      toast.success('Booking Confirmed. Client notified.');
                  } else if (action === 'decline') {
                      await new Promise(r => setTimeout(r, 100));
                      const reason = window.prompt("Reason for declining (required for review):");
                      if (!reason) { toast.info("Action cancelled (reason required)"); return; }
                      
                      // Create Dispute instead of direct cancellation
                      await DisputeService.createDispute(booking.id, `Professional declined request: ${reason}`); 
                      toast.success('Decline request submitted to moderator.');
                  } else if (action === 'cancel_confirmed') {
                      await new Promise(r => setTimeout(r, 100));
                      const reason = window.prompt("Reason for cancellation request (required):");
                      if (!reason) { toast.info("Action cancelled"); return; }
                      await DisputeService.createDispute(booking.id, `Professional requested cancellation: ${reason}`);
                      toast.success('Cancellation request filed. Admin will review shortly.');
                  } else if (action === 'complete') {
                      await BookingService.completeBooking(booking.id);
                      toast.success('Session Marked as Completed');
                  }
                  // Refresh the current tab data
                  if (activeTab === 'bookings' || activeTab === 'overview') fetchBookings();
              } catch (error: any) { 
                  console.error(error);
                  toast.error(error.response?.data?.message || 'Action Failed'); 
              } finally {
                  setProcessingId(null);
                  setDialogState(prev => ({ ...prev, isOpen: false }));
              }
          }
      });
  };

  const handleRescheduleBooking = (booking: Booking) => {
      setRescheduleModal({ isOpen: true, booking });
  };

  const submitReschedule = async (dateStr: string, startStr: string, endStr: string) => {
      const booking = rescheduleModal.booking;
      if (!booking) return;

      // Construct ISO strings
      const newStart = new Date(`${dateStr}T${startStr}:00`);
      const newEnd = new Date(`${dateStr}T${endStr}:00`); // Assuming same day

      if (isNaN(newStart.getTime()) || isNaN(newEnd.getTime())) {
          toast.error("Invalid date or time format");
          return;
      }

      setProcessingId(booking.id);
      try {
          // Create Dispute of type RESCHEDULE_REQUEST
          await DisputeService.createDispute(
              booking.id, 
              `Reschedule requested to ${newStart.toLocaleString()}`, 
              0, 
              'RESCHEDULE_REQUEST', 
              { newStart: newStart.toISOString(), newEnd: newEnd.toISOString() }
          );
          toast.success('Reschedule Request Submitted');
          setRescheduleModal({ isOpen: false, booking: null });
          fetchBookings(); // Refresh list to show status change if any, or dispute
          fetchDisputes(); // Refresh disputes tab
      } catch (error: any) {
          console.error(error);
          toast.error(error.response?.data?.message || 'Request Failed');
      } finally {
          setProcessingId(null);
      }
  };

  const handleUpdateAvailability = async () => {
      setProcessingId('availability');
      try {
          await ProfessionalService.updateProfile({ availability });
          toast.success('Availability Updated');
      } catch (error) { toast.error('Failed to update availability'); }
      finally { setProcessingId(null); }
  };
  
  const handleToggleDay = (day: string, enabled: boolean) => {
      setAvailability(prev => ({ ...prev, [day]: { ...prev[day], enabled } }));
  };

  const handleAddSlot = (day: string) => {
      setAvailability(prev => ({
          ...prev, [day]: { ...prev[day], slots: [...(prev[day].slots || []), { start: '09:00', end: '17:00' }] }
      }));
  };

  const handleRemoveSlot = (day: string, index: number) => {
      setAvailability(prev => ({
          ...prev, [day]: { ...prev[day], slots: prev[day].slots.filter((_, i) => i !== index) }
      }));
  };

  const handleSlotChange = (day: string, index: number, field: 'start' | 'end', value: string) => {
       setAvailability(prev => ({
          ...prev,
          [day]: { 
              ...prev[day], 
              slots: prev[day].slots.map((slot, i) => i === index ? { ...slot, [field]: value } : slot)
          }
      }));
  };

  const handleWithdraw = () => {
      const balance = Number(earnings?.pendingEarnings || 0);
      const amountStr = window.prompt(`Enter amount to withdraw (Available: ৳${balance})`);
      if (!amountStr) return;
      const amount = parseFloat(amountStr);
      if (isNaN(amount) || amount <= 0 || amount > balance) {
          toast.error('Invalid amount');
          return;
      }
      
      const method = window.prompt("Enter method (bkash/bank):");
      const details = window.prompt("Enter Account Details:");
      
      setProcessingId('withdraw');
      ProfessionalService.requestWithdraw(amount, method || 'bank', details || '')
        .then(() => { toast.success('Withdrawal Requested'); fetchEarningsData(); })
        .catch(() => toast.error('Request failed'))
        .finally(() => setProcessingId(null));
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Professional Hub</h1>
           <p className="text-slate-500 text-sm">Manage your business and bookings.</p>
        </div>
        
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className={`w-3 h-3 rounded-full ${userProfile?.availabilityStatus === 'Available Now' ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`} />
            <span className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                {userProfile?.availabilityStatus || 'Offline'}
            </span>
        </div>
      </div>

      {/* Tabs */}
       <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'bookings', label: 'Bookings', icon: Calendar },
            { id: 'earnings', label: 'Earnings', icon: Wallet },
            { id: 'availability', label: 'Availability', icon: Clock },
            { id: 'reviews', label: 'Reviews', icon: Star },
            { id: 'disputes', label: 'Disputes', icon: Scale },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase whitespace-nowrap transition-all flex items-center gap-2 ${
                activeTab === tab.id 
                  ? 'bg-primary-600 text-white shadow-lg' 
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 min-h-[400px]">
          {isLoading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div> : (
              <>
                {/* OVERVIEW */}
                {activeTab === 'overview' && (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-primary-600 text-white p-6 rounded-2xl relative overflow-hidden">
                                <TrendingUp className="absolute top-4 right-4 text-white/20 w-16 h-16" />
                                <p className="font-bold text-xs uppercase opacity-80">Total Earnings</p>
                                <h3 className="text-3xl font-black mt-1">৳{Number(earnings?.totalEarnings || 0).toLocaleString()}</h3>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700">
                                <Calendar className="w-8 h-8 text-primary-500 mb-4" />
                                <h3 className="text-3xl font-black text-slate-900 dark:text-white">{stats.upcomingSessions}</h3>
                                <p className="text-xs font-bold text-slate-500 uppercase">Upcoming Sessions</p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700">
                                <Clock className="w-8 h-8 text-orange-500 mb-4" />
                                <h3 className="text-3xl font-black text-slate-900 dark:text-white">{stats.pendingRequests}</h3>
                                <p className="text-xs font-bold text-slate-500 uppercase">Pending Requests</p>
                            </div>
                        </div>

                        {stats.upcomingSessions > 0 && (
                            <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                  <Clock className="w-5 h-5 text-indigo-500" />
                                  Upcoming Sessions
                                </h3>
                                <div className="space-y-3">
                                    {bookings
                                      .filter(b => b.status === BookingStatus.CONFIRMED)
                                      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                                      .slice(0, 3)
                                      .map(booking => (
                                        <div key={booking.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                                            <div className="flex items-center gap-4">
                                                <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-xl text-center min-w-[60px]">
                                                    <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                                                      {new Date(booking.startTime).toLocaleDateString(undefined, { month: 'short' })}
                                                    </p>
                                                    <p className="text-xl font-black text-indigo-700 dark:text-indigo-300">
                                                      {new Date(booking.startTime).getDate()}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 dark:text-white text-sm">{booking.userName || 'Client'}</p>
                                                    <p className="text-xs text-slate-500">
                                                        {new Date(booking.startTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
                                                        {' - '}
                                                        {new Date(booking.endTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                              <button 
                                                onClick={() => {
                                                  navigator.clipboard.writeText(`${window.location.origin}/meeting/${booking.id}`);
                                                  toast.success("Link copied!");
                                                }}
                                                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-lg text-xs font-bold transition-colors"
                                                title="Copy Link"
                                              >
                                                Copy
                                              </button>
                                              <button 
                                                onClick={() => window.open(`/meeting/${booking.id}`, '_blank')}
                                                className="flex-1 sm:flex-none px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold uppercase tracking-wide hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                                              >
                                                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                                Start Session
                                              </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {stats.pendingRequests > 0 && (
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Action Required</h3>
                                <div className="space-y-3">
                                    {bookings.filter(b => b.status === BookingStatus.PAID).slice(0, 3).map(booking => (
                                        <div key={booking.id} className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-xl border border-yellow-100 dark:border-yellow-900/20">
                                            <div className="flex items-center gap-4">
                                                <div className="bg-yellow-100 dark:bg-yellow-900/40 p-2 rounded-lg">
                                                    <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 dark:text-white text-sm">New Request</p>
                                                    <p className="text-xs text-slate-500">
                                                        {new Date(booking.startTime).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })} • ৳{booking.price}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => handleBookingAction(booking, 'accept')} className="text-xs font-bold bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700">Accept</button>
                                                <button onClick={() => handleBookingAction(booking, 'decline')} className="text-xs font-bold bg-white border border-slate-200 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50">Decline</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* BOOKINGS */}
                {activeTab === 'bookings' && (
                    <div className="overflow-x-auto no-scrollbar">
                         <table className="w-full text-left">
                            <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] font-bold text-slate-400 uppercase">
                                <tr>
                                    <th className="px-4 py-3 rounded-l-lg">Client</th>
                                    <th className="px-4 py-3">Schedule</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3 rounded-r-lg text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {bookings.length > 0 ? bookings.map(book => (
                                    <tr key={book.id}>
                                        <td className="px-4 py-4">
                                            <p className="font-bold text-sm text-slate-900 dark:text-white">{book.userName || 'Client'}</p>
                                            <p className="text-xs text-slate-500">ID: {book.userId.slice(0,6)}...</p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{new Date(book.startTime).toLocaleDateString()}</p>
                                            <p className="text-xs text-slate-500">
                                                {new Date(book.startTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })} - 
                                                {new Date(book.endTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
                                            </p>
                                        </td>
                                        <td className="px-4 py-4">
                                             <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide
                                                ${book.status === 'PAID' ? 'bg-yellow-100 text-yellow-700' : 
                                                  book.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-700' :
                                                  book.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                                  'bg-slate-100 text-slate-500'}`}>
                                                {book.status === 'PAID' ? 'REQUEST' : book.status}
                                             </span>
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                {book.status === 'PAID' && (
                                                    <>
                                                        <button onClick={() => handleBookingAction(book, 'accept')} className="text-xs bg-primary-600 text-white px-3 py-1.5 rounded-lg hover:bg-primary-700 font-bold">Accept</button>
                                                        <button onClick={() => handleBookingAction(book, 'decline')} className="text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-red-50 hover:text-red-600 font-bold">Decline</button>
                                                    </>
                                                )}
                                                {book.status === 'CONFIRMED' && (
                                                    <>
                                                        <button 
                                                          onClick={() => window.open(`/meeting/${book.id}`, '_blank')}
                                                          className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 font-bold flex items-center gap-1"
                                                        >
                                                            <div className="w-2 h-2 rounded-full bg-white animate-pulse" /> Start Session
                                                        </button>
                                                        <button 
                                                          onClick={() => {
                                                            navigator.clipboard.writeText(`${window.location.origin}/meeting/${book.id}`);
                                                            toast.success('Link copied');
                                                          }}
                                                          className="text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-200 font-bold"
                                                          title="Copy Link"
                                                        >
                                                            Copy
                                                        </button>
                                                        <button onClick={() => handleRescheduleBooking(book)} className="text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-200 font-bold">Reschedule</button>
                                                        <button onClick={() => handleBookingAction(book, 'cancel_confirmed')} className="text-xs text-red-600 hover:underline font-bold">Request Cancel</button>
                                                    </>
                                                )}
                                                {book.status === 'COMPLETED' && <span className="text-xs font-bold text-green-600">Done</span>}
                                                {book.status === 'CANCELLED' && <span className="text-xs font-bold text-slate-400">Cancelled</span>}
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={4} className="text-center py-8 text-slate-400">No bookings found</td></tr>
                                )}
                            </tbody>
                         </table>
                    </div>
                )}

                {/* EARNINGS */}
                {activeTab === 'earnings' && (
                    <div className="space-y-8">
                        <div className="flex flex-col md:flex-row gap-6">
                            <div className="flex-1 bg-slate-900 text-white p-8 rounded-3xl relative overflow-hidden">
                                <Wallet className="w-12 h-12 text-slate-700 absolute top-6 right-6" />
                                <p className="text-slate-400 font-bold text-xs uppercase mb-2">Available Balance</p>
                                <h2 className="text-5xl font-black mb-6">৳{Number(earnings?.pendingEarnings || 0).toLocaleString()}</h2>
                                <button 
                                    onClick={handleWithdraw}
                                    disabled={!earnings?.pendingEarnings || Number(earnings.pendingEarnings) <= 0}
                                    className="bg-white text-slate-900 px-6 py-3 rounded-xl font-bold text-sm hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Request Withdraw
                                </button>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Withdrawal History</h3>
                             <div className="overflow-x-auto no-scrollbar">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] font-bold text-slate-400 uppercase">
                                        <tr>
                                            <th className="px-4 py-3 rounded-l-lg">Date</th>
                                            <th className="px-4 py-3">Amount</th>
                                            <th className="px-4 py-3">Method</th>
                                            <th className="px-4 py-3 rounded-r-lg text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {withdrawHistory.map((w, i) => (
                                            <tr key={i}>
                                                <td className="px-4 py-4 text-xs">{new Date(w.requestedAt).toLocaleDateString()}</td>
                                                <td className="px-4 py-4 text-sm font-bold">৳{w.amount}</td>
                                                <td className="px-4 py-4 text-xs">{w.method}</td>
                                                <td className="px-4 py-4 text-right">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                        w.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 
                                                        w.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-red-100 text-red-700'
                                                    }`}>{w.status}</span>
                                                </td>
                                            </tr>
                                        ))}
                                        {withdrawHistory.length === 0 && <tr><td colSpan={4} className="text-center py-4 text-slate-400 text-xs">No history</td></tr>}
                                    </tbody>
                                </table>
                             </div>
                        </div>
                    </div>
                )}

                {/* AVAILABILITY */}
                {activeTab === 'availability' && (
                    <div className="max-w-2xl mx-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Weekly Schedule</h3>
                            <button 
                                onClick={handleUpdateAvailability}
                                disabled={processingId === 'availability'}
                                className="bg-primary-600 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase hover:bg-primary-700 disabled:opacity-50"
                            >
                                {processingId === 'availability' ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Save Changes'}
                            </button>
                        </div>
                        <div className="space-y-4">
                            {DAYS.map(day => (
                                <div key={day} className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="font-bold text-sm text-slate-900 dark:text-white">{day}</div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                className="sr-only peer"
                                                checked={availability[day]?.enabled || false}
                                                onChange={(e) => handleToggleDay(day, e.target.checked)}
                                            />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                                        </label>
                                    </div>
                                    
                                    {availability[day]?.enabled && (
                                        <div className="space-y-3">
                                            {(availability[day]?.slots || []).map((slot, index) => (
                                                <div key={index} className="flex items-center gap-2">
                                                    <input 
                                                        type="time" 
                                                        value={slot.start}
                                                        onChange={(e) => handleSlotChange(day, index, 'start', e.target.value)}
                                                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs"
                                                    />
                                                    <span className="text-slate-400">-</span>
                                                    <input 
                                                        type="time" 
                                                        value={slot.end}
                                                        onChange={(e) => handleSlotChange(day, index, 'end', e.target.value)}
                                                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs"
                                                    />
                                                    <button onClick={() => handleRemoveSlot(day, index)} className="p-1 text-slate-400 hover:text-red-500">
                                                        <XCircle size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                            <button onClick={() => handleAddSlot(day)} className="text-xs font-bold text-primary-600 hover:underline flex items-center gap-1">
                                                + Add Slot
                                            </button>
                                        </div>
                                    )}
                                    {!availability[day]?.enabled && (
                                        <span className="text-xs text-slate-400 italic">Unavailable</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                {/* REVIEWS */}
                {activeTab === 'reviews' && (
                     <div className="space-y-4">
                        {reviews.length > 0 ? reviews.map(review => (
                            <div key={review.id} className="p-6 border border-slate-200 dark:border-slate-800 rounded-2xl">
                                <div className="flex justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-500">
                                            {review.booking?.user?.name?.[0] || 'U'}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-slate-900 dark:text-white">{review.booking?.user?.name || 'Anonymous Client'}</p>
                                            <p className="text-xs text-slate-500">{new Date(review.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex text-yellow-400">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} size={14} fill={i < review.rating ? "currentColor" : "none"} stroke="currentColor" className={i >= review.rating ? "text-slate-300" : ""} />
                                        ))}
                                    </div>
                                </div>
                                <p className="text-slate-600 dark:text-slate-300 text-sm">{review.comment}</p>
                            </div>
                        )) : (
                            <div className="text-center py-12 text-slate-500">No reviews yet</div>
                        )}
                     </div>
                )}

                {/* DISPUTES - NEW TAB */}
                {activeTab === 'disputes' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Active & Past Disputes</h3>
                        </div>
                        <div className="overflow-x-auto no-scrollbar">
                             <table className="w-full text-left">
                                <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] font-bold text-slate-400 uppercase">
                                    <tr>
                                        <th className="px-4 py-3 rounded-l-lg">Date</th>
                                        <th className="px-4 py-3">Issue</th>
                                        <th className="px-4 py-3">Booking ID</th>
                                        <th className="px-4 py-3 rounded-r-lg text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {disputes.length > 0 ? disputes.map(dispute => (
                                        <tr key={dispute.id}>
                                            <td className="px-4 py-4 text-xs text-slate-500">
                                                {new Date(dispute.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-4">
                                                <p className="font-bold text-sm text-slate-900 dark:text-white truncate max-w-[200px]">{dispute.description}</p>
                                            </td>
                                            <td className="px-4 py-4 text-xs font-mono">
                                                {dispute.bookingId?.slice(0, 8)}...
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                 <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase
                                                    ${dispute.status === 'OPEN' ? 'bg-orange-100 text-orange-700' : 
                                                      dispute.status === 'RESOLVED' ? 'bg-green-100 text-green-700' :
                                                      'bg-red-100 text-red-700'}`}>
                                                    {dispute.status}
                                                 </span>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan={4} className="text-center py-8 text-slate-400">No disputes found</td></tr>
                                    )}
                                </tbody>
                             </table>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs text-slate-500 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            To file a new dispute, please 'Request Cancel' on a Confirmed booking.
                        </div>
                    </div>
                )}
              </>
          )}
      </div>

      <ConfirmationDialog 
        isOpen={dialogState.isOpen}
        onClose={() => setDialogState(prev => ({ ...prev, isOpen: false }))}
        onConfirm={dialogState.action}
        title={dialogState.title}
        message={dialogState.message}
        type={dialogState.type}
        confirmText={dialogState.confirmText}
      />
      
      {rescheduleModal.isOpen && rescheduleModal.booking && (
        <RescheduleModal
          isOpen={rescheduleModal.isOpen}
          onClose={() => setRescheduleModal({ isOpen: false, booking: null })}
          onConfirm={submitReschedule}
          initialDate={new Date(rescheduleModal.booking.startTime).toISOString().split('T')[0]}
          initialStartTime={new Date(rescheduleModal.booking.startTime).toLocaleTimeString([], {hour12: false, hour:'2-digit', minute:'2-digit'})}
          initialEndTime={new Date(rescheduleModal.booking.endTime).toLocaleTimeString([], {hour12: false, hour:'2-digit', minute:'2-digit'})}
          isLoading={processingId === rescheduleModal.booking.id}
        />
      )}
    </div>
  );
}
