import { Calendar, Clock, X } from 'lucide-react';
import { useState } from 'react';

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (date: string, startTime: string, endTime: string) => void;
  initialDate: string;
  initialStartTime: string;
  initialEndTime: string;
  isLoading?: boolean;
}

export default function RescheduleModal({
  isOpen,
  onClose,
  onConfirm,
  initialDate,
  initialStartTime,
  initialEndTime,
  isLoading = false
}: RescheduleModalProps) {
  const [date, setDate] = useState(initialDate);
  const [startTime, setStartTime] = useState(initialStartTime);
  const [endTime, setEndTime] = useState(initialEndTime);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <div>
             <h3 className="text-lg font-black text-slate-900 dark:text-white">Reschedule Session</h3>
             <p className="text-sm text-slate-500">Propose a new time for this booking.</p>
          </div>
          <button onClick={onClose} disabled={isLoading} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 p-4 rounded-xl text-sm mb-4">
            This request will be sent to a moderator for approval. Please ensure you have discussed this with the client.
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">New Date</label>
            <div className="relative">
              <input 
                 type="date" 
                 value={date} 
                 onChange={(e) => setDate(e.target.value)}
                 className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
               <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Start Time</label>
                <div className="relative">
                  <input 
                     type="time" 
                     value={startTime} 
                     onChange={(e) => setStartTime(e.target.value)}
                     className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
            </div>
            <div>
               <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">End Time</label>
                <div className="relative">
                  <input 
                     type="time" 
                     value={endTime} 
                     onChange={(e) => setEndTime(e.target.value)}
                     className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex gap-3">
          <button 
            type="button" 
            onClick={onClose} 
            disabled={isLoading} 
            className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="button" 
            onClick={() => onConfirm(date, startTime, endTime)} 
            disabled={isLoading || !date || !startTime || !endTime} 
            className="flex-1 px-4 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Submitting...' : 'Confirm Request'}
          </button>
        </div>
      </div>
    </div>
  );
}
