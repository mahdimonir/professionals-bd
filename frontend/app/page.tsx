'use client';

import ExpertCard from '@/components/ui/expert-card';
import Navbar from '@/components/ui/navbar';
import { TESTIMONIALS } from '@/lib/constants';
import { ProfessionalService } from '@/lib/services/professional-service';
import { ArrowRight, Award, Search, Shield, Sparkles, Target, Users, Zap } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function HomePage() {
  const [featuredProfessionals, setFeaturedProfessionals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch featured professionals on mount
  useEffect(() => {
    const fetchFeaturedProfessionals = async () => {
      try {
        setLoading(true);
        const response = await ProfessionalService.getProfessionals({
          page: 1,
          limit: 3
        });
        
        // Map API response to ExpertCard format
        const mapped = response.professionals.map((prof: any) => ({
          id: prof.id,
          name: prof.user?.name || 'Professional',
          avatar: prof.user?.avatar || '/default-avatar.png',
          category: prof.category || 'Professional',
          specialties: prof.specialties || [],
          experience: prof.experience || 0,
          sessionPrice: prof.sessionPrice || 0,
          rating: 4.8, // prof.rating || 4.8
          reviewCount: 0, // prof.reviewCount || 0
          availabilityStatus: prof.status === 'APPROVED' ? 'Available Now' : 'Offline',
          isVerified: prof.status === 'APPROVED'
        }));
        
        setFeaturedProfessionals(mapped);
      } catch (error) {
        console.error('Failed to fetch featured professionals:', error);
        setFeaturedProfessionals([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedProfessionals();
  }, []);

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="animate-in fade-in duration-700">
        {/* Hero Section */}
        <section className="relative min-h-[85vh] flex flex-col items-center justify-center pt-32 pb-20 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary-500/10 blur-[120px] rounded-full opacity-30"></div>
          </div>

          <div className="max-w-7xl mx-auto px-4 relative z-10 text-center space-y-8">
            {/* Badge */}
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-5 py-2 rounded-full border border-blue-100 dark:border-blue-800 animate-in slide-in-from-top-4 duration-700">
                <Sparkles className="w-3.5 h-3.5" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">The Trusted Network for Bangladesh</span>
              </div>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-black text-slate-900 dark:text-white mb-6 leading-tight tracking-tight">
              Find Your Expert,<br />
              <span className="text-primary-600">Right Now</span>
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-medium">
              Connect instantly with vetted legal, financial, and medical professionals.
            </p>

            {/* Quick Action Buttons */}
            <div className="max-w-5xl mx-auto w-full px-4 mt-12">
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-6">Popular Services</p>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {/* Lawyer */}
                <a
                  href="/professionals?cat=Legal"
                  className="group flex flex-col items-center gap-3 p-6 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl hover:border-primary-500 hover:shadow-xl hover:scale-105 transition-all duration-300"
                >
                  <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center group-hover:bg-primary-500 transition-colors">
                    <svg className="w-7 h-7 text-blue-600 dark:text-blue-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                    </svg>
                  </div>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300 text-center">Lawyer</span>
                </a>

                {/* Doctor */}
                <a
                  href="/professionals?cat=Medical"
                  className="group flex flex-col items-center gap-3 p-6 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl hover:border-primary-500 hover:shadow-xl hover:scale-105 transition-all duration-300"
                >
                  <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center group-hover:bg-primary-500 transition-colors">
                    <svg className="w-7 h-7 text-red-600 dark:text-red-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300 text-center">Doctor</span>
                </a>

                {/* Accountant */}
                <a
                  href="/professionals?cat=Financial"
                  className="group flex flex-col items-center gap-3 p-6 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl hover:border-primary-500 hover:shadow-xl hover:scale-105 transition-all duration-300"
                >
                  <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center group-hover:bg-primary-500 transition-colors">
                    <svg className="w-7 h-7 text-green-600 dark:text-green-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300 text-center">Accountant</span>
                </a>

                {/* Engineer */}
                <a
                  href="/professionals?cat=Engineering"
                  className="group flex flex-col items-center gap-3 p-6 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl hover:border-primary-500 hover:shadow-xl hover:scale-105 transition-all duration-300"
                >
                  <div className="w-14 h-14 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center group-hover:bg-primary-500 transition-colors">
                    <svg className="w-7 h-7 text-orange-600 dark:text-orange-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300 text-center">Engineer</span>
                </a>

                {/* View All */}
                <a
                  href="/professionals"
                  className="group flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-primary-500 to-blue-600 border-2 border-primary-500 rounded-2xl hover:from-primary-600 hover:to-blue-700 hover:shadow-xl hover:scale-105 transition-all duration-300"
                >
                  <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <span className="text-sm font-bold text-white text-center">View All</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Professionals */}
        <section className="py-24 bg-slate-50/50 dark:bg-slate-900/20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-6">
              <div className="max-w-xl text-left">
                <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-3">Featured Specialists</h2>
                <p className="text-slate-500 font-medium">Hand-picked professionals for immediate high-trust sessions.</p>
              </div>
              <Link href="/professionals" className="flex items-center gap-2 text-primary-600 font-black text-[10px] uppercase tracking-widest hover:gap-4 transition-all">
                See Full Network <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {loading ? (
                // Loading skeleton
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 animate-pulse">
                    <div className="flex items-start justify-between mb-8">
                      <div className="w-24 h-24 rounded-3xl bg-slate-200 dark:bg-slate-800"></div>
                      <div className="space-y-2">
                        <div className="w-20 h-6 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
                        <div className="w-16 h-6 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-3/4"></div>
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
                      <div className="flex gap-2">
                        <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-xl w-20"></div>
                        <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-xl w-24"></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : featuredProfessionals.length > 0 ? (
                featuredProfessionals.map(expert => (
                  <ExpertCard key={expert.id} expert={expert} />
                ))
              ) : (
                <div className="col-span-3 text-center py-12">
                  <p className="text-slate-500 dark:text-slate-400">No featured professionals available at the moment.</p>
                  <Link href="/professionals" className="text-primary-600 hover:text-primary-700 font-bold mt-2 inline-block">
                    Browse all professionals →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* The Trust Loop */}
        <section className="py-24">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-4">The Trust Loop</h2>
              <p className="text-slate-500 font-medium max-w-xl mx-auto">Our three-step framework for professional resolution in Bangladesh.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
              <div className="hidden md:block absolute top-12 left-0 w-full h-px bg-slate-100 dark:bg-slate-800 z-0"></div>
              {[
                { icon: Search, title: "1. Vetting", desc: "Every expert is audited for credentials and professional ethics before joining." },
                { icon: Zap, title: "2. Handshake", desc: "Select a high-fidelity time slot or connect instantly for urgent matters." },
                { icon: Shield, title: "3. Resolution", desc: "Engage in end-to-end encrypted calls. Your privacy is our priority." }
              ].map((step, idx) => (
                <div key={idx} className="relative z-10 flex flex-col items-center text-center group">
                  <div className="w-20 h-20 bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 flex items-center justify-center mb-8 shadow-xl group-hover:border-primary-500 transition-all group-hover:-translate-y-2">
                    <step.icon className="w-8 h-8 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white mb-4 uppercase tracking-tight">{step.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed max-w-[250px] font-medium">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-24 bg-slate-50 dark:bg-slate-900/50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              <div className="space-y-8 text-left">
                <h2 className="text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-tight">
                  Trusted by the <br /> <span className="text-primary-600">Expert Class</span>
                </h2>
                <div className="grid grid-cols-2 gap-8">
                  {[
                    { icon: Target, label: "Platform Uptime", val: "99.9%" },
                    { icon: Award, label: "Verified Sectors", val: "10+" },
                    { icon: Users, label: "Client Success", val: "10k+" },
                    { icon: Shield, label: "E2E Secured", val: "100%" }
                  ].map((stat, i) => (
                    <div key={i} className="space-y-1">
                      <stat.icon className="w-5 h-5 text-primary-500 mb-3" />
                      <p className="text-2xl font-black text-slate-900 dark:text-white">{stat.val}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                {TESTIMONIALS.map(t => (
                  <div key={t.id} className="glass p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl flex gap-6 items-start hover:-translate-y-1 transition-all">
                    <img src={t.avatar} className="w-14 h-14 rounded-2xl border-2 border-white/10" alt={t.name} />
                    <div className="text-left">
                      <p className="text-slate-600 dark:text-slate-300 italic mb-4 text-sm leading-relaxed font-medium">&quot;{t.content}&quot;</p>
                      <h4 className="font-black text-slate-900 dark:text-white text-[10px] uppercase tracking-widest">{t.name}</h4>
                      <p className="text-[9px] text-primary-600 font-black uppercase mt-1">{t.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-4">
          <div className="max-w-6xl mx-auto bg-primary-600 rounded-[3rem] p-16 md:p-24 text-center relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/10 to-transparent opacity-30"></div>
            <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter mb-10 leading-tight relative z-10">
              Professional Access. <br/> Zero Friction.
            </h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 relative z-10">
              <Link 
                href="/register"
                className="w-full sm:w-auto bg-white text-primary-600 px-12 py-6 rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-105 transition-all active:scale-95"
              >
                Sign Up for Free
              </Link>
              <Link 
                href="/contact"
                className="w-full sm:w-auto bg-primary-700/50 text-white border-2 border-white/20 px-12 py-6 rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-primary-700 transition-all active:scale-95"
              >
                Talk to Support
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-24 border-t border-slate-200 dark:border-slate-900 bg-slate-50 dark:bg-slate-950">
          <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-16">
            <div className="space-y-6 text-left">
              <Link href="/" className="flex items-center gap-2">
                <Shield className="w-8 h-8 text-primary-600" />
                <span className="font-black text-slate-900 dark:text-white text-2xl tracking-tighter">ProfessionalsBD</span>
              </Link>
              <p className="text-sm text-slate-500 leading-relaxed font-medium">
                The high-trust expert network platform for the Bangladeshi digital economy.
              </p>
            </div>
            {['Network', 'Platform', 'Legal'].map((group, idx) => (
              <div key={idx} className="text-left">
                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-8">{group}</h4>
                <ul className="space-y-4">
                  <li><Link href="/professionals" className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-primary-600 transition-colors">Find Experts</Link></li>
                  <li><Link href="/about" className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-primary-600 transition-colors">How it Works</Link></li>
                  <li><Link href="/contact" className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-primary-600 transition-colors">Corporate Support</Link></li>
                  <li><Link href="/terms" className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-primary-600 transition-colors">Legal Terms</Link></li>
                </ul>
              </div>
            ))}
          </div>
          <div className="max-w-7xl mx-auto px-4 mt-24 pt-12 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-8">
            <p className="text-[10px] text-slate-500 uppercase font-black tracking-[0.3em]">© 2026 ProfessionalsBD Network. Dhaka Hub.</p>
            <div className="flex gap-8">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Secure TLS 1.3</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">ISO 27001 Certified</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
