'use client';

import { AvailabilityStatus, ProfessionalProfile } from '@/lib/types';
import { ArrowRight, Clock, ShieldCheck, Star } from 'lucide-react';
import Link from 'next/link';

interface Props {
  expert: ProfessionalProfile;
}

export default function ExpertCard({ expert }: Props) {
  const getStatusConfig = (status?: AvailabilityStatus) => {
    switch (status) {
      case 'Available Now':
        return { color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20', pulse: true };
      case 'Busy':
        return { color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', pulse: false };
      case 'Offline':
        return { color: 'text-slate-500', bg: 'bg-slate-500/10', border: 'border-slate-500/20', pulse: false };
      default:
        return { color: 'text-slate-500', bg: 'bg-slate-500/10', border: 'border-slate-500/20', pulse: false };
    }
  };

  const statusConfig = getStatusConfig(expert.availabilityStatus);

  return (
    <Link href={`/professionals/${expert.userId}`} className="block group">
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 transition-all duration-300 hover:shadow-2xl hover:border-primary-500/50 hover:-translate-y-2">
        <div className="flex items-start justify-between mb-8">
          <div className="relative">
            <div className="w-24 h-24 rounded-3xl overflow-hidden border-4 border-white dark:border-slate-900 shadow-2xl group-hover:scale-105 transition-transform duration-700">
              <img 
                src={expert.avatar} 
                alt={expert.name} 
                className="w-full h-full object-cover"
              />
            </div>
            {expert.isVerified && (
              <div className="absolute -bottom-3 -right-3 bg-primary-600 rounded-2xl p-2 border-4 border-white dark:border-slate-950 shadow-xl">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-3">
            <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border ${statusConfig.bg} ${statusConfig.border} ${statusConfig.color}`}>
              <div className={`w-2 h-2 rounded-full bg-current ${statusConfig.pulse ? 'animate-pulse' : ''}`}></div>
              <span className="text-[9px] font-black uppercase tracking-widest">{expert.availabilityStatus || 'Offline'}</span>
            </div>
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900/50 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="text-sm font-black text-slate-900 dark:text-slate-100">{expert.rating}</span>
              </div>
              <p className="text-[9px] text-slate-400 mt-1.5 font-black uppercase tracking-widest">({expert.reviewCount} reviews)</p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-2xl font-black text-slate-900 dark:text-white group-hover:text-primary-600 transition-colors tracking-tight">
            {expert.name}
          </h3>
          <p className="text-sm font-bold text-primary-600 uppercase tracking-widest mt-1">
            {expert.category} Specialist
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {expert.specialties.map((s, i) => (
            <span key={i} className="text-[9px] uppercase tracking-widest font-black bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
              {s}
            </span>
          ))}
        </div>

        <div className="space-y-6 pt-6 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <Clock className="w-5 h-5 text-primary-500" />
              <span className="text-xs font-black uppercase tracking-widest">{expert.experience} Years Exp</span>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1">Session Price</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                ৳{expert.sessionPrice?.toLocaleString() || 0}
                <span className="text-[10px] text-slate-400 ml-1 font-bold">/ SESSION</span>
              </p>
            </div>
          </div>
          
          <button 
            className="w-full bg-primary-600 hover:bg-primary-500 text-white font-black py-5 rounded-3xl text-[11px] uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-3 shadow-xl shadow-primary-600/20 active:scale-95 group/btn"
          >
            Initiate Consultation
            <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-2 transition-transform" />
          </button>
        </div>
      </div>
    </Link>
  );
}
