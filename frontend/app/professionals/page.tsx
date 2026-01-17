'use client';

import ExpertCard from '@/components/ui/expert-card';
import Navbar from '@/components/ui/navbar';
import { useAuth } from '@/contexts/auth-context';
import { useDebounce } from '@/hooks/use-debounce';
import { CATEGORIES } from '@/lib/constants';
import { AIService } from '@/lib/services/ai-service';
import { ProfessionalService } from '@/lib/services/professional-service';
import { ChevronLeft, ChevronRight, Grid, List, Loader2, Search, SlidersHorizontal, Sparkles } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

const ITEMS_PER_PAGE = 9;

import { Suspense } from 'react';

function ProfessionalsContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const initialSearch = searchParams?.get('q') || '';
  const initialCat = searchParams?.get('cat') || null;

  // State
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [useAI, setUseAI] = useState(false);
  
  const [activeCategory, setActiveCategory] = useState<string | null>(initialCat);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [showFilters, setShowFilters] = useState(false);

  // Fetch Professionals with AI or Basic search
  useEffect(() => {
    const fetchProfessionals = async () => {
      setLoading(true);
      try {
        let response;
        
        if (useAI && debouncedSearch.trim() && user) {
          // AI-powered search
          const aiResponse = await AIService.smartSearch(debouncedSearch);
          response = {
            professionals: aiResponse.data.professionals || [],
            pagination: null
          };
        } else {
          // Basic search
          response = await ProfessionalService.getProfessionals({
            search: debouncedSearch,
            category: activeCategory || undefined,
            page: currentPage,
            limit: ITEMS_PER_PAGE
          });
        }
        
        // Transform the data
        const mapped = (response.professionals || []).map((p: any) => ({
          ...p,
          name: p.user?.name || 'Unknown Professional',
          avatar: p.user?.avatar || '',
          location: p.user?.location || '',
          sessionPrice: p.sessionPrice || 0,
          rates: p.sessionPrice || 0,
          rating: p.rating || 5.0,
          reviews: p.reviewCount || 0,
          category: p.category || 'Professional',
          availability: p.availability || 'Full-Time'
        }));

        setProfessionals(mapped);
        if (response.pagination?.totalPages) {
           setTotalPages(response.pagination.totalPages);
        } else {
           setTotalPages(Math.ceil((response.professionals?.length || 0) / ITEMS_PER_PAGE)); 
        }
      } catch (err) {
        console.error('Failed to fetch professionals:', err);
        setError('Failed to load professionals');
      } finally {
        setLoading(false);
      }
    };

    fetchProfessionals();
  }, [debouncedSearch, activeCategory, currentPage, useAI]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Paginate professionals for display
  const paginatedProfessionals = professionals.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const initialLoading = loading && professionals.length === 0;

  if (initialLoading) {
     return (
       <div className="min-h-screen flex items-center justify-center">
         <Loader2 className="w-12 h-12 text-primary-600 animate-spin" />
       </div>
     );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 text-left">
            <h1 className="text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-4">Elite Experts</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Access high-trust professionals across 10+ industries in Bangladesh.</p>
          </div>

          {/* Search & Filter Bar */}
          <div className="space-y-6 mb-12">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-2 shadow-xl flex flex-row items-center gap-2 transition-shadow hover:shadow-2xl">
              {/* Search Input with AI Toggle */}
              <div className="flex-1 w-full relative flex items-center px-4">
                {loading ? (
                  <Loader2 className="w-5 h-5 text-purple-600 animate-spin shrink-0" />
                ) : useAI ? (
                  <Sparkles className="w-5 h-5 text-purple-600 shrink-0" />
                ) : (
                  <Search className="w-5 h-5 text-slate-400 shrink-0" />
                )}
                <input 
                  type="text" 
                  placeholder={useAI ? "Try: 'Corporate lawyer in Dhaka under ৳5000'" : "Search..."}
                  className="w-full pl-3 pr-4 py-4 bg-transparent outline-none text-slate-800 dark:text-white font-medium text-base placeholder:text-slate-400 min-w-0"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                
                {/* Modern AI Toggle Button - Only for logged-in users */}
                {user && (
                  <button
                    type="button"
                    onClick={() => setUseAI(!useAI)}
                    className={`relative px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 shrink-0 overflow-hidden group ${
                      useAI
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/50'
                        : 'bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-300 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-500'
                    }`}
                    title={useAI ? 'AI Search Active' : 'Enable AI Search'}
                  >
                    <span className="relative z-10 flex items-center gap-1.5">
                      {useAI ? <Sparkles className="w-3.5 h-3.5" /> : null}
                      <span>AI</span>
                    </span>
                    {useAI && (
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-400 opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                    )}
                  </button>
                )}
              </div>
              
              <div className="hidden md:block h-12 w-px bg-slate-100 dark:bg-slate-800 shrink-0"></div>
              
              <div className="flex items-center gap-3 shrink-0 pr-2">
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-6 py-4 rounded-[1.8rem] font-black text-[10px] uppercase tracking-widest transition-all ${showFilters || activeCategory ? 'bg-primary-600 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span className="hidden md:inline">Filters</span>
                </button>
                
                <div className="hidden md:flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 p-1.5 rounded-[1.8rem] border border-slate-100 dark:border-slate-700">
                  <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-3 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-900 text-primary-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setViewMode('list')}
                    className={`p-3 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-900 text-primary-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Category Filters - Toggleable */}
            {(showFilters || activeCategory) && (
              <div className="relative group animate-in slide-in-from-top-4 duration-300">
                {/* Fade gradients for scroll indication */}
                <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-slate-50 dark:from-slate-950 to-transparent z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-slate-50 dark:from-slate-950 to-transparent z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar scroll-smooth -mx-4 px-4 md:mx-0 md:px-0">
                  <button 
                    onClick={() => setActiveCategory(null)}
                    className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap border-2 ${activeCategory === null ? 'bg-primary-600 text-white border-primary-600 shadow-xl shadow-primary-600/30' : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800 hover:border-primary-500'}`}
                  >
                    All Industries
                  </button>
                  {CATEGORIES.map(cat => (
                    <button 
                      key={cat}
                      onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                      className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap border-2 ${activeCategory === cat ? 'bg-primary-600 text-white border-primary-600 shadow-xl shadow-primary-600/30' : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-100 dark:border-slate-800 hover:border-primary-500 hover:text-primary-600'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Results Meta */}
          <div className="flex items-center justify-between mb-10 px-6">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              Showing <span className="text-primary-600">{paginatedProfessionals.length}</span> of {professionals.length} Verified Members
            </p>
            {loading && professionals.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-purple-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Updating...</span>
              </div>
            )}
          </div>
          {/* Expert Feed */}
          {error ? (
            <div className="py-40 text-center bg-red-50 dark:bg-red-900/20 rounded-[4rem] border border-red-200 dark:border-red-800">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          ) : paginatedProfessionals.length > 0 ? (
            <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10" : "flex flex-col gap-8"}>
              {paginatedProfessionals.map(expert => (
                <ExpertCard key={expert.id} expert={expert} />
              ))}
            </div>
          ) : (
            <div className="py-40 text-center bg-white dark:bg-slate-900 rounded-[4rem] border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-500">
              <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Search className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">No experts found</h3>
              <p className="text-slate-500 mt-2 font-medium">Try broader keywords or different industry categories.</p>
              <button 
                onClick={() => { setSearchTerm(''); setActiveCategory(null); }} 
                className="mt-8 text-primary-600 font-black text-[10px] uppercase tracking-widest hover:underline"
              >
                Reset All Filters
              </button>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-20 flex items-center justify-center gap-2">
               {/* Prev Button */}
               <button 
                 onClick={() => handlePageChange(currentPage - 1)}
                 disabled={currentPage === 1}
                 className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-400 font-black flex items-center justify-center border border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
               >
                 <ChevronLeft className="w-4 h-4" />
               </button>

               {/* Page Numbers */}
               {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                 <button
                   key={page}
                   onClick={() => handlePageChange(page)}
                   className={`w-10 h-10 rounded-xl font-black flex items-center justify-center border transition-all ${
                     currentPage === page
                       ? 'bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-600/20'
                       : 'bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-primary-500'
                   }`}
                 >
                   {page}
                 </button>
               ))}

               {/* Next Button */}
               <button 
                 onClick={() => handlePageChange(currentPage + 1)}
                 disabled={currentPage === totalPages}
                 className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-400 font-black flex items-center justify-center border border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
               >
                 <ChevronRight className="w-4 h-4" />
               </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProfessionalsPage() {
  return (
    <Suspense fallback={
       <div className="min-h-screen flex items-center justify-center">
         <Loader2 className="w-12 h-12 text-primary-600 animate-spin" />
       </div>
    }>
      <ProfessionalsContent />
    </Suspense>
  );
}
