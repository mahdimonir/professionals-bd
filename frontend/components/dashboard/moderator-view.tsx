'use client';

import ConfirmationDialog from '@/components/ui/confirmation-dialog';
import { CATEGORIES } from '@/lib/constants';
import {
  AdminBooking, AdminPayment, AdminProfessional, AdminService,
  AdminUser, AdminWithdrawRequest
} from '@/lib/services/admin-service';
import { Dispute, DisputeService } from '@/lib/services/dispute-service';
import { MeetingService } from '@/lib/services/meeting-service';
import {
  AlertTriangle, Banknote, BookOpen, CheckCircle,
  CreditCard,
  ExternalLink,
  LayoutDashboard, Loader2,
  Search,
  UserCheck, Users, Video, XCircle
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

type TabType = 'overview' | 'applications' | 'disputes' | 'users' | 'bookings' | 'payments' | 'withdrawals';

export default function ModeratorView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>((searchParams.get('tab') as TabType) || 'overview');

  const handleTabChange = (tab: TabType) => {
      setActiveTab(tab);
      router.push(`/dashboard?tab=${tab}`, { scroll: false });
  };
  
  // Sync state if URL changes externally
  useEffect(() => {
    const tab = searchParams.get('tab') as TabType;
    if (tab && tab !== activeTab) {
        setActiveTab(tab);
    }
  }, [searchParams]);
  const [isLoading, setIsLoading] = useState(false);
  const [creatingMeeting, setCreatingMeeting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Data states
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [professionals, setProfessionals] = useState<AdminProfessional[]>([]);
  const [pendingApps, setPendingApps] = useState<AdminProfessional[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [withdrawals, setWithdrawals] = useState<AdminWithdrawRequest[]>([]);

  // Stats
  const [stats, setStats] = useState({
    pendingApps: 0,
    openDisputes: 0,
    totalUsers: 0,
  });

  // Action states
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [pendingVerificationId, setPendingVerificationId] = useState<string | null>(null);
  
  // Input Dialog State (Simulated with standard state for now to match AdminView pattern or simplify)
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

  // Fetch functions
  const fetchOverview = useCallback(async () => {
    setIsLoading(true);
    try {
      const [pending, disputesRes, usersRes] = await Promise.all([
        AdminService.getPendingProfessionals(),
        DisputeService.getAllDisputes('OPEN'),
        AdminService.getAllUsers({ limit: 1 }) // Just to get count if needed, or use separate stats endpoint if available. AdminService.getAllUsers returns pagination total.
      ]);
      
      setPendingApps(pending.data.professionals);
      setDisputes(disputesRes.data);
      
      setStats({
        pendingApps: pending.data.professionals.length,
        openDisputes: disputesRes.data.length,
        totalUsers: usersRes.data.pagination.total,
      });
    } catch (error) { console.error(error); toast.error('Failed to load overview data'); }
    finally { setIsLoading(false); }
  }, []);

  const fetchApplications = useCallback(async () => {
    setIsLoading(true);
    try {
      // Moderator mainly needs pending professionals to verify, but might want to see all
      const [pending, verified] = await Promise.all([
        AdminService.getPendingProfessionals(),
        AdminService.getVerifiedProfessionals() // Read-only for moderator usually, or just to see list
      ]);
      // Combine or just show pending for main action
      setProfessionals([...pending.data.professionals, ...verified.data.professionals]); 
      setPendingApps(pending.data.professionals);
    } catch (error) { console.error(error); }
    finally { setIsLoading(false); }
  }, []);

  const fetchDisputes = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await DisputeService.getAllDisputes(); // All disputes
      setDisputes(res.data);
    } catch (error) { console.error(error); }
    finally { setIsLoading(false); }
  }, []);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await AdminService.getAllUsers({ search: searchQuery });
      setUsers(res.data.users);
    } catch (error) { console.error(error); }
    finally { setIsLoading(false); }
  }, [searchQuery]);

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    try {
        const res = await AdminService.getAllBookings({ limit: 50 });
        setBookings(res.data.bookings);
    } catch (error) { console.error(error); }
    finally { setIsLoading(false); }
  }, []);

    const fetchPayments = useCallback(async () => {
    setIsLoading(true);
    try {
        const res = await AdminService.getAllPayments({ limit: 50 });
        setPayments(res.data.payments);
    } catch (error) { console.error(error); }
    finally { setIsLoading(false); }
  }, []);

    const fetchWithdrawals = useCallback(async () => {
    setIsLoading(true);
    try {
        const res = await AdminService.getAllWithdrawRequests({ limit: 50 });
        setWithdrawals(res.data.withdraws);
    } catch (error) { console.error(error); }
    finally { setIsLoading(false); }
  }, []);


  // Initial load
  useEffect(() => {
    switch (activeTab) {
      case 'overview': fetchOverview(); break;
      case 'applications': fetchApplications(); break;
      case 'disputes': fetchDisputes(); break;
      case 'users': fetchUsers(); break;
      case 'bookings': fetchBookings(); break;
      case 'payments': fetchPayments(); break;
      case 'withdrawals': fetchWithdrawals(); break;
    }
  }, [activeTab, fetchOverview, fetchApplications, fetchDisputes, fetchUsers, fetchBookings, fetchPayments, fetchWithdrawals]);


  // Actions
  const handleCreateMeeting = async () => {
    setCreatingMeeting(true);
    try {
      const response = await MeetingService.createAdHocMeeting('Moderator Session');
      if (response.success) {
        router.push(`/meeting/${response.data.callId}`);
      }
    } catch (error) {
      toast.error('Failed to create meeting');
    } finally {
      setCreatingMeeting(false);
    }
  };

  const handleVerifyPro = (id: string) => {
    setPendingVerificationId(id);
    setShowCategoryDialog(true);
  };

  const confirmVerifyPro = async () => {
    if (!selectedCategory || !pendingVerificationId) return;
    try {
      await AdminService.verifyProfessional(pendingVerificationId, true, selectedCategory);
      toast.success('Professional Verified');
      setShowCategoryDialog(false);
      fetchApplications(); // Refresh list
    } catch (error) {
      toast.error('Failed to verify professional');
    }
  };

  const handleRejectPro = (id: string) => {
    setDialogState({
      isOpen: true,
      title: 'Reject Application',
      message: 'Are you sure you want to reject this application?',
      confirmText: 'Reject',
      type: 'danger',
      action: async () => {
        const reason = window.prompt("Enter rejection reason:");
        if (!reason) return;
        try {
           await AdminService.rejectUnverifiedProfessional(id, reason);
           toast.success('Application rejected');
           setDialogState(prev => ({ ...prev, isOpen: false }));
           fetchApplications();
        } catch (error) {
           toast.error('Failed to reject application');
        }
      }
    });
  };

  const handleBanUser = (id: string, name: string) => {
     setDialogState({
      isOpen: true,
      title: `Ban User "${name}"`,
      message: 'Are you sure you want to ban this user?',
      confirmText: 'Ban User',
      type: 'danger',
      action: async () => {
        const reason = window.prompt("Enter ban reason:", "Policy Violation");
        if (!reason) return;
        try {
           await AdminService.banUser(id, reason);
           toast.success('User banned');
           setDialogState(prev => ({ ...prev, isOpen: false }));
           fetchUsers();
        } catch (error) {
           toast.error('Failed to ban user');
        }
      }
    });
  };

  const handleUnbanUser = (id: string, name: string) => {
    setDialogState({
        isOpen: true,
        title: `Unban User "${name}"`,
        message: 'Are you sure you want to unban this user?',
        confirmText: 'Unban',
        type: 'info',
        action: async () => {
          try {
             await AdminService.unbanUser(id);
             toast.success('User unbanned');
             setDialogState(prev => ({ ...prev, isOpen: false }));
             fetchUsers();
          } catch (error) {
             toast.error('Failed to unban user');
          }
        }
      });
  };

  const handleConfirmReschedule = (disputeId: string, approve: boolean) => {
      setDialogState({
          isOpen: true,
          title: approve ? 'Approve Reschedule' : 'Reject Reschedule',
          message: approve 
              ? 'This will update the booking time to the proposed slot and notify both parties.' 
              : 'This will reject the reschedule request. The booking will remain at the original time.',
          confirmText: approve ? 'Approve & Update' : 'Reject Request',
          type: approve ? 'info' : 'warning',
          action: async () => {
              try {
                  await DisputeService.resolveRescheduleDispute(disputeId, approve);
                  toast.success(approve ? 'Reschedule Approved' : 'Request Rejected');
                  setDialogState(prev => ({ ...prev, isOpen: false }));
                  fetchDisputes();
              } catch (error) {
                  toast.error('Failed to process request');
              }
          }
      });
  };

  const handleResolveDispute = (id: string) => {
      setDialogState({
        isOpen: true,
        title: 'Resolve Dispute',
        message: 'Mark this dispute as resolved? Typically involves refunding or dismissing the claim.',
        confirmText: 'Resolve',
        type: 'info',
        action: async () => {
            const note = window.prompt("Resolution Note:", "Resolved after investigation.");
            if (!note) return;
            try {
                await DisputeService.resolveDispute(id, 'RESOLVED', note);
                toast.success('Dispute resolved');
                setDialogState(prev => ({ ...prev, isOpen: false }));
                fetchDisputes();
            } catch (error) {
                toast.error('Failed to resolve dispute');
            }
        }
      });
  };

  // Components
  const StatusBadge = ({ status }: { status: string }) => {
    const colors: Record<string, string> = {
      APPROVED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      VERIFIED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      PENDING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      // Disputes
      OPEN: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      RESOLVED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      // Users
      USER: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
      PROFESSIONAL: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400',
      MODERATOR: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    };
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${colors[status] || 'bg-slate-100 text-slate-700'}`}>
        {status}
      </span>
    );
  };

  const tabs: { key: TabType; label: string; icon: React.ElementType; badge?: number }[] = [
    { key: 'overview', label: 'Overview', icon: LayoutDashboard },
    { key: 'applications', label: 'Applications', icon: UserCheck, badge: stats.pendingApps || undefined },
    { key: 'disputes', label: 'Disputes', icon: AlertTriangle, badge: stats.openDisputes || undefined },
    { key: 'users', label: 'Users', icon: Users },
    { key: 'bookings', label: 'Bookings', icon: BookOpen },
    { key: 'payments', label: 'Payments', icon: CreditCard },
    { key: 'withdrawals', label: 'Withdrawals', icon: Banknote },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Moderator Panel</h1>
          <p className="text-slate-500 text-sm">Review applications, resolve disputes, and manage users.</p>
        </div>
        <div className="flex gap-3">
             <button 
                onClick={handleCreateMeeting}
                disabled={creatingMeeting}
                className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wide flex items-center gap-2 disabled:opacity-50"
             >
                {creatingMeeting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
                Create Meeting
             </button>
        </div>
      </div>

       {/* Tabs */}
       <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase whitespace-nowrap transition-all shrink-0 ${
                activeTab === tab.key 
                  ? 'bg-primary-600 text-white shadow-lg' 
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.badge && <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full min-w-[20px] text-center">{tab.badge}</span>}
            </button>
          ))}
        </div>

      {/* Content Area */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 min-h-[400px]">
         {isLoading ? (
             <div className="flex items-center justify-center py-20">
                 <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
             </div>
         ) : (
             <>
                {/* OVERVIEW */}
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-yellow-50 dark:bg-yellow-900/10 p-6 rounded-2xl border border-yellow-100 dark:border-yellow-900/20">
                            <UserCheck className="w-8 h-8 text-yellow-500 mb-4" />
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white">{stats.pendingApps}</h3>
                            <p className="text-xs font-bold text-yellow-700 dark:text-yellow-500 uppercase">Pending Applications</p>
                            <button onClick={() => handleTabChange('applications')} className="mt-4 text-xs font-bold text-yellow-700 hover:underline">Review Now →</button>
                        </div>
                        <div className="bg-orange-50 dark:bg-orange-900/10 p-6 rounded-2xl border border-orange-100 dark:border-orange-900/20">
                            <AlertTriangle className="w-8 h-8 text-orange-500 mb-4" />
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white">{stats.openDisputes}</h3>
                            <p className="text-xs font-bold text-orange-700 dark:text-orange-500 uppercase">Open Disputes</p>
                            <button onClick={() => handleTabChange('disputes')} className="mt-4 text-xs font-bold text-orange-700 hover:underline">Resolve Now →</button>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/20">
                            <Users className="w-8 h-8 text-blue-500 mb-4" />
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white">{stats.totalUsers}</h3>
                            <p className="text-xs font-bold text-blue-700 dark:text-blue-500 uppercase">Total Users</p>
                        </div>
                    </div>
                )}

                {/* APPLICATIONS */}
                {activeTab === 'applications' && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <UserCheck className="w-5 h-5 text-primary-500" /> Professional Applications
                    </h2>
                    <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] font-bold text-slate-400 uppercase">
                                <tr>
                                    <th className="px-4 py-3 rounded-l-lg">Applicant</th>
                                    <th className="px-4 py-3">Details</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3 rounded-r-lg text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {professionals.map(p => (
                                    <tr key={p.id}>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-500">
                                                    {p.user?.name?.[0] || 'U'}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm text-slate-900 dark:text-white">{p.user?.name}</p>
                                                    <p className="text-xs text-slate-500">{p.user?.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{p.title}</p>
                                            <div className="flex gap-2 mt-1">
                                                {p.linkedinUrl && <a href={p.linkedinUrl} target="_blank" className="text-[10px] text-blue-600 hover:underline flex items-center gap-1"><ExternalLink size={10} /> LinkedIn</a>}
                                                {p.cvUrl && <a href={p.cvUrl} target="_blank" className="text-[10px] text-orange-600 hover:underline flex items-center gap-1"><ExternalLink size={10} /> CV</a>}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4"><StatusBadge status={p.status} /></td>
                                        <td className="px-4 py-4 text-right">
                                            {p.status === 'PENDING' && (
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => handleVerifyPro(p.userId)} className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-lg hover:bg-green-100">Verify</button>
                                                    <button onClick={() => handleRejectPro(p.userId)} className="text-xs font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100">Reject</button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {professionals.length === 0 && <tr><td colSpan={4} className="text-center py-8 text-slate-400 text-sm">No applications found</td></tr>}
                            </tbody>
                        </table>
                    </div>
                  </div>
                )}

                {/* DISPUTES */}
                {activeTab === 'disputes' && (
                     <div className="space-y-4">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-orange-500" /> Dispute Management
                        </h2>
                        <div className="overflow-x-auto no-scrollbar">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] font-bold text-slate-400 uppercase">
                                    <tr>
                                        <th className="px-4 py-3 rounded-l-lg">Dispute ID</th>
                                        <th className="px-4 py-3">Description</th>
                                        <th className="px-4 py-3">Booking</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3 rounded-r-lg text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {disputes.map(d => (
                                        <tr key={d.id}>
                                            <td className="px-4 py-4 text-xs font-mono text-slate-500">#{d.id.slice(0,8)}</td>
                                            <td className="px-4 py-4">
                                                <p className="text-sm text-slate-900 dark:text-slate-200">{d.description}</p>
                                                {d.type === 'RESCHEDULE_REQUEST' && d.metadata?.newStart && (
                                                    <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-xs">
                                                        <span className="font-bold text-blue-700 dark:text-blue-400">Proposed New Time:</span>
                                                        <div className="text-slate-600 dark:text-slate-300">
                                                            {new Date(d.metadata.newStart).toLocaleString()}
                                                        </div>
                                                    </div>
                                                )}
                                                {d.statusNote && <p className="text-xs text-slate-500 italic mt-1">Note: {d.statusNote}</p>}
                                            </td>
                                            <td className="px-4 py-4 text-xs">
                                                {d.booking ? (
                                                    <div>
                                                        <p className="font-bold">Original: {new Date(d.booking.startTime).toLocaleDateString()}</p>
                                                        <p className="text-[10px] text-slate-500">{new Date(d.booking.startTime).toLocaleTimeString()}</p>
                                                        <p className="mt-1">Pro: {d.booking.professional?.name}</p>
                                                    </div>
                                                ) : 'N/A'}
                                            </td>
                                            <td className="px-4 py-4"><StatusBadge status={d.status} /></td>
                                            <td className="px-4 py-4 text-right">
                                                {d.status === 'OPEN' && (
                                                    <div className="flex justify-end gap-2">
                                                        {d.type === 'RESCHEDULE_REQUEST' ? (
                                                            <>
                                                                <button 
                                                                    onClick={() => handleConfirmReschedule(d.id, true)} 
                                                                    className="text-xs font-bold text-white bg-green-600 px-3 py-1.5 rounded-lg hover:bg-green-700"
                                                                >
                                                                    Approve
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleConfirmReschedule(d.id, false)} 
                                                                    className="text-xs font-bold text-red-600 bg-red-50 border border-red-100 px-3 py-1.5 rounded-lg hover:bg-red-100"
                                                                >
                                                                    Reject
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <button onClick={() => handleResolveDispute(d.id)} className="text-xs font-bold text-white bg-primary-600 px-3 py-1.5 rounded-lg hover:bg-primary-700">Resolve</button>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {disputes.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-slate-400 text-sm">No disputes found</td></tr>}
                                </tbody>
                            </table>
                        </div>
                     </div>
                )}

                {/* USERS */}
                {activeTab === 'users' && (
                     <div className="space-y-4">
                         <div className="flex justify-between">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Users className="w-5 h-5 text-blue-500" /> User Directory
                            </h2>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input 
                                    type="text" 
                                    placeholder="Search users..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 focus:ring-1 ring-primary-500 outline-none"
                                />
                            </div>
                         </div>
                        <div className="overflow-x-auto no-scrollbar">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] font-bold text-slate-400 uppercase">
                                    <tr>
                                        <th className="px-4 py-3 rounded-l-lg">User</th>
                                        <th className="px-4 py-3">Role</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3 rounded-r-lg text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {users.map(u => (
                                        <tr key={u.id}>
                                            <td className="px-4 py-4">
                                                <p className="font-bold text-sm text-slate-900 dark:text-white">{u.name}</p>
                                                <p className="text-xs text-slate-500">{u.email}</p>
                                            </td>
                                            <td className="px-4 py-4"><StatusBadge status={u.role} /></td>
                                            <td className="px-4 py-4">
                                                {u.isSuspended ? (
                                                    <span className="text-red-600 font-bold text-xs flex items-center gap-1"><XCircle size={12}/> Suspended</span>
                                                ) : (
                                                    <span className="text-green-600 font-bold text-xs flex items-center gap-1"><CheckCircle size={12}/> Active</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                {u.role !== 'ADMIN' && (
                                                    u.isSuspended ? (
                                                        <button onClick={() => handleUnbanUser(u.id, u.name)} className="text-xs font-bold text-green-600 hover:underline">Unban</button>
                                                    ) : (
                                                        <button onClick={() => handleBanUser(u.id, u.name)} className="text-xs font-bold text-red-600 hover:underline">Ban</button>
                                                    )
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                     </div>
                )}

                {/* READ ONLY TABS (Bookings, Payments, Withdrawals) */}
                {['bookings', 'payments', 'withdrawals'].includes(activeTab) && (
                    <div className="space-y-4">
                         <h2 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                            {activeTab} <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded ml-2">Read-Only View</span>
                        </h2>
                        <div className="overflow-x-auto no-scrollbar">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] font-bold text-slate-400 uppercase">
                                    <tr>
                                        {activeTab === 'bookings' && <><th className="px-4 py-3">Time</th><th className="px-4 py-3">Booked By</th><th className="px-4 py-3">Professional</th><th className="px-4 py-3">Status</th></>}
                                        {activeTab === 'payments' && <><th className="px-4 py-3">Date</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Method</th><th className="px-4 py-3">Status</th></>}
                                        {activeTab === 'withdrawals' && <><th className="px-4 py-3">Date</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Method</th><th className="px-4 py-3">Status</th></>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {activeTab === 'bookings' && bookings.map(b => (
                                        <tr key={b.id}>
                                            <td className="px-4 py-3 text-xs">{new Date(b.startTime).toLocaleDateString()}</td>
                                            <td className="px-4 py-3 text-xs font-mono">{b.userId.slice(0,8)}...</td>
                                            <td className="px-4 py-3 text-xs font-mono">{b.professionalId.slice(0,8)}...</td>
                                            <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                                        </tr>
                                    ))}
                                    {activeTab === 'payments' && payments.map(p => (
                                        <tr key={p.id}>
                                            <td className="px-4 py-3 text-xs">{new Date(p.createdAt).toLocaleDateString()}</td>
                                            <td className="px-4 py-3 text-xs font-bold">৳{p.amount}</td>
                                            <td className="px-4 py-3 text-xs">{p.method}</td>
                                            <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                                        </tr>
                                    ))}
                                    {activeTab === 'withdrawals' && withdrawals.map(w => (
                                        <tr key={w.id}>
                                            <td className="px-4 py-3 text-xs">{new Date(w.requestedAt).toLocaleDateString()}</td>
                                            <td className="px-4 py-3 text-xs font-bold">৳{w.amount}</td>
                                            <td className="px-4 py-3 text-xs">{w.method}</td>
                                            <td className="px-4 py-3"><StatusBadge status={w.status} /></td>
                                        </tr>
                                    ))}
                                    {((activeTab === 'bookings' && bookings.length === 0) || (activeTab === 'payments' && payments.length === 0) || (activeTab === 'withdrawals' && withdrawals.length === 0)) && (
                                        <tr><td colSpan={4} className="text-center py-8 text-slate-400 text-sm">No records found</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
             </>
         )}
      </div>

       {/* Category Selection Dialog */}
       {showCategoryDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4 uppercase tracking-tighter">
              Verify Category
            </h3>
            <p className="text-slate-500 text-sm mb-6">
              Confirm the professional&apos;s primary category.
            </p>
            
            <div className="space-y-2 mb-6 max-h-64 overflow-y-auto no-scrollbar">
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-all font-bold text-sm ${
                    selectedCategory === category
                      ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 text-primary-600'
                      : 'border-slate-200 dark:border-slate-800 hover:border-primary-300 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCategoryDialog(false);
                  setPendingVerificationId(null);
                  setSelectedCategory('');
                }}
                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmVerifyPro}
                disabled={!selectedCategory}
                className="flex-1 px-4 py-3 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm Verify
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
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
