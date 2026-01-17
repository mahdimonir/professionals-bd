import { DisputeService } from '@/lib/services/dispute-service';
import { AlertTriangle, Calendar, CheckCircle2, Clock, CreditCard, Download, Loader2, User as UserIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import ConfirmationDialog from '../ui/confirmation-dialog';

interface BookingsTabProps {
  dataLoading: boolean;
  bookings: any[];
  downloadingBookings: boolean;
  setDownloadType: (type: 'bookings' | 'payments') => void;
  setShowDownloadModal: (show: boolean) => void;
}

export function BookingsTab({ 
  dataLoading, 
  bookings, 
  downloadingBookings, 
  setDownloadType, 
  setShowDownloadModal 
}: BookingsTabProps) {
  const router = useRouter();
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

  const handleReportIssue = (bookingId: string) => {
      setDialogState({
          isOpen: true,
          title: 'Report Issue',
          message: 'Are you sure you want to report an issue with this session? This will open a dispute case.',
          confirmText: 'Report Issue',
          type: 'warning',
          action: async () => {
              const reason = window.prompt("Please provide details about the issue (e.g., Professional didn't show up):");
              if (!reason) return;
              
              setDialogState(prev => ({ ...prev, isOpen: false }));
              try {
                  await DisputeService.createDispute(bookingId, `User Reported Issue: ${reason}`, undefined, 'USER_REPORT');
                  toast.success('Issue reported successfully. Support team will review.');
              } catch (error) {
                  toast.error('Failed to report issue');
              }
          }
      });
  };

  return (
    <div className="animate-in fade-in duration-300">
      <div className='mb-6'>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Bookings</h2>
        <p className="text-sm text-slate-500">Your booking history</p>
      </div>
      {dataLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-12 h-12 animate-spin text-slate-400" /></div>
      ) : bookings.length > 0 ? (
        <>
          {/* Download Header */}
          <div className="flex justify-between items-center mb-4 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-slate-900 dark:text-white">My Bookings</h3>
            <button
              onClick={() => { setDownloadType('bookings'); setShowDownloadModal(true); }}
              disabled={downloadingBookings}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-bold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {downloadingBookings ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Download
            </button>
          </div>

          <div className="space-y-3">
          {bookings.map((booking: any) => (
            <div key={booking.id} className="p-5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <UserIcon className="w-4 h-4 text-primary-500" />
                    <p className="font-bold text-slate-900 dark:text-white">{booking.professional?.name || booking.professionalName || 'Professional'}</p>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(booking.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(booking.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      {' – '}
                      {new Date(booking.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
                <span className={`shrink-0 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wide ${
                  booking.status === 'CONFIRMED' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800' :
                  booking.status === 'PENDING' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800' :
                  booking.status === 'COMPLETED' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800' :
                  booking.status === 'CANCELLED' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800' :
                  'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                }`}>
                  {booking.status === 'CONFIRMED' && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
                  {booking.status}
                </span>
              </div>
              
              {/* Action Buttons for Confirmed Bookings */}
              {booking.status === 'CONFIRMED' && (
                <div className="mb-3 flex gap-2">
                   {(() => {
                      const now = new Date();
                      const start = new Date(booking.startTime);
                      const diffInMinutes = (start.getTime() - now.getTime()) / 60000;
                      const isJoinable = diffInMinutes <= 5; 
                      
                      const isLate = (now.getTime() - start.getTime()) > (15 * 60000); // 15 mins after start

                      return (
                        <>
                           <button 
                             onClick={() => window.open(`/meeting/${booking.id}`, '_blank')}
                             disabled={!isJoinable}
                             className="flex-1 bg-primary-600 text-white px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wide hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                             title={!isJoinable ? `You can join 5 minutes before the session` : 'Join Video Call'}
                           >
                             <div className={`w-2 h-2 rounded-full ${isJoinable ? 'bg-green-400 animate-pulse' : 'bg-slate-400'}`} />
                             {isJoinable ? 'Join Now' : `Starts ${start.toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'})}`}
                           </button>
                           
                           <button
                              onClick={() => {
                                navigator.clipboard.writeText(`${window.location.origin}/meeting/${booking.id}`);
                                toast.success("Meeting link copied!");
                              }}
                              className="px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-slate-600 dark:text-slate-300 transition-colors"
                              title="Copy Meeting Link"
                           >
                              <div className="w-4 h-4"><CheckCircle2 className="w-4 h-4" /></div>
                           </button>

                           {isLate && (
                             <button
                                onClick={() => handleReportIssue(booking.id)}
                                className="flex-none bg-red-50 text-red-600 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wide hover:bg-red-100 border border-red-200 flex items-center gap-2"
                                title="Professional hasn't joined?"
                             >
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Report Issue
                             </button>
                           )}
                        </>
                      );
                   })()}
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-slate-400" />
                  <span className="font-bold text-slate-900 dark:text-white">৳{booking.price?.toLocaleString()}</span>
                </div>
                {booking.notes && (
                  <p className="text-[10px] text-slate-500 italic truncate max-w-[200px]">{booking.notes}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </>
      ) : (
        <div className="py-12 text-center">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="font-bold text-slate-900 dark:text-white mb-2">No Bookings Yet</h3>
          <p className="text-sm text-slate-500 mb-4">Your consultations will appear here</p>
          <button onClick={() => router.push('/professionals')} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary-700 transition-colors">
            Book a Consultation
          </button>
        </div>
      )}
      
      <ConfirmationDialog 
        isOpen={dialogState.isOpen}
        onClose={() => setDialogState(prev => ({ ...prev, isOpen: false }))}
        onConfirm={dialogState.action}
        title={dialogState.title}
        message={dialogState.message}
        type={dialogState.type}
        confirmText={dialogState.confirmText}
      />
    </div>
  );
}
