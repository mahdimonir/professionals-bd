'use client';

import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-context';
import { Role } from '@/lib/types';
import {
  Briefcase,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Sun,
  UserCircle,
  X
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

interface NavbarProps {
  isScrolled?: boolean;
}

export default function Navbar({ isScrolled: propScrolled }: NavbarProps) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const pathname = usePathname();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [isScrolled, setIsScrolled] = useState(propScrolled || false);

  useEffect(() => {
    if (propScrolled !== undefined) return;
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 80);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [propScrolled]);

  const textClass = isScrolled 
    ? (theme === 'dark' ? 'text-white' : 'text-slate-900') 
    : (theme === 'dark' ? 'text-white' : 'text-slate-800');
    
  const linkClass = isScrolled
    ? (theme === 'dark' ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-primary-600')
    : (theme === 'dark' ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-primary-600');

  // Helper to check if user can see dashboard
  const canAccessDashboard = user && user.role !== Role.USER;

  return (
    <nav className={`fixed top-0 z-[999] w-full transition-all duration-300 ${isScrolled ? 'bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 py-2 shadow-sm' : 'bg-transparent py-4'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-12 shrink-0">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="group-hover:scale-110 transition-transform duration-300">
                <Image 
                  src="/ProBD-Logo.png" 
                  alt="ProfessionalsBD Logo" 
                  width={150} 
                  height={150} 
                  className="w-6 h-6 object-contain"
                  priority
                />
              </div>
              <span className={`text-xl font-black tracking-tight transition-colors ${textClass}`}>
                Professionals<span className="text-primary-600">BD</span>
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              {['Professionals', 'About', 'Contact'].map(item => (
                <Link 
                  key={item} 
                  href={item === 'Professionals' ? '/professionals' : `/${item.toLowerCase()}`} 
                  className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${linkClass}`}
                >
                  {item}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
             {/* Mobile Menu Button - Visible < md */}
             <div className="md:hidden flex items-center gap-4">
                <button 
                  onClick={toggleTheme}
                  className={`p-2.5 rounded-full transition-all border ${theme === 'dark' ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'}`}
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
                <button 
                   onClick={() => setShowUserDropdown(!showUserDropdown)} 
                   className={`p-2 rounded-xl border ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                >
                   {showUserDropdown ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
             </div>

             {/* Desktop Menu - Hidden < md */}
             <div className="hidden md:flex items-center space-x-6">
                <button 
                  onClick={toggleTheme}
                  className={`p-2.5 rounded-full transition-all border ${theme === 'dark' ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'} hover:scale-110`}
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>

                {user ? (
                  <div className="relative">
                    <button 
                      onClick={() => setShowUserDropdown(!showUserDropdown)}
                      className={`flex items-center gap-3 p-1.5 pr-4 rounded-full border transition-all group ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}
                    >
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full border border-white/10 shadow-lg object-cover" />
                      ) : (
                        <UserCircle className={`w-8 h-8 rounded-full border border-white/10 shadow-lg ${theme === 'dark' ? 'text-slate-200' : 'text-slate-600'}`} />
                      )}
                      <span className={`text-xs font-bold transition-colors ${textClass}`}>
                        {user.name.split(' ')[0]}
                      </span>
                      <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showUserDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    {showUserDropdown && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowUserDropdown(false)}></div>
                        <div className="absolute right-0 mt-3 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl py-3 z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                          <Link href="/profile" onClick={() => setShowUserDropdown(false)} className="flex items-center gap-3 px-6 py-3.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-primary-600 dark:hover:text-white transition-all">
                            <UserCircle className="w-4 h-4 text-primary-500" /> Profile
                          </Link>
                          {canAccessDashboard && (
                            <Link href="/dashboard" onClick={() => setShowUserDropdown(false)} className="flex items-center gap-3 px-6 py-3.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-primary-600 dark:hover:text-white transition-all">
                              <LayoutDashboard className="w-4 h-4 text-primary-500" /> Dashboard
                            </Link>
                          )}
                          <div className="h-px bg-slate-100 dark:bg-slate-800 my-2 mx-4"></div>
                          <button onClick={() => { logout(); setShowUserDropdown(false); }} className="w-full flex items-center gap-3 px-6 py-3.5 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all">
                            <LogOut className="w-4 h-4" /> Sign Out
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Link href="/login" className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 transition-colors ${linkClass}`}>Sign In</Link>
                    <Link href="/register" className="bg-primary-600 hover:bg-primary-500 text-white px-7 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-primary-600/30 hover:-translate-y-0.5 active:scale-95">Register</Link>
                  </div>
                )}
             </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {showUserDropdown && (
        <>
          {/* Backdrop */}
          <div 
            className="md:hidden fixed inset-0 z-[1000] bg-slate-900/20 backdrop-blur-sm"
            onClick={() => setShowUserDropdown(false)}
          />

          {/* Side Drawer */}
          <div className="md:hidden fixed inset-y-0 right-0 z-[1001] w-[75%] max-w-sm bg-white dark:bg-slate-950 p-6 flex flex-col gap-6 animate-in slide-in-from-right duration-300 shadow-2xl border-l border-slate-100 dark:border-slate-800 overflow-y-auto no-scrollbar">
             
             {/* Close Button Header */}
             <div className="flex items-center justify-end mb-2">
                <button 
                   onClick={() => setShowUserDropdown(false)}
                   className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
                >
                   <X className="w-6 h-6 text-slate-500" />
                </button>
             </div>

             {user && (
               <Link 
                 href="/profile" 
                 onClick={() => setShowUserDropdown(false)}
                 className="flex items-center gap-4 p-4 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 active:scale-95 transition-transform group"
               >
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full border border-slate-200 dark:border-slate-800 group-hover:border-primary-500 transition-colors object-cover" />
                  ) : (
                    <UserCircle className="w-12 h-12 rounded-full border border-slate-200 dark:border-slate-800 group-hover:border-primary-500 transition-colors text-slate-400" />
                  )}
                  <div>
                     <p className="font-bold text-lg text-slate-900 dark:text-white leading-tight">{user.name}</p>
                     <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">{user.role}</p>
                     <p className="text-[10px] text-primary-600 font-bold mt-1 group-hover:underline">View Profile</p>
                  </div>
               </Link>
             )}

             <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 pl-2">Navigation</p>
                
                {/* 1. Dashboard (if allowed) */}
                {canAccessDashboard && (
                  <Link href="/dashboard" onClick={() => setShowUserDropdown(false)} className="block px-4 py-3.5 rounded-2xl text-base font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-primary-600 dark:hover:text-white transition-all">
                     Dashboard
                  </Link>
                )}

                {/* 2. Standard Links */}
                {['Professionals', 'About', 'Contact'].map(item => (
                  <Link 
                    key={item} 
                    href={item === 'Professionals' ? '/professionals' : `/${item.toLowerCase()}`} 
                    onClick={() => setShowUserDropdown(false)}
                    className="block px-4 py-3.5 rounded-2xl text-base font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-primary-600 dark:hover:text-white transition-all"
                  >
                    {item}
                  </Link>
                ))}

                {/* 3. Become a Pro (for regular users only) */}
                {user && user.role === Role.USER && !user.professionalProfile && (
                  <Link 
                    href="/become-a-pro" 
                    onClick={() => setShowUserDropdown(false)}
                    className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-gradient-to-r from-primary-600 to-indigo-600 text-white font-bold text-base mt-2"
                  >
                    <Briefcase className="w-5 h-5" />
                    Become a Pro
                  </Link>
                )}
             </div>

             <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800">
                {user ? (
                   <button 
                    onClick={() => { logout(); setShowUserDropdown(false); }}
                    className="w-full py-4 rounded-2xl bg-red-50 dark:bg-red-900/10 text-red-500 font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2"
                   >
                      <LogOut className="w-4 h-4" /> Sign Out
                   </button>
                ) : (
                  <div className="space-y-4">
                    <Link 
                      href="/login" 
                      onClick={() => setShowUserDropdown(false)}
                      className="block w-full py-4 rounded-xl border border-slate-200 dark:border-slate-800 text-center font-bold text-sm uppercase tracking-widest text-slate-600 dark:text-slate-300"
                    >
                      Sign In
                    </Link>
                    <Link 
                      href="/register" 
                      onClick={() => setShowUserDropdown(false)}
                      className="block w-full py-4 rounded-xl bg-primary-600 text-center font-bold text-sm uppercase tracking-widest text-white shadow-lg shadow-primary-600/20"
                    >
                      Register
                    </Link>
                  </div>
                )}
             </div>
          </div>
        </>
      )}
    </nav>
  );
}
