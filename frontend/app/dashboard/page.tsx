'use client';

import AdminView from '@/components/dashboard/admin-view';
import ModeratorView from '@/components/dashboard/moderator-view';
import ProfessionalView from '@/components/dashboard/professional-view';
import Navbar from '@/components/ui/navbar';
import { useAuth } from '@/contexts/auth-context';
import { ApplicationStatus, BookingStatus, Role, type Booking } from '@/lib/types';
import {
    ArrowRight,
    Briefcase,
    Clock,
    Plus,
    Video
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Suspense } from 'react';

function DashboardContent() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
      return;
    }
    
    // Redirect regular users to home, they have no dashboard access
    if (user && user.role === Role.USER) {
      router.push('/');
      return;
    }
    
    if (user) {
      // TODO: Fetch real bookings
      setIsLoading(false);
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) return null;

  // Regular User Dashboard View (My Consultations)
  const renderUserView = () => {
    const proStatus = user?.professionalProfile?.status;

    return (
      <div className="space-y-12">
        {/* Application Status Banners */}
        {proStatus === ApplicationStatus.PENDING && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 rounded-r-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <Clock className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  Your professional application is currently <strong>under review</strong> by our moderators. You will be notified once verified.
                </p>
              </div>
            </div>
          </div>
        )}
        {proStatus === ApplicationStatus.VERIFIED && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <Clock className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Your application has been <strong>verified</strong> and is awaiting final approval from the administrator.
                </p>
              </div>
            </div>
          </div>
        )}
        {proStatus === ApplicationStatus.REJECTED && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-r-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <Clock className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  Your application was rejected. Reason: {user?.professionalProfile?.rejectionReason || 'Not specified'}.
                </p>
                <div className="mt-2">
                    <Link href="/become-a-pro" className="text-sm font-medium text-red-700 hover:text-red-600 underline">
                        Update and Re-apply
                    </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">My Consultations</h1>
          <div className="flex gap-4">
             {!proStatus && (
                 <Link 
                   href="/become-a-pro"
                   className="bg-white text-slate-900 border border-slate-200 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-sm active:scale-95 inline-flex items-center gap-2 hover:bg-slate-50 transition-colors"
                 >
                   <Briefcase className="w-4 h-4" />
                   Become a Pro
                 </Link>
             )}
             <Link 
               href="/professionals"
               className="bg-primary-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl active:scale-95 inline-flex items-center gap-2 hover:bg-primary-500 transition-colors"
             >
               <Plus className="w-4 h-4" />
               Find Expert
             </Link>
          </div>
        </div>
      
        <div className="space-y-4">
        {bookings.length > 0 ? bookings.map(b => (
          <div key={b.id} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] flex items-center justify-between border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-6">
               <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-3xl flex flex-col items-center justify-center border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-black uppercase text-slate-400">{new Date(b.startTime).toLocaleString('default', { month: 'short' })}</span>
                  <span className="text-xl font-black text-slate-900 dark:text-white">{new Date(b.startTime).getDate()}</span>
               </div>
               <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">{b.professionalId}</h3>
                  <p className="text-xs text-slate-500 mt-1 font-medium"><Clock className="inline w-3 h-3" /> {new Date(b.startTime).toLocaleTimeString()} • ৳{b.price.toLocaleString()}</p>
               </div>
            </div>
            <div className="flex items-center gap-4">
               <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border bg-primary-500/10 text-primary-500 border-primary-500/20">
                  {b.status}
               </span>
               {b.status === BookingStatus.CONFIRMED && (
                 <Link 
                   href={`/meeting/${b.professionalId}`}
                   className="bg-primary-600 hover:bg-primary-500 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all inline-flex items-center gap-2 shadow-lg shadow-primary-600/20"
                 >
                   <Video className="w-4 h-4" />
                   Join Room
                 </Link>
               )}
            </div>
          </div>
        )) : (
          <div className="py-32 text-center bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800">
             <Video className="w-12 h-12 text-slate-300 mx-auto mb-4" />
             <p className="text-slate-500 font-black uppercase tracking-widest text-sm mb-6">No scheduled sessions</p>
             <Link 
               href="/professionals"
               className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white font-black px-8 py-4 rounded-xl text-xs uppercase tracking-widest transition-all"
             >
               Find a Professional <ArrowRight className="w-4 h-4" />
             </Link>
          </div>
        )}
      </div>
    </div>
  );

  };

  const renderDashboardContent = () => {
    switch (user.role) {
      case Role.ADMIN:
        return <AdminView />;
      case Role.MODERATOR:
        return <ModeratorView />;
      case Role.PROFESSIONAL:
        return <ProfessionalView />;
      default:
        return renderUserView();
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 pt-32 pb-20">
        {isLoading ? (
          <div className="py-20 text-center">
            <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : (
          renderDashboardContent()
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
       <div className="min-h-screen flex items-center justify-center">
         <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
       </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
