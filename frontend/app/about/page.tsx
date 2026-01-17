'use client';

import Navbar from '@/components/ui/navbar';
import { Award, CheckCircle, Globe, Shield, Users, Zap } from 'lucide-react';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative pt-32 pb-24 px-4 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-primary-600/20 blur-[120px] rounded-full opacity-50 pointer-events-none" />
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-full mb-8 animate-in slide-in-from-top-4">
            <Shield className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            <span className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Trusted by 10,000+ Users</span>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-6 leading-none animate-in slide-in-from-top-4 [animation-delay:100ms]">
            Redefining <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-600 dark:from-primary-400 dark:to-indigo-400">Professional</span> Trust
          </h1>
          
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 font-medium max-w-2xl mx-auto mb-10 animate-in slide-in-from-top-4 [animation-delay:200ms]">
            ProfessionalsBD is the premier platform connecting individuals with verified legal, financial, and medical experts. Excellence is our standard.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in slide-in-from-top-4 [animation-delay:300ms]">
            <Link 
              href="/professionals"
              className="px-8 py-4 bg-primary-600 hover:bg-primary-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all hover:scale-105 hover:shadow-xl hover:shadow-primary-600/30 flex items-center gap-2 group"
            >
              Explore Network
              <Zap className="w-4 h-4 group-hover:fill-current transition-all" />
            </Link>
            <Link 
              href="/auth/register"
              className="px-8 py-4 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-2xl font-black text-sm uppercase tracking-widest transition-all hover:scale-105 hover:shadow-xl"
            >
              Join as Professional
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="max-w-7xl mx-auto px-4 mb-32">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { label: 'Verified Experts', value: '500+', icon: Users, color: 'bg-blue-500' },
            { label: 'Consultations', value: '15k+', icon: Globe, color: 'bg-purple-500' },
            { label: 'Success Rate', value: '99%', icon: CheckCircle, color: 'bg-emerald-500' },
          ].map((stat, i) => (
             <div key={i} className="glass dark:bg-white/5 p-8 rounded-[2rem] border border-slate-200/50 dark:border-white/10 hover:border-primary-500/50 transition-colors group">
               <div className={`w-14 h-14 ${stat.color}/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                 <stat.icon className={`w-7 h-7 ${stat.color.replace('bg-', 'text-')}`} />
               </div>
               <h3 className="text-4xl font-black text-slate-900 dark:text-white mb-2">{stat.value}</h3>
               <p className="text-slate-500 font-bold uppercase tracking-wider text-sm">{stat.label}</p>
             </div>
          ))}
        </div>
      </div>

      {/* Mission Section */}
      <div className="bg-white dark:bg-slate-900 py-32 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div>
              <div className="inline-flex items-center gap-2 text-primary-600 font-black uppercase tracking-widest text-xs mb-6">
                <span className="w-8 h-[2px] bg-primary-600"></span>
                Our Mission
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-8">
                Empowering Success Through <span className="text-primary-600">Expertise</span>
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                We believe that access to high-quality professional advice is a fundamental driver of success. Whether you're navigating legal complexities, managing finances, or seeking medical clarity, our platform bridges the gap between you and the verified experts who can help.
              </p>
              
              <ul className="space-y-6">
                 {[
                   "Rigorous 3-step verification process",
                   "Secure & encrypted video consultations",
                   "Transparent pricing & instant booking"
                 ].map((item, i) => (
                   <li key={i} className="flex items-center gap-4 text-slate-800 dark:text-slate-200 font-bold">
                     <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white">
                       <CheckCircle className="w-4 h-4" />
                     </div>
                     {item}
                   </li>
                 ))}
              </ul>
            </div>
            
            <div className="relative">
               <div className="aspect-square bg-slate-100 dark:bg-slate-800 rounded-[3rem] p-8 relative z-10 glass-dark">
                  <div className="h-full w-full bg-slate-200 dark:bg-slate-700/50 rounded-[2rem] flex items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-600">
                    <Award className="w-32 h-32 text-slate-400 dark:text-slate-500 floating" />
                  </div>
                  
                  {/* Floating cards */}
                  <div className="absolute -top-12 -right-12 p-6 bg-white dark:bg-slate-800 rounded-3xl shadow-2xl glass border border-white/20 animate-in slide-in-from-right-8 [animation-delay:500ms]">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600">
                        <Shield className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-bold">Verification Status</p>
                        <p className="text-lg font-black text-slate-900 dark:text-white">100% Verified</p>
                      </div>
                    </div>
                  </div>
               </div>
               
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-primary-600/20 to-purple-600/20 rounded-full blur-[100px] -z-10" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
