'use client';

import ConfirmationDialog from '@/components/ui/confirmation-dialog';
import {
  AdminBooking, AdminPayment, AdminProfessional, AdminService,
  AdminUser, AdminWithdrawRequest, AuditLog
} from '@/lib/services/admin-service';
import { MeetingService } from '@/lib/services/meeting-service';
import {
  Activity, Banknote, BookOpen, CheckCircle, CreditCard, DollarSign,
  FileText, Loader2,
  Plus, RefreshCw, Search, Shield,
  TrendingUp, UserCheck, Users, Video, X, XCircle
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell,
  Legend,
  Pie, PieChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis
} from 'recharts';
import { toast } from 'sonner';

type TabType = 'overview' | 'users' | 'professionals' | 'bookings' | 'payments' | 'withdrawals' | 'reports' | 'audit';

export default function AdminView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>((searchParams.get('tab') as TabType) || 'overview');
  
  const handleTabChange = (tab: TabType) => {
      setActiveTab(tab);
      router.push(`/dashboard?tab=${tab}`, { scroll: false });
  };
  
  // Sync state if URL changes externally (e.g. back button)
  useEffect(() => {
      const tab = searchParams.get('tab') as TabType;
      if (tab && tab !== activeTab) {
          setActiveTab(tab);
      }
  }, [searchParams]);
  const [isLoading, setIsLoading] = useState(false);
  const [creatingMeeting, setCreatingMeeting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Data states
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [professionals, setProfessionals] = useState<AdminProfessional[]>([]);
  const [pendingProfessionals, setPendingProfessionals] = useState<AdminProfessional[]>([]);
  const [verifiedProfessionals, setVerifiedProfessionals] = useState<AdminProfessional[]>([]);
  const [draftProfessionals, setDraftProfessionals] = useState<AdminProfessional[]>([]);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [withdrawals, setWithdrawals] = useState<AdminWithdrawRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingApprovals: 0,
    totalProfessionals: 0,
    totalRevenue: 0,
  });

  // Filters
  const [proStatusFilter, setProStatusFilter] = useState<string>('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('');

  // Input dialog state (for rejection reasons, etc.)
  const [inputDialogState, setInputDialogState] = useState<{
    isOpen: boolean;
    title: string;
    placeholder: string;
    defaultValue: string;
    onSubmit: (value: string) => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    placeholder: '',
    defaultValue: '',
    onSubmit: async () => {},
  });
  // Report Controls State
  const [reportType, setReportType] = useState<string>('revenue');
  const [reportFormat, setReportFormat] = useState<'pdf' | 'excel' | 'json'>('pdf');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  // Preview State
  const [previewData, setPreviewData] = useState<any>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const [inputValue, setInputValue] = useState('');

  // Confirmation dialog state
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => Promise<void>;
    type: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    action: async () => {},
    type: 'danger',
  });

  // Fetch functions
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await AdminService.getAllUsers({ search: searchQuery, role: userRoleFilter || undefined });
      setUsers(res.data.users);
      setStats(prev => ({ ...prev, totalUsers: res.data.pagination.total }));
    } catch (error) { console.error(error); }
    finally { setIsLoading(false); }
  }, [searchQuery, userRoleFilter]);

  const fetchProfessionals = useCallback(async () => {
    setIsLoading(true);
    try {
      const [all, pending, verified, drafts] = await Promise.all([
        AdminService.getAllProfessionals({ status: proStatusFilter || undefined, search: searchQuery }),
        AdminService.getPendingProfessionals(),
        AdminService.getVerifiedProfessionals(),
        AdminService.getDraftProfessionals(),
      ]);
      setProfessionals(all.data.professionals);
      setPendingProfessionals(pending.data.professionals);
      setVerifiedProfessionals(verified.data.professionals);
      setDraftProfessionals(drafts.data.drafts);
      setStats(prev => ({ 
        ...prev, 
        pendingApprovals: pending.data.professionals.length + verified.data.professionals.length,
        totalProfessionals: all.data.pagination.total 
      }));
    } catch (error) { console.error(error); }
    finally { setIsLoading(false); }
  }, [proStatusFilter, searchQuery]);

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await AdminService.getAllBookings({});
      setBookings(res.data.bookings);
    } catch (error) { console.error(error); }
    finally { setIsLoading(false); }
  }, []);

  const fetchPayments = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await AdminService.getAllPayments({});
      setPayments(res.data.payments);
    } catch (error) { console.error(error); }
    finally { setIsLoading(false); }
  }, []);

  const fetchWithdrawals = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await AdminService.getAllWithdrawRequests({});
      setWithdrawals(res.data.withdraws);
    } catch (error) { console.error(error); }
    finally { setIsLoading(false); }
  }, []);

  const fetchAuditLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await AdminService.getAuditLogsByAdmin({});
      setAuditLogs(res.data.logs);
    } catch (error) { console.error(error); }
    finally { setIsLoading(false); }
  }, []);

  // Fetch data when tab changes
  useEffect(() => {
    switch (activeTab) {
      case 'users': fetchUsers(); break;
      case 'professionals': fetchProfessionals(); break;
      case 'bookings': fetchBookings(); break;
      case 'payments': fetchPayments(); break;
      case 'withdrawals': fetchWithdrawals(); break;
      case 'audit': fetchAuditLogs(); break;
      case 'overview': fetchProfessionals(); fetchUsers(); break;
    }
  }, [activeTab, fetchUsers, fetchProfessionals, fetchBookings, fetchPayments, fetchWithdrawals, fetchAuditLogs]);

  // Fetch report preview
  useEffect(() => {
    if (activeTab === 'overview') {
      const loadPreview = async () => {
        setLoadingPreview(true);
        try {
          const res = await AdminService.getReportPreview(reportType, dateFrom, dateTo);
          if (res.success) {
             setPreviewData(res.data);
          } else {
             console.error("Preview load failed:", res);
             setPreviewData(null);
          }
        } catch (error: any) {
          console.error("Failed to load preview:", error);
          toast.error(`Failed to load report preview: ${error.response?.data?.message || error.message || 'Unknown error'}`);
          setPreviewData(null);
        } finally {
          setLoadingPreview(false);
        }
      };
      // Debounce slightly to avoid rapid calls on date change? Or just call directly.
      const timer = setTimeout(loadPreview, 500);
      return () => clearTimeout(timer);
    }
  }, [activeTab, reportType, dateFrom, dateTo]);

  // === ACTIONS WITH CONFIRMATION DIALOGS ===

  const handleApproveWithdraw = (id: string) => {
    setDialogState({
      isOpen: true,
      title: 'Approve Withdrawal',
      message: 'Are you sure you want to approve this withdrawal request? Funds will be transferred to the professional.',
      action: async () => {
        await AdminService.approveWithdrawByAdmin(id);
        fetchWithdrawals();
        setDialogState(prev => ({ ...prev, isOpen: false }));
      },
      type: 'info',
    });
  };

  const handleRejectWithdraw = (id: string) => {
    setInputDialogState({
      isOpen: true,
      title: 'Reject Withdrawal',
      placeholder: 'Enter rejection reason...',
      defaultValue: 'Invalid bank details',
      onSubmit: async (reason) => {
        await AdminService.rejectWithdrawByAdmin(id, reason);
        fetchWithdrawals();
        setInputDialogState(prev => ({ ...prev, isOpen: false }));
      },
    });
    setInputValue('Invalid bank details');
  };

  const handleApprovePro = (userId: string, userName: string) => {
    setDialogState({
      isOpen: true,
      title: 'Approve Professional',
      message: `Grant Professional status to "${userName}"? They will appear in the public directory and can receive bookings.`,
      action: async () => {
        await AdminService.approveProfessionalByAdmin(userId);
        fetchProfessionals();
        setDialogState(prev => ({ ...prev, isOpen: false }));
      },
      type: 'info',
    });
  };

  const handleRejectPro = (userId: string, userName: string) => {
    setInputDialogState({
      isOpen: true,
      title: `Reject "${userName}"`,
      placeholder: 'Enter rejection reason...',
      defaultValue: 'Does not meet our requirements',
      onSubmit: async (reason) => {
        await AdminService.rejectProfessionalByAdmin(userId, reason);
        fetchProfessionals();
        setInputDialogState(prev => ({ ...prev, isOpen: false }));
      },
    });
    setInputValue('Does not meet our requirements');
  };

  const handleBanUser = (userId: string, userName: string) => {
    setInputDialogState({
      isOpen: true,
      title: `Ban User "${userName}"`,
      placeholder: 'Enter ban reason...',
      defaultValue: 'Policy violation',
      onSubmit: async (reason) => {
        await AdminService.banUser(userId, reason);
        fetchUsers();
        setInputDialogState(prev => ({ ...prev, isOpen: false }));
      },
    });
    setInputValue('Policy violation');
  };

  // Meeting Created Modal State
  const [meetingCreatedState, setMeetingCreatedState] = useState<{
    isOpen: boolean;
    callId: string;
    joinLink: string;
  }>({
    isOpen: false,
    callId: '',
    joinLink: '',
  });

  const handleCreateMeeting = () => {
    setDialogState({
      isOpen: true,
      title: 'Create Meeting',
      message: 'Start a new video meeting room? A join link will be generated.',
      action: async () => {
        setCreatingMeeting(true);
        setDialogState(prev => ({ ...prev, isOpen: false }));
        try {
          const response = await MeetingService.createAdHocMeeting();
          if (response.success) {
            const link = `${window.location.origin}/meeting/${response.data.callId}`;
            setMeetingCreatedState({
              isOpen: true,
              callId: response.data.callId,
              joinLink: link,
            });
            toast.success("Meeting room created!");
          }
        } catch (error) {
          console.error('Failed to create meeting:', error);
          toast.error("Failed to create meeting");
        }
        setCreatingMeeting(false);
      },
      type: 'info',
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const handleResendOTP = (userId: string, email: string) => {
    setDialogState({
      isOpen: true,
      title: 'Resend OTP',
      message: `Resend activation OTP to ${email}?`,
      action: async () => {
        const res = await AdminService.resendDraftOTP(userId);
        toast.success(`OTP resent to ${res.data.email}${res.data.otp ? ` (Dev: ${res.data.otp})` : ''}`);
        setDialogState(prev => ({ ...prev, isOpen: false }));
      },
      type: 'info',
    });
  };

  // Tab configuration
  const tabs: { key: TabType; label: string; shortLabel: string; icon: React.ElementType; badge?: number }[] = [
    { key: 'overview', label: 'Overview', shortLabel: 'Home', icon: Activity },
    { key: 'users', label: 'Users', shortLabel: 'Users', icon: Users },
    { key: 'professionals', label: 'Professionals', shortLabel: 'Pros', icon: UserCheck, badge: stats.pendingApprovals || undefined },
    { key: 'bookings', label: 'Bookings', shortLabel: 'Book', icon: BookOpen },
    { key: 'payments', label: 'Payments', shortLabel: 'Pay', icon: CreditCard },
    { key: 'withdrawals', label: 'Withdrawals', shortLabel: 'With', icon: Banknote },
    { key: 'audit', label: 'Audit Logs', shortLabel: 'Logs', icon: FileText },
  ];

  const StatusBadge = ({ status }: { status: string }) => {
    const colors: Record<string, string> = {
      APPROVED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      VERIFIED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      PENDING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      DRAFT: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
      REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      COMPLETED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      CONFIRMED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      USER: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
      PROFESSIONAL: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400',
      MODERATOR: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      ADMIN: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${colors[status] || 'bg-slate-100 text-slate-700'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Header - Mobile Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Command Center</h1>
          <p className="text-slate-500 text-xs sm:text-sm">Platform management & oversight</p>
        </div>
        <div className="flex gap-2 sm:gap-3">
          <Link 
            href="/dashboard/add-professional"
            className="flex-1 sm:flex-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 sm:px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wide flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"
          >
            <Plus className="w-4 h-4 text-green-500" /> 
            <span className="hidden sm:inline">Add Pro</span>
            <span className="sm:hidden">Add</span>
          </Link>
          <button 
            onClick={handleCreateMeeting}
            disabled={creatingMeeting}
            className="flex-1 sm:flex-none bg-primary-600 hover:bg-primary-500 text-white px-3 sm:px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wide flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {creatingMeeting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
            <span className="hidden sm:inline">Meeting</span>
          </button>
        </div>
      </div>



      {/* Tabs - Mobile Horizontal Scroll */}
      <div className="relative">
        <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => { handleTabChange(tab.key); setMobileMenuOpen(false); }}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold uppercase whitespace-nowrap transition-all shrink-0 ${
                activeTab === tab.key 
                  ? 'bg-primary-600 text-white shadow-lg' 
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.shortLabel}</span>
              {tab.badge && <span className="bg-red-500 text-white text-[8px] sm:text-[10px] px-1 sm:px-1.5 rounded-full min-w-[16px] text-center">{tab.badge}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar - Mobile Responsive */}
      {['users', 'professionals'].includes(activeTab) && (
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
            />
          </div>
          <div className="flex gap-2">
            {activeTab === 'professionals' && (
              <select 
                value={proStatusFilter} 
                onChange={(e) => setProStatusFilter(e.target.value)}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
              >
                <option value="">All Status</option>
                <option value="DRAFT">Draft</option>
                <option value="PENDING">Pending</option>
                <option value="VERIFIED">Verified</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            )}
            {activeTab === 'users' && (
              <select 
                value={userRoleFilter} 
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
              >
                <option value="">All Roles</option>
                <option value="USER">User</option>
                <option value="PROFESSIONAL">Professional</option>
                <option value="MODERATOR">Moderator</option>
                <option value="ADMIN">Admin</option>
              </select>
            )}
            <button 
              onClick={() => activeTab === 'users' ? fetchUsers() : fetchProfessionals()} 
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      )}

      {/* Tab Content - Mobile Responsive Cards */}
      <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 min-h-[300px] sm:min-h-[400px]">
        {isLoading && (
          <div className="flex items-center justify-center py-16 sm:py-20">
            <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-primary-600" />
          </div>
        )}

        {/* OVERVIEW TAB */}
        {!isLoading && activeTab === 'overview' && (
          <div className="space-y-8">
            
            {/* 1. KEY METRICS GRID */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {[
                { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/10' },
                { label: 'Pending', value: stats.pendingApprovals, icon: UserCheck, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/10' },
                { label: 'Professionals', value: stats.totalProfessionals, icon: Shield, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/10' },
                { label: 'Revenue', value: `৳${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/10' },
              ].map((stat, i) => (
                <div key={i} className={`${stat.bg} p-4 sm:p-5 rounded-2xl border border-transparent dark:border-slate-800`}>
                  <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
                  <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{stat.value}</p>
                  <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* 2. REPORTS & ANALYTICS CENTER */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-800">
               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                       <TrendingUp className="w-5 h-5 text-primary-600" />
                       Analytics & Reports
                    </h2>
                    <p className="text-sm text-slate-500">Generate and download platform insights</p>
                  </div>
                  <div className="flex gap-2">
                     <button 
                        onClick={() => AdminService.downloadReport(reportType, reportFormat, dateFrom, dateTo)}
                        className="bg-primary-600 hover:bg-primary-500 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-primary-600/20 active:scale-95 transition-all flex items-center gap-2"
                     >
                        <FileText className="w-4 h-4" /> Download Report
                     </button>
                  </div>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                     <label className="text-xs font-bold text-slate-500 uppercase ml-1">Report Type</label>
                     <select 
                        value={reportType}
                        onChange={(e) => setReportType(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                     >
                        <option value="revenue">Revenue & Earnings</option>
                        <option value="users">User Growth</option>
                        <option value="bookings">Booking Statistics</option>
                        <option value="professionals">Professional Performance</option>
                        <option value="payments">Transaction History</option>
                        <option value="withdrawals">Withdrawal Requests</option>
                        <option value="disputes">Dispute Resolution</option>
                     </select>
                  </div>
                  
                  <div className="space-y-1.5">
                     <label className="text-xs font-bold text-slate-500 uppercase ml-1">Format</label>
                     <div className="flex bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-1">
                        {(['pdf', 'excel', 'json'] as const).map(fmt => (
                           <button
                              key={fmt}
                              onClick={() => setReportFormat(fmt)}
                              className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all ${
                                 reportFormat === fmt 
                                 ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' 
                                 : 'text-slate-400 hover:text-slate-600'
                              }`}
                           >
                              {fmt}
                           </button>
                        ))}
                     </div>
                  </div>

                  <div className="space-y-1.5">
                     <label className="text-xs font-bold text-slate-500 uppercase ml-1">From Date</label>
                     <input 
                        type="date" 
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                     />
                  </div>

                  <div className="space-y-1.5">
                     <label className="text-xs font-bold text-slate-500 uppercase ml-1">To Date</label>
                     <input 
                        type="date" 
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                     />
                  </div>
               </div>

               {/* Chart Preview Section */}
               <div className="mt-8 border-t border-slate-200 dark:border-slate-700 pt-6">
                  {loadingPreview ? (
                    <div className="h-64 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                    </div>
                  ) : previewData ? (
                    <div className="space-y-4">
                      {/* Summary Stats */}
                      {previewData.summary && (
                         <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {Object.entries(previewData.summary)
                              .filter(([k, v]) => typeof v === 'number' || (typeof v === 'string' && k !== 'byStatus' && k !== 'byRole' && k !== 'byMethod'))
                              .map(([k, v]) => (
                                <div key={k} className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                                   <p className="text-[10px] text-slate-500 uppercase font-bold">{k.replace(/([A-Z])/g, ' $1').trim()}</p>
                                   <p className="text-lg font-black text-slate-900 dark:text-white">{v as React.ReactNode}</p>
                                </div>
                              ))}
                         </div>
                      )}

                      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                        <h3 className="text-xs font-bold text-slate-400 uppercase mb-4 text-center">
                          {reportType.toUpperCase()} OVERVIEW
                        </h3>
                        <div className="h-[250px] w-full">
                           <ResponsiveContainer width="100%" height="100%">
                              {/* REVENUE CHART */}
                              {reportType === 'revenue' ? (
                              <AreaChart data={previewData.data}>
                                 <defs>
                                    <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                                       <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                                       <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                    </linearGradient>
                                 </defs>
                                 <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                                 <XAxis dataKey="date" tick={{fontSize: 10}} tickLine={false} axisLine={false} />
                                 <YAxis tick={{fontSize: 10}} tickLine={false} axisLine={false} tickFormatter={(v) => `৳${v}`} />
                                 <Tooltip 
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
                                    formatter={(value: any) => [`৳${value || 0}`, 'Revenue']}
                                    labelStyle={{ color: '#64748b', fontSize: '10px', fontWeight: 'bold' }}
                                 />
                                 <Area type="monotone" dataKey="amount" stroke="#6366f1" fillOpacity={1} fill="url(#colorAmt)" />
                              </AreaChart>
                           
                           /* USERS PIE CHART */
                           ) : reportType === 'users' && previewData.summary?.byRole ? (
                              <PieChart>
                                 <Pie
                                    data={previewData.summary.byRole}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="_count"
                                    nameKey="role"
                                 >
                                    {previewData.summary.byRole.map((entry: any, index: number) => (
                                       <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444'][index % 4]} />
                                    ))}
                                 </Pie>
                                 <Tooltip />
                                 <Legend iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                              </PieChart>

                           /* BOOKINGS/OTHERS BAR CHART (Status) */
                           ) : previewData.summary?.byStatus ? (
                              <BarChart data={previewData.summary.byStatus}>
                                 <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                                 <XAxis dataKey="status" tick={{fontSize: 10}} tickLine={false} axisLine={false} />
                                 <YAxis tick={{fontSize: 10}} tickLine={false} axisLine={false} allowDecimals={false} />
                                 <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px' }} />
                                 <Bar dataKey="_count" name="Count" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={40} />
                              </BarChart>

                           /* DEFAULT LINE CHART (if data has date) */
                           ) : previewData.data && previewData.data[0]?.date ? (
                             <AreaChart data={[...previewData.data].reverse()}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                                <XAxis dataKey="date" tick={{fontSize: 10}} tickLine={false} axisLine={false} />
                                <YAxis tick={{fontSize: 10}} tickLine={false} axisLine={false} />
                                <Tooltip />
                                <Area type="monotone" dataKey={Object.keys(previewData.data[0]).find(k => typeof previewData.data[0][k] === 'number') || 'id'} stroke="#0ea5e9" fill="#e0f2fe" />
                             </AreaChart>
                           ) : (
                              <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                                No visual data available for this report type. Only table download supported.
                              </div>
                           )}
                           </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-48 flex items-center justify-center text-slate-400 text-sm italic">
                       Select a report type to view preview
                    </div>
                  )}
               </div>
            </div>

            {/* 3. PENDING APPROVALS LIST */}
            <div>
              <div className="flex items-center justify-between mb-4">
                 <h2 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-yellow-500" />
                    Pending Approvals
                 </h2>
                 <button onClick={() => handleTabChange('professionals')} className="text-xs font-bold text-primary-600 hover:underline">View All</button>
              </div>
              
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {verifiedProfessionals.slice(0, 6).map(p => (
                  <div key={p.id} className="bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-2">
                       <div>
                          <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{p.user?.name || 'Unknown'}</p>
                          <p className="text-xs text-slate-500 truncate">{p.title || p.user?.email}</p>
                       </div>
                       <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-[10px] font-bold uppercase">Pending</span>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button onClick={() => handleApprovePro(p.userId, p.user?.name || 'Unknown')} className="flex-1 text-xs bg-green-50 hover:bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-3 py-2 rounded-xl font-bold flex items-center justify-center gap-1 transition-colors">
                        <CheckCircle className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button onClick={() => handleRejectPro(p.userId, p.user?.name || 'Unknown')} className="flex-1 text-xs bg-red-50 hover:bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 px-3 py-2 rounded-xl font-bold flex items-center justify-center gap-1 transition-colors">
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                    </div>
                  </div>
                ))}
                {verifiedProfessionals.length === 0 && (
                  <div className="col-span-full py-12 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                     <CheckCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                     <p className="text-slate-400 font-bold text-sm">All caught up! No pending approvals.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* USERS TAB - Mobile Cards + Desktop Table */}
        {!isLoading && activeTab === 'users' && (
          <>
            {/* Mobile Cards */}
            <div className="sm:hidden space-y-3">
              {users.map(u => (
                <div key={u.id} className="p-3 border border-slate-200 dark:border-slate-700 rounded-xl">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{u.name}</p>
                      <p className="text-xs text-slate-500 truncate">{u.email}</p>
                    </div>
                    <StatusBadge status={u.role} />
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      {u.isVerified ? <CheckCircle className="w-3 h-3 text-green-500" /> : <XCircle className="w-3 h-3 text-slate-300" />}
                      {u.isVerified ? 'Verified' : 'Not verified'}
                    </div>
                    <button onClick={() => handleBanUser(u.id, u.name)} className="text-red-500 text-xs font-bold px-2 py-1 bg-red-50 dark:bg-red-900/20 rounded">Ban</button>
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto no-scrollbar">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase">
                    <th className="pb-3">Name</th>
                    <th className="pb-3">Email</th>
                    <th className="pb-3">Role</th>
                    <th className="pb-3">Verified</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {users.map(u => (
                    <tr key={u.id} className="text-sm">
                      <td className="py-3 font-bold text-slate-900 dark:text-white">{u.name}</td>
                      <td className="py-3 text-slate-500">{u.email}</td>
                      <td className="py-3"><StatusBadge status={u.role} /></td>
                      <td className="py-3">{u.isVerified ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-slate-300" />}</td>
                      <td className="py-3 text-right">
                        <button onClick={() => handleBanUser(u.id, u.name)} className="text-red-500 text-xs font-bold hover:underline">Ban</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {users.length === 0 && <p className="text-center text-slate-400 py-10 text-sm">No users found</p>}
          </>
        )}

        {/* PROFESSIONALS TAB */}
        {!isLoading && activeTab === 'professionals' && (
          <div className="space-y-6">
            {/* Draft Professionals */}
            {draftProfessionals.length > 0 && (
              <div>
                <h3 className="font-bold text-xs text-slate-500 uppercase mb-3">Draft (Awaiting OTP)</h3>
                <div className="space-y-2">
                  {draftProfessionals.map(p => (
                    <div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{p.user?.name}</p>
                        <p className="text-xs text-slate-500 truncate">{p.user?.email}</p>
                      </div>
                      <button onClick={() => handleResendOTP(p.userId, p.user?.email || '')} className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-3 py-1.5 rounded-lg font-bold shrink-0">Resend OTP</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All Professionals */}
            {/* Mobile Cards */}
            <div className="sm:hidden space-y-3">
              {professionals.map(p => (
                <div key={p.id} className="p-3 border border-slate-200 dark:border-slate-700 rounded-xl">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{p.user?.name || 'Unknown'}</p>
                      <p className="text-xs text-slate-500 truncate">{p.title || '-'}</p>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                  {p.status === 'VERIFIED' && (
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => handleApprovePro(p.userId, p.user?.name || 'Unknown')} className="flex-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1.5 rounded-lg font-bold">Approve</button>
                      <button onClick={() => handleRejectPro(p.userId, p.user?.name || 'Unknown')} className="flex-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-1.5 rounded-lg font-bold">Reject</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto no-scrollbar">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase">
                    <th className="pb-3">Name</th>
                    <th className="pb-3">Title</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {professionals.map(p => (
                    <tr key={p.id} className="text-sm">
                      <td className="py-3 font-bold text-slate-900 dark:text-white">{p.user?.name || 'Unknown'}</td>
                      <td className="py-3 text-slate-500">{p.title || '-'}</td>
                      <td className="py-3"><StatusBadge status={p.status} /></td>
                      <td className="py-3 text-right space-x-2">
                        {p.status === 'VERIFIED' && (
                          <>
                            <button onClick={() => handleApprovePro(p.userId, p.user?.name || 'Unknown')} className="text-green-600 text-xs font-bold hover:underline">Approve</button>
                            <button onClick={() => handleRejectPro(p.userId, p.user?.name || 'Unknown')} className="text-red-500 text-xs font-bold hover:underline">Reject</button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {professionals.length === 0 && (
                  <div className="col-span-full py-12 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                     <CheckCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                     <p className="text-slate-400 font-bold text-sm">No professionals found.</p>
                  </div>
                )}
          </div>
        )}

        {/* BOOKINGS TAB */}
        {!isLoading && activeTab === 'bookings' && (
          <>
            {/* Mobile Cards */}
            <div className="sm:hidden space-y-3">
              {bookings.map(b => (
                <div key={b.id} className="p-3 border border-slate-200 dark:border-slate-700 rounded-xl">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-mono text-xs text-slate-500">{b.id.slice(0, 8)}...</p>
                      <p className="text-sm text-slate-900 dark:text-white">{new Date(b.startTime).toLocaleDateString()}</p>
                    </div>
                    <StatusBadge status={b.status} />
                  </div>
                  <p className="font-bold text-primary-600 mt-2">৳{b.price?.toLocaleString() || 0}</p>
                </div>
              ))}
            </div>
            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto no-scrollbar">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase">
                    <th className="pb-3">ID</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Price</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {bookings.map(b => (
                    <tr key={b.id} className="text-sm">
                      <td className="py-3 font-mono text-xs text-slate-500">{b.id.slice(0, 8)}...</td>
                      <td className="py-3 text-slate-900 dark:text-white">{new Date(b.startTime).toLocaleDateString()}</td>
                      <td className="py-3 font-bold">৳{b.price?.toLocaleString() || 0}</td>
                      <td className="py-3"><StatusBadge status={b.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {bookings.length === 0 && <p className="text-center text-slate-400 py-10 text-sm">No bookings found</p>}
          </>
        )}

        {/* PAYMENTS TAB */}
        {!isLoading && activeTab === 'payments' && (
          <>
            {/* Mobile Cards */}
            <div className="sm:hidden space-y-3">
              {payments.map(p => (
                <div key={p.id} className="p-3 border border-slate-200 dark:border-slate-700 rounded-xl">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">৳{p.amount.toLocaleString()}</p>
                      <p className="text-xs text-slate-500">{p.method}</p>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                  <p className="text-xs text-slate-400 mt-2">{new Date(p.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto no-scrollbar">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase">
                    <th className="pb-3">ID</th>
                    <th className="pb-3">Amount</th>
                    <th className="pb-3">Method</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {payments.map(p => (
                    <tr key={p.id} className="text-sm">
                      <td className="py-3 font-mono text-xs text-slate-500">{p.id.slice(0, 8)}...</td>
                      <td className="py-3 font-bold text-slate-900 dark:text-white">৳{p.amount.toLocaleString()}</td>
                      <td className="py-3">{p.method}</td>
                      <td className="py-3"><StatusBadge status={p.status} /></td>
                      <td className="py-3 text-slate-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {payments.length === 0 && <p className="text-center text-slate-400 py-10 text-sm">No payments found</p>}
          </>
        )}

        {/* WITHDRAWALS TAB */}
        {!isLoading && activeTab === 'withdrawals' && (
          <>
            {/* Mobile Cards */}
            <div className="sm:hidden space-y-3">
              {withdrawals.map(w => (
                <div key={w.id} className="p-3 border border-slate-200 dark:border-slate-700 rounded-xl">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">৳{w.amount.toLocaleString()}</p>
                      <p className="text-xs text-slate-500">{w.method}</p>
                    </div>
                    <StatusBadge status={w.status} />
                  </div>
                  {w.status === 'PENDING' && (
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => handleApproveWithdraw(w.id)} className="flex-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1.5 rounded-lg font-bold">Approve</button>
                      <button onClick={() => handleRejectWithdraw(w.id)} className="flex-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-1.5 rounded-lg font-bold">Reject</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto no-scrollbar">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase">
                    <th className="pb-3">ID</th>
                    <th className="pb-3">Amount</th>
                    <th className="pb-3">Method</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {withdrawals.map(w => (
                    <tr key={w.id} className="text-sm">
                      <td className="py-3 font-mono text-xs text-slate-500">{w.id.slice(0, 8)}...</td>
                      <td className="py-3 font-bold text-slate-900 dark:text-white">৳{w.amount.toLocaleString()}</td>
                      <td className="py-3">{w.method}</td>
                      <td className="py-3"><StatusBadge status={w.status} /></td>
                      <td className="py-3 text-right space-x-2">
                        {w.status === 'PENDING' && (
                          <>
                            <button onClick={() => handleApproveWithdraw(w.id)} className="text-green-600 text-xs font-bold hover:underline">Approve</button>
                            <button onClick={() => handleRejectWithdraw(w.id)} className="text-red-500 text-xs font-bold hover:underline">Reject</button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {withdrawals.length === 0 && <p className="text-center text-slate-400 py-10 text-sm">No withdrawal requests</p>}
          </>
        )}



        {/* AUDIT LOGS TAB */}
        {!isLoading && activeTab === 'audit' && (
          <>
            {/* Mobile Cards */}
            <div className="sm:hidden space-y-3">
              {auditLogs.map(log => (
                <div key={log.id} className="p-3 border border-slate-200 dark:border-slate-700 rounded-xl">
                  <p className="font-bold text-sm text-slate-900 dark:text-white">{log.action}</p>
                  <p className="text-xs text-slate-500">{log.performedByUser?.name || log.performedBy}</p>
                  <p className="text-xs text-slate-400 mt-1">{new Date(log.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto no-scrollbar">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase">
                    <th className="pb-3">Action</th>
                    <th className="pb-3">Performed By</th>
                    <th className="pb-3">Target</th>
                    <th className="pb-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {auditLogs.map(log => (
                    <tr key={log.id} className="text-sm">
                      <td className="py-3 font-bold text-slate-900 dark:text-white">{log.action}</td>
                      <td className="py-3 text-slate-500">{log.performedByUser?.name || log.performedBy}</td>
                      <td className="py-3 font-mono text-xs text-slate-400">{log.targetId?.slice(0, 8) || '-'}</td>
                      <td className="py-3 text-slate-500">{new Date(log.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {auditLogs.length === 0 && <p className="text-center text-slate-400 py-10 text-sm">No audit logs</p>}
          </>
        )}
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog 
        isOpen={dialogState.isOpen}
        onClose={() => setDialogState(prev => ({ ...prev, isOpen: false }))}
        onConfirm={dialogState.action}
        title={dialogState.title}
        message={dialogState.message}
        type={dialogState.type}
      />

      {/* Meeting Created Modal */}
      {meetingCreatedState.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <Video className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">Meeting Ready</h2>
              <p className="text-sm text-slate-500">Share this link with participants</p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 mb-6 flex items-center justify-between gap-3 border border-slate-200 dark:border-slate-700">
              <p className="text-xs font-mono text-slate-600 dark:text-slate-400 truncate flex-1">
                {meetingCreatedState.joinLink}
              </p>
              <button 
                onClick={() => copyToClipboard(meetingCreatedState.joinLink)}
                className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-primary-600 transition-colors"
                title="Copy Link"
              >
                <div className="w-4 h-4"><CheckCircle className="w-4 h-4" /></div> 
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
               <button
                onClick={() => setMeetingCreatedState(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Close
              </button>
              <button
                onClick={() => {
                  window.open(meetingCreatedState.joinLink, '_blank');
                  setMeetingCreatedState(prev => ({ ...prev, isOpen: false }));
                }}
                className="px-4 py-3 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary-600/20"
              >
                Join Now <Video className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Input Dialog (for rejection reasons, ban reasons, etc.) */}
      {inputDialogState.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">{inputDialogState.title}</h2>
              <button onClick={() => setInputDialogState(prev => ({ ...prev, isOpen: false }))} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={inputDialogState.placeholder}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm resize-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setInputDialogState(prev => ({ ...prev, isOpen: false }))}
                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-sm text-slate-600 dark:text-slate-400"
              >
                Cancel
              </button>
              <button
                onClick={() => inputDialogState.onSubmit(inputValue)}
                disabled={!inputValue.trim()}
                className="flex-1 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm disabled:opacity-50"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
