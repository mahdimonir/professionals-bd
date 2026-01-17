import { Calendar, CheckCircle2, CreditCard, Loader2, User as UserIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface OverviewTabProps {
  stats: { totalBookings: number; totalSpent: number };
  dataLoading: boolean;
  bookings: any[];
  payments: any[];
  user: any;
}

export function OverviewTab({ stats, dataLoading, bookings, payments, user }: OverviewTabProps) {
  const router = useRouter();

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Overview</h2>
        <p className="text-sm text-slate-500">Your profile overview</p>
      </div>
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-primary-500" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Bookings</p>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{dataLoading ? '...' : stats.totalBookings}</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Completed</p>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            {dataLoading ? '...' : bookings.filter(b => b.status === 'COMPLETED').length}
          </p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="w-4 h-4 text-indigo-500" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Spent</p>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{dataLoading ? '...' : `৳${stats.totalSpent.toLocaleString()}`}</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <UserIcon className="w-4 h-4 text-purple-500" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Member Since</p>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            {user.memberSince ? new Date(user.memberSince).getFullYear() : new Date().getFullYear()}
          </p>
        </div>
      </div>

      {/* Account Status */}
      <div className="bg-gradient-to-br from-primary-50 to-indigo-50 dark:from-primary-900/20 dark:to-indigo-900/20 p-4 rounded-xl border border-primary-200 dark:border-primary-800">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-2">Account Status</h4>
            <div className="flex flex-wrap gap-2">
              <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                user.isVerified
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                  : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800'
              }`}>
                {user.isVerified ? '✓ Verified' : '⏳ Unverified'}
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {payments.filter(p => p.status === 'PENDING').length} Pending Payments
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Bookings Table */}
      <div className="bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h4 className="font-bold text-sm text-slate-900 dark:text-white">Recent Bookings</h4>
        </div>
        {dataLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
        ) : bookings.length > 0 ? (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full">
              <thead>
                <tr className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                  <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Professional</th>
                  <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-black text-slate-500 uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {bookings.slice(0, 5).map((booking: any) => (
                  <tr key={booking.id} className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <UserIcon className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-medium text-slate-900 dark:text-white">
                          {booking.professional?.name || booking.professionalName || 'Professional'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                      {new Date(booking.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        booking.status === 'CONFIRMED' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                        booking.status === 'PENDING' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                        booking.status === 'COMPLETED' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                        'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-slate-900 dark:text-white">
                      ৳{booking.price?.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 px-4">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm mb-3">No bookings yet</p>
            <button onClick={() => router.push('/professionals')} className="text-primary-600 font-bold text-sm hover:underline">
              Find an Expert
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
