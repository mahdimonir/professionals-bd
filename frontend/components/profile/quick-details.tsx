import { AlertCircle, Briefcase, Calendar, CreditCard, LayoutDashboard, MessageSquare, Settings as SettingsIcon, Star, User as UserIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ProfileAvatar } from './profile-avatar';

export type TabType = 'overview' | 'bookings' | 'billing' | 'reviews' | 'support' | 'info';

export const TABS = [
  { id: 'overview' as TabType, label: 'Overview', icon: LayoutDashboard },
  { id: 'bookings' as TabType, label: 'Bookings', icon: Calendar },
  { id: 'billing' as TabType, label: 'Billing', icon: CreditCard },
  { id: 'reviews' as TabType, label: 'Reviews', icon: Star },
  { id: 'support' as TabType, label: 'Disputes', icon: MessageSquare },
  { id: 'info' as TabType, label: 'Personal Info', icon: SettingsIcon },
];

interface QuickDetailsProps {
  user: any;
  isProfessional: boolean;
  activeTab?: TabType;
  handleTabChange?: (tabId: TabType) => void;
  hasPendingChanges?: boolean;
}

export function QuickDetailsCompact({ user, isProfessional }: QuickDetailsProps) {
  return (
    <div className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
      <ProfileAvatar user={user} size="sm" className="mb-0" />
      <div className="flex-1 min-w-0">
        <h2 className="font-bold text-slate-900 dark:text-white truncate">{user.name}</h2>
        <p className="text-xs text-slate-500 truncate">{user.email}</p>
      </div>
      <span className={`shrink-0 px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
        isProfessional
          ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
      }`}>
        {user.role}
      </span>
    </div>
  );
}

export function QuickDetailsFull({ 
  user, 
  isProfessional, 
  activeTab, 
  handleTabChange, 
  hasPendingChanges 
}: QuickDetailsProps) {
  const router = useRouter();
  const isUser = user.role === 'USER';

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 relative">
      <div className="text-center mb-6">
        <ProfileAvatar user={user} size="lg" />
        <h2 className="text-xl font-black text-slate-900 dark:text-white">{user.name}</h2>
        <p className="text-sm text-slate-500">{user.email}</p>
        <span className={`inline-flex items-center gap-1 mt-3 px-3 py-1 rounded-full text-xs font-bold uppercase ${
          isProfessional
            ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
        }`}>
          {isProfessional ? <Briefcase className="w-3 h-3" /> : <UserIcon className="w-3 h-3" />}
          {user.role}
        </span>
      </div>

      {/* Pending Changes Warning */}
      {hasPendingChanges && (
        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-yellow-700 dark:text-yellow-400">Pending Changes</p>
              <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-1">Your profile updates are awaiting moderator approval</p>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Tabs */}
      <div className="space-y-1 border-t border-slate-100 dark:border-slate-800 pt-4">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => handleTabChange?.(tab.id)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl text-sm font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Become Pro CTA */}
      {isUser && !isProfessional && (
        <div className="mt-6 p-4 bg-gradient-to-br from-primary-600 to-indigo-600 rounded-xl text-white text-center">
          <p className="font-bold text-sm mb-1">Become a Pro</p>
          <p className="text-xs text-white/80 mb-3">Earn by sharing your expertise</p>
          <button
            onClick={() => router.push('/become-a-pro')}
            className="w-full bg-white text-primary-600 py-2 rounded-lg font-bold text-xs hover:bg-slate-50"
          >
            Apply Now
          </button>
        </div>
      )}
    </div>
  );
}
