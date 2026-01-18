'use client';

import { TimeSlotPicker } from '@/components/booking/time-slot-picker';
import Navbar from '@/components/ui/navbar';
import { useAuth } from '@/contexts/auth-context';
import { BookingService } from '@/lib/services/booking-service';
import { PaymentService } from '@/lib/services/payment-service';
import { ProfessionalService } from '@/lib/services/professional-service';
import { ProfessionalProfile } from '@/lib/types';
import { ArrowRight, Award, Calendar, CheckCircle2, ChevronRight, Clock, CreditCard, FileText, Globe, GraduationCap, Loader2, MapPin, RefreshCcw, Shield, Star, XCircle } from 'lucide-react';
import Image from 'next/image';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function ProfessionalProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfessionalProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Flow State
  const [step, setStep] = useState<'info' | 'booking' | 'payment' | 'status'>('info');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [processingMethod, setProcessingMethod] = useState<'BKASH' | 'SSL_COMMERZ' | 'BOOKING' | null>(null);
  const [downloading, setDownloading] = useState(false);

  // Helper: Future dates for the date picker
  const today = new Date().toISOString().split('T')[0];

  // Helper: Time slots
  const timeSlots = [
      "09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00"
  ];

  const searchParams = useSearchParams();

  useEffect(() => {
    const status = searchParams.get('paymentStatus');
    if (status) {
         setStep('status');
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await ProfessionalService.getProfessionalById(params.id as string);
        setProfile(res.data);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) fetchProfile();
  }, [params.id]);

  // Auto-select next available date
  useEffect(() => {
      if (step === 'booking' && !selectedDate && profile) {
          // Simplistic logic: Set to today. Ideally we fetch next available.
          // Since getAvailableSlots is cheap, we could try a loop, but let's stick to today or user expectation.
          // User asked "default show next available slot". 
          // Implementation: Set 'today' as default. If we wanted "next available", we'd need to query availability.
          // Let's set it to today so the user sees *something*.
          const todayStr = new Date().toISOString().split('T')[0];
          setSelectedDate(todayStr);
      }
  }, [step, selectedDate, profile]);

  const handleStartBooking = () => {
      if (!user) {
          toast.error("Please login to book a consultation");
          router.push('/login');
          return;
      }
      setStep('booking');
  };

  const handleCreateBooking = async () => {
    if (!selectedDate || !selectedTime) {
      toast.error("Please select a date and time");
      return;
    }

    try {
        setProcessingMethod('BOOKING');
        
        // TimeSlotPicker returns full ISO string for the selected slot
        const startDateTime = new Date(selectedTime);
        
        if (isNaN(startDateTime.getTime())) {
            toast.error("Invalid date or time selected");
            return;
        }

        const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // 1 hour

        const res = await BookingService.createBooking({
            professionalId: profile!.userId,
            startTime: startDateTime.toISOString(),
            endTime: endDateTime.toISOString(),
            notes: "Consultation Booking"
        });
        
        if (res.success) {
            setBookingId(res.data.id);
            setStep('payment');
            toast.success("Slot reserved! Proceed to payment.");
        } else {
             toast.error("Failed to reserve slot");
        }

    } catch (error: any) {
        console.error("Booking creation error:", error);
        toast.error(error.response?.data?.message || error.message || "Failed to create booking");
    } finally {
        setProcessingMethod(null);
    }
  };

  const handlePayment = async (method: 'BKASH' | 'SSL_COMMERZ') => {
      if (!bookingId) return;

      try {
          setProcessingMethod(method);
          
          if (method === 'BKASH') {
              const res = await PaymentService.initiateBkash(bookingId, profile!.sessionPrice || 0, "01700000000"); 
              if (res.success && res.data.paymentUrl) { 
                   window.location.href = res.data.paymentUrl; 
              } else {
                   toast.error("Invalid response from bKash");
              }
          } else if (method === 'SSL_COMMERZ') {
              const res = await PaymentService.initiateSslCommerz(bookingId, profile!.sessionPrice || 0, {});
              if (res.success && res.data.paymentUrl) {
                   window.location.href = res.data.paymentUrl;
              } else {
                   toast.error("Invalid response from SSLCommerz");
              }
          }

      } catch (error: any) {
           console.error(error);
           
           // Handle Slot Conflict (409) - Late payment attempt where slot was taken
           if (error.response?.status === 409) {
                toast.error("This slot has expired and been taken. Please select a new time.");
                setStep('booking');
                setBookingId(null);
                setSelectedTime('');
           } else {
                toast.error(error.response?.data?.message || "Payment initiation failed");
           }
      } finally {
           setProcessingMethod(null);
      } 
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            
            {/* Main Info Column (Linear Layout) */}
            <div className="lg:col-span-8 space-y-8">
              
              {/* Hero Section */}
              <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start md:items-center animate-in slide-in-from-bottom-4 duration-700">
                <div className="relative group shrink-0">
                  <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl overflow-hidden border-2 border-white dark:border-slate-800 shadow-xl transition-transform group-hover:scale-105">
                     <img 
                        src={profile.user?.avatar || '/default-avatar.png'} 
                        className="w-full h-full object-cover" 
                        alt={profile.user?.name}
                      />
                  </div>
                  {profile.isVerified && (
                    <div className="absolute -bottom-2 -right-2 bg-primary-600 p-1.5 rounded-xl border-2 border-white dark:border-slate-900 shadow-md">
                      <Shield className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">
                        {profile.user?.name}
                    </h1>
                  </div>
                  <p className="text-lg md:text-xl font-bold text-primary-600 uppercase tracking-tight">
                      {profile.category} Specialist
                  </p>
                  <div className="flex flex-wrap gap-4 text-slate-500 font-medium text-sm">
                    <div className="flex items-center gap-1.5">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" /> {profile.rating?.toFixed(1) || "5.0"} <span className="text-slate-400">({profile.reviewCount || 0})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-primary-500" /> {profile.experience} Years Exp
                    </div>
                    <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-indigo-500" /> {profile.location || 'Dhaka, BD'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Boxed Content Sections */}
              <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-1000 delay-100">
                
                {/* About & Credentials */}
                <section className="bg-white dark:bg-slate-900/50 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-lg">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Expertise & Background</h3>
                  <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {profile.bio || "This professional has not added a bio yet."}
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Academic Foundation</h4>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary-600/10 rounded-lg border border-primary-500/20">
                            <GraduationCap className="w-4 h-4 text-primary-500" />
                          </div>
                          <div className="flex flex-col gap-1">
                            {profile.education && profile.education.length > 0 ? (
                                profile.education.map((edu, i) => (
                                    <span key={i} className="font-bold text-slate-900 dark:text-white text-sm uppercase block">
                                        {edu.name}
                                    </span>
                                ))
                            ) : (
                                <span className="font-bold text-slate-900 dark:text-white text-sm uppercase">Not Listed</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Linguistic Reach</h4>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-indigo-600/10 rounded-lg border border-indigo-500/20">
                            <Globe className="w-4 h-4 text-indigo-500" />
                          </div>
                          <span className="font-bold text-slate-900 dark:text-white text-sm uppercase">{profile.languages?.join(', ') || 'English'}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      {/* Certifications */}
                      <div className="mb-4">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Certifications</h4>
                        <div className="space-y-2">
                             {profile.certifications && profile.certifications.length > 0 ? (
                                profile.certifications.map((cert, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="p-2 bg-emerald-600/10 rounded-lg border border-emerald-500/20">
                                            <Award className="w-4 h-4 text-emerald-500" />
                                        </div>
                                        <div>
                                            <span className="font-bold text-slate-900 dark:text-white text-sm uppercase block">{cert.name}</span>
                                            {cert.doc && (
                                                <a href={cert.doc} target="_blank" rel="noreferrer" className="text-[10px] text-primary-600 hover:underline font-bold uppercase tracking-wider">
                                                    View Credential
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))
                             ) : (
                                <span className="text-sm text-slate-500 italic">No certifications listed</span>
                             )}
                        </div>
                      </div>

                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Specialties</h4>
                      <div className="flex flex-wrap gap-2">
                        {profile.specialties?.map((skill, i) => (
                          <div key={i} className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                            <CheckCircle2 className="w-3.5 h-3.5 text-primary-500" />
                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">{skill}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Reviews Section Placeholder */}
                <section>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 px-2">Recent Feedback</h3>
                    {profile.reviews && profile.reviews.length > 0 ? (
                        <div className="space-y-4">
                            {profile.reviews.map(review => (
                                <div key={review.id} className="bg-white dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center font-bold text-white text-xs">
                                                {review.userName.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-tight">{review.userName}</p>
                                                <p className="text-[10px] text-slate-400 font-medium">{new Date(review.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="flex text-amber-500">
                                            {[...Array(5)].map((_, i) => <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-current' : 'text-slate-200'}`} />)}
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed italic">&quot;{review.comment}&quot;</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="px-2 text-slate-400 text-sm italic">No reviews yet.</div>
                    )}
                </section>

              </div>
            </div>

            {/* Sticky Action Column (Right) */}
            <div className="lg:col-span-4">
              <div className="lg:sticky lg:top-28 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-xl overflow-hidden relative">
                
                {/* Background Decoration */}
                <div className="absolute top-0 right-5 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
                    <Shield className="w-28 h-28" />
                </div>

                {/* STEP 1: INFO */}
                {step === 'info' && (
                  <div className="space-y-6 relative z-10 animate-in fade-in duration-500">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Session Price</p>
                        <p className="text-3xl font-extrabold text-slate-900 dark:text-white">৳{profile.sessionPrice}</p>
                      </div>
                      <div className="text-right absolute top-5 right-0">
                        <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${
                            profile.availabilityStatus === 'Available Now'
                            ? 'bg-green-500/10 text-green-500 border-green-500/20'
                            : 'bg-slate-500/10 text-slate-500 border-slate-500/20'
                        }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                                profile.availabilityStatus === 'Available Now' ? 'bg-green-500 animate-pulse' : 'bg-slate-500'
                            }`}></span> 
                            {profile.availabilityStatus || 'Offline'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-primary-500" />
                          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Standard Duration</span>
                        </div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">60 MINS</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <Award className="w-3.5 h-3.5 text-indigo-500" />
                          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Quality</span>
                        </div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white uppercase">HD VIDEO</span>
                      </div>
                    </div>

                    <button 
                      onClick={handleStartBooking}
                      className="w-full bg-primary-600 hover:bg-primary-500 text-white font-bold py-4 rounded-2xl text-xs uppercase tracking-widest shadow-lg shadow-primary-600/20 transition-all hover:translate-y-[-2px] active:scale-95 flex items-center justify-center gap-2"
                    >
                      Initiate Booking <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    <p className="text-[9px] text-center text-slate-400 uppercase font-bold tracking-widest">
                      Vetted • High Trust • Secure
                    </p>
                  </div>
                )}

                {/* STEP 2: BOOKING (Date/Time) */}
                {step === 'booking' && (
                  <div className="space-y-6 relative z-10 animate-in slide-in-from-right-8 duration-500">
                    <button onClick={() => setStep('info')} className="text-[10px] font-bold uppercase text-slate-400 hover:text-primary-600 flex items-center gap-2 transition-colors">
                      <ArrowRight className="w-3.5 h-3.5 rotate-180" /> Back to Terms
                    </button>
                    
                    <div className="space-y-5">
                      <h3 className="text-xl font-extrabold text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-primary-500" /> Select Slot
                      </h3>
                      
                      {/* Date Input */}
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Date</label>
                        <input 
                            type="date" 
                            min={today}
                            value={selectedDate}
                            onChange={(e) => {
                                setSelectedDate(e.target.value);
                                setSelectedTime(''); // Reset time when date changes
                            }}
                            className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-xl px-3 py-2.5 font-semibold text-sm text-slate-900 dark:text-white focus:outline-none focus:border-primary-500 transition-colors"
                        />
                      </div>

                      {/* Time Grid */}
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Available Slots</label>
                        <TimeSlotPicker 
                            professionalId={profile!.userId} 
                            date={selectedDate} 
                            selectedTime={selectedTime}
                            onSelect={setSelectedTime}
                        />
                      </div>
                      
                      <div className="p-3 bg-primary-600/5 rounded-xl border border-primary-500/10 flex justify-between items-center">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Total</span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">৳{profile.sessionPrice}</span>
                      </div>
                    </div>

                    <button 
                      disabled={!selectedDate || !selectedTime || !!processingMethod}
                      onClick={handleCreateBooking}
                      className="w-full bg-primary-600 hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl text-xs uppercase tracking-widest shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      {processingMethod === 'BOOKING' ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Confirm & Proceed <ChevronRight className="w-3.5 h-3.5" /></>}
                    </button>
                  </div>
                )}

                {/* STEP 3: PAYMENT */}
                {step === 'payment' && (
                  <div className="space-y-6 relative z-10 animate-in slide-in-from-right-8 duration-500">
                    <div className="flex justify-between items-center">
                        <button onClick={async () => {
                            if (bookingId && confirm("Cancel this pending booking?")) {
                                try {
                                    await BookingService.cancelBooking(bookingId, "User cancelled during payment");
                                    setStep('booking');
                                    setBookingId(null);
                                    toast.success("Booking cancelled.");
                                } catch (e) { toast.error("Could not cancel"); }
                            }
                        }} className="text-[10px] font-bold uppercase text-red-400 hover:text-red-500 flex items-center gap-2 transition-colors">
                            <ArrowRight className="w-3.5 h-3.5 rotate-180" /> Cancel Order
                        </button>
                    </div>

                    <div className="space-y-5">
                      <h3 className="text-xl font-extrabold text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                         <CreditCard className="w-5 h-5 text-primary-500" /> Checkout
                      </h3>
                      
                      <div className="space-y-3">
                        {/* bKash Integration Pending
                        <button 
                          onClick={() => handlePayment('BKASH')}
                          disabled={!!processingMethod}
                          className="w-full flex items-center justify-between p-4 bg-[#E2136E]/5 border-2 border-[#E2136E]/10 rounded-2xl hover:bg-[#E2136E]/10 transition-all group disabled:opacity-50"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-5 bg-[#E2136E] rounded flex items-center justify-center text-[9px] font-bold text-white">bKash</div>
                            <span className="font-bold text-xs uppercase text-slate-700 dark:text-slate-300">bKash Payment</span>
                          </div>
                          {processingMethod === 'BKASH' ? <Loader2 className="w-4 h-4 animate-spin text-[#E2136E]" /> : <ChevronRight className="w-4 h-4 text-[#E2136E]" />}
                        </button>
                        */}

                        <button 
                          onClick={() => handlePayment('SSL_COMMERZ')}
                          disabled={!!processingMethod}
                          className="w-full flex items-center justify-between p-4 bg-blue-600/5 border-2 border-blue-500/10 rounded-2xl hover:bg-blue-600/10 transition-all group disabled:opacity-50"
                        >
                          <div className="flex items-center gap-3">
                            <Image 
                              src="/SSLCOMMERZ-logo.png" 
                              alt="SSLCommerz" 
                              width={80}
                              height={32}
                              className="h-8 w-auto object-contain"
                            />
                            <span className="font-bold text-xs uppercase text-slate-700 dark:text-slate-300">SSLCommerz</span>
                          </div>
                          {processingMethod === 'SSL_COMMERZ' ? <Loader2 className="w-4 h-4 animate-spin text-blue-600" /> : <ChevronRight className="w-4 h-4 text-blue-600" />}
                        </button>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Order Summary</span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-[10px] font-bold text-slate-500">
                            <span>Service Fee</span>
                            <span>৳0</span>
                          </div>
                          <div className="flex justify-between text-xs font-black text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-800">
                            <span>Total Payable</span>
                            <span>৳{profile.sessionPrice}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="text-[9px] text-center text-slate-400 uppercase font-bold tracking-widest">
                      Secured by SSL • Bank Grade Encryption
                    </p>
                  </div>
                )}

                {/* STEP 4: PAYMENT STATUS */}
                {step === 'status' && (
                   <div className="space-y-6 relative z-10 animate-in zoom-in duration-500">
                      {(searchParams?.get('paymentStatus') === 'success') && (
                          <>
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center border-4 border-green-500/20 animate-pulse">
                                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-extrabold text-slate-900 dark:text-white uppercase tracking-tight">Booking Confirmed!</h3>
                                    <p className="text-sm font-medium text-slate-500">Your session has been secured.</p>
                                </div>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                                <div className="flex flex-col gap-1">
                                    <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Booking ID</span>
                                    <span className="font-bold text-slate-700 dark:text-slate-300 font-mono break-all">{searchParams.get('bookingId')}</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Transaction ID</span>
                                    <span className="font-bold text-slate-700 dark:text-slate-300 font-mono break-all">{searchParams.get('tranId')}</span>
                                </div>
                            </div>

                            <div className="space-y-3 pt-2">
                                <button 
                                    disabled={downloading}
                                    onClick={async () => {
                                        try {
                                           setDownloading(true);
                                           const paymentId = searchParams.get('paymentId');
                                           if (!paymentId) { toast.error("Invoice not available"); return; }
                                           
                                           // Immediate cue to user
                                           toast.info("Preparing invoice...");

                                           const success = await PaymentService.downloadInvoicePDF(paymentId);
                                           if (success) {
                                                toast.success("Invoice downloaded!");
                                           } else {
                                                toast.error("Invoice not available");
                                           }
                                        } catch (e) { toast.error("Could not download invoice"); }
                                        finally { setDownloading(false); }
                                    }}
                                    className="w-full bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold py-4 rounded-2xl text-xs uppercase tracking-widest shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {downloading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" /> Downloading...
                                        </>
                                    ) : (
                                        <>
                                            <FileText className="w-4 h-4" /> Download Invoice
                                        </>
                                    )}
                                </button>
                                
                                <button 
                                    onClick={() => router.push('/profile?tab=bookings')}
                                    className="w-full bg-primary-600 hover:bg-primary-500 text-white font-bold py-4 rounded-2xl text-xs uppercase tracking-widest shadow-lg shadow-primary-600/20 transition-all hover:translate-y-[-2px] active:scale-95 flex items-center justify-center gap-2"
                                >
                                    Go to My Bookings <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                          </>
                      )}

                      {(searchParams?.get('paymentStatus') === 'failed' || searchParams?.get('paymentStatus') === 'cancelled') && (
                          <>
                             <div className="flex flex-col items-center text-center space-y-4">
                                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center border-4 border-red-500/20">
                                    <XCircle className="w-10 h-10 text-red-500" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-extrabold text-slate-900 dark:text-white uppercase tracking-tight">Payment Failed</h3>
                                    <p className="text-sm font-medium text-slate-500">The transaction was not completed.</p>
                                </div>
                            </div>

                            <button 
                                onClick={() => setStep('payment')}
                                className="w-full bg-primary-600 hover:bg-primary-500 text-white font-bold py-4 rounded-2xl text-xs uppercase tracking-widest shadow-lg shadow-primary-600/20 transition-all hover:translate-y-[-2px] active:scale-95 flex items-center justify-center gap-2"
                            >
                                <RefreshCcw className="w-3.5 h-3.5" /> Retry Payment
                            </button>
                          </>
                      )}
                   </div> 
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
