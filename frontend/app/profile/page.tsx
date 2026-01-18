'use client';

import { BillingTab } from '@/components/profile/billing-tab';
import { BookingsTab } from '@/components/profile/bookings-tab';
import DisputesTab from '@/components/profile/disputes-tab';
import { DownloadModal } from '@/components/profile/download-modal';
import { OverviewTab } from '@/components/profile/overview-tab';
import { PersonalInfoTab } from '@/components/profile/personal-info-tab';
import { QuickDetailsCompact, QuickDetailsFull, TABS, TabType } from '@/components/profile/quick-details';
import { ReviewsTab } from '@/components/profile/reviews-tab';
import ConfirmationDialog from '@/components/ui/confirmation-dialog';
import Navbar from '@/components/ui/navbar';
import { useAuth } from '@/contexts/auth-context';
import { authService } from '@/lib/services/auth-service';
import { BookingService } from '@/lib/services/booking-service';
import { DisputeService } from '@/lib/services/dispute-service';
import { PaymentService } from '@/lib/services/payment-service';
import { ReviewService } from '@/lib/services/review-service';
import { ProfessionalDocument, Role } from '@/lib/types';
import { Loader2, RefreshCw, Star, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, checkAuth } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Sync tab with URL query param
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && TABS.some(t => t.id === tabParam)) {
        setActiveTab(tabParam as TabType);
    }
  }, [searchParams]);

  const handleTabChange = (tabId: TabType) => {
      setActiveTab(tabId);
      // Optional: Update URL without reloading
      router.push(`/profile?tab=${tabId}`, { scroll: false });
  };
  
  const dataFetchedRef = useRef(false);
  
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
    // Professional fields
    title: '',
    specialties: [] as string[],
    sessionPrice: '',
    experience: '',
    languages: [] as string[],
    linkedinUrl: '',
    cvUrl: '',
    certifications: [] as ProfessionalDocument[],
    education: [] as ProfessionalDocument[],
  });

  // Email change states
  const [showEmailChange, setShowEmailChange] = useState(false);
  const [emailChangeStep, setEmailChangeStep] = useState<'request' | 'verify'>('request');
  const [newEmail, setNewEmail] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailChanging, setEmailChanging] = useState(false);

  // Data states
  const [bookings, setBookings] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalBookings: 0, totalSpent: 0 });
  const [dataLoading, setDataLoading] = useState(false);
  const [isRefetching, setIsRefetching] = useState(false);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Password change states
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordChanging, setPasswordChanging] = useState(false);

  // Download states
  const [downloadingBookings, setDownloadingBookings] = useState(false);
  const [downloadingPayments, setDownloadingPayments] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadType, setDownloadType] = useState<'bookings' | 'payments'>('bookings');

  // Disputes state
  const [disputes, setDisputes] = useState<any[]>([]);
    
  // New extracted function for fetching data
  const loadAllData = async () => {
      // Parallel data fetching for better performance
      const [bookingsResponse, paymentsResponse, reviewsResponse, disputesResponse] = await Promise.all([
        BookingService.getMyBookings(),
        PaymentService.getPaymentHistory(),
        ReviewService.getMyReviews(),
        DisputeService.getMyDisputes()
      ]);

      // Handle Bookings
      if (bookingsResponse.success) {
        setBookings(bookingsResponse.data || []);
      }

      // Handle Payments
      if (paymentsResponse.success) {
        const paymentData = paymentsResponse.data || [];
        setPayments(paymentData);
        
        // Calculate stats
        const totalSpent = paymentData
          .filter((p: any) => p.status === 'PAID')
          .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
        
        setStats({
          totalBookings: bookingsResponse.data?.length || 0,
          totalSpent,
        });
      }

      // Handle Reviews
      if (reviewsResponse.success) {
        setReviews(reviewsResponse.data || []);
      }

      // Handle Disputes
      if (disputesResponse.success) {
        setDisputes(disputesResponse.data || []);
      }
  };

  const fetchData = useCallback(async () => {
    if (dataFetchedRef.current) return;
    
    dataFetchedRef.current = true;
    setDataLoading(true);
    
    try {
      await loadAllData();
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load profile data');
    } finally {
      setDataLoading(false);
    }
  }, []);

  const handleRefresh = async () => {
      if (isRefetching) return;
      setIsRefetching(true);
      try {
          await loadAllData();
          toast.success("Data refreshed");
      } catch (error) {
          toast.error("Failed to refresh data");
      } finally {
          setIsRefetching(false);
      }
  };

  // Delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);

  const openDeleteConfirm = (reviewId: string) => {
    setReviewToDelete(reviewId);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteReview = async () => {
    if (!reviewToDelete) return;
    
    try {
      await ReviewService.deleteReview(reviewToDelete);
      setReviews(reviews.filter(r => r.id !== reviewToDelete));
      setDeleteConfirmOpen(false);
      setReviewToDelete(null);
      toast.success('Review deleted successfully');
    } catch (error) {
      console.error('Failed to delete review:', error);
      toast.error('Failed to delete review');
    }
  };

  // Edit review state
  const [editingReview, setEditingReview] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState('');

  const handleEditReview = (review: any) => {
    setEditingReview(review.id);
    setEditRating(review.rating);
    setEditComment(review.comment || '');
  };

  const handleUpdateReview = async (reviewId: string) => {
    try {
      await ReviewService.updateReview(reviewId, editRating, editComment);
      setReviews(reviews.map(r => 
        r.id === reviewId ? { ...r, rating: editRating, comment: editComment } : r
      ));
      setEditingReview(null);
      toast.success('Review updated successfully');
    } catch (error) {
      console.error('Failed to update review:', error);
      toast.error('Failed to update review');
    }
  };

  // New review state
  const [showNewReviewModal, setShowNewReviewModal] = useState(false);
  const [newReviewBookingId, setNewReviewBookingId] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');

  const handleSubmitNewReview = async () => {
    if (!newReviewBookingId) {
      toast.error('Please select a booking to review');
      return;
    }
    try {
      const response = await ReviewService.submitReview(newReviewBookingId, newReviewRating, newReviewComment);
      if (response.success) {
        setReviews([...reviews, response.data]);
        setShowNewReviewModal(false);
        setNewReviewBookingId('');
        setNewReviewRating(5);
        setNewReviewComment('');
        toast.success('Review submitted successfully!');
      }
    } catch (error) {
      console.error('Failed to submit review:', error);
      toast.error('Failed to submit review');
    }
  };

  useEffect(() => {
    if (user) {
      const prof = user.professionalProfile;
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || '',
        title: prof?.title || '',
        specialties: prof?.specialties || [],
        sessionPrice: prof?.sessionPrice?.toString() || '',
        experience: prof?.experience?.toString() || '',
        languages: prof?.languages || [],
        linkedinUrl: prof?.linkedinUrl || '',
        cvUrl: prof?.cvUrl || '',
        education: prof?.education || [],
        certifications: prof?.certifications || [],
      });
      
      // Fetch user data only once when user is available
      fetchData();
    }
  }, [user?.id, fetchData]); // Only re-run when user ID changes

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  const isUser = user.role === Role.USER;
  const isProfessional = user.role === Role.PROFESSIONAL;
  const hasPendingChanges = user.professionalProfile?.pendingChanges && Object.keys(user.professionalProfile.pendingChanges).length > 0;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await authService.updateProfile({
        name: formData.name,
        phone: formData.phone,
        bio: formData.bio,
      });
      if (isProfessional) {
        await authService.updateProfessionalProfile({
          title: formData.title,
          specialties: formData.specialties,
          sessionPrice: formData.sessionPrice ? parseFloat(formData.sessionPrice) : undefined,
          experience: formData.experience ? parseInt(formData.experience) : undefined,
          languages: formData.languages,
          linkedinUrl: formData.linkedinUrl,
          cvUrl: formData.cvUrl,
          education: formData.education,
          certifications: formData.certifications,
        });
      }
      await checkAuth();
      setIsEditing(false);
      await checkAuth();
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEmailChangeRequest = async () => {
    if (!newEmail || !emailPassword) {
      toast.error('Please enter new email and password');
      return;
    }
    setEmailChanging(true);
    try {
      const response = await authService.changeEmailRequest({
        currentPassword: emailPassword,
        newEmail,
      });
      if (response.success) {
        setEmailChangeStep('verify');
        toast.success('Verification code sent to your new email!');
      } else {
        toast.error(response.message || 'Failed to send verification code');
      }
    } catch (error:any) {
      toast.error(error.response?.data?.message || 'Failed to request email change');
    } finally {
      setEmailChanging(false);
    }
  };

  const handleEmailChangeVerify = async () => {
    if (!emailOtp) {
      toast.error('Please enter verification code');
      return;
    }
    setEmailChanging(true);
    try {
      const response = await authService.changeEmailVerify({
        newEmail,
        otp: emailOtp,
      });
      if (response.success) {
        toast.success('Email updated successfully! Please log in again.');
        window.location.href = '/login';
      } else {
        toast.error(response.message || 'Invalid verification code');
      }
    } catch (error:any) {
      toast.error(error.response?.data?.message || 'Failed to verify email change');
    } finally {
      setEmailChanging(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill all fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setPasswordChanging(true);
    try {
      const response = await authService.changePassword({
        currentPassword,
        newPassword,
      });
      if (response.success) {
        toast.success('Password changed successfully! Please log in again.');
        window.location.href = '/login';
      } else {
        toast.error(response.message || 'Failed to change password');
      }
    } catch (error:any) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setPasswordChanging(false);
    }
  };

  // ============================================================
  // SECTION 2: TABS (Horizontal for mobile)
  // ============================================================
  const TabsHorizontal = () => (
    <div className="flex gap-2 p-3 bg-slate-50 dark:bg-slate-900 overflow-x-auto no-scrollbar border-b border-slate-200 dark:border-slate-800">
      {TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => handleTabChange(tab.id)}
          className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
            activeTab === tab.id
              ? 'bg-primary-600 text-white'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <tab.icon className="w-3.5 h-3.5" />
          {tab.label}
        </button>
      ))}
    </div>
  );

  // ============================================================
  // SECTION 3: TAB CONTENT
  // ============================================================
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <OverviewTab
            stats={stats}
            dataLoading={dataLoading}
            bookings={bookings}
            payments={payments}
            user={user}
          />
        );

      case 'bookings':
        return (
          <BookingsTab
            dataLoading={dataLoading}
            bookings={bookings}
            downloadingBookings={downloadingBookings}
            setDownloadType={setDownloadType}
            setShowDownloadModal={setShowDownloadModal}
          />
        );

      case 'billing':
        return (
          <BillingTab
            dataLoading={dataLoading}
            payments={payments}
            downloadingPayments={downloadingPayments}
            setDownloadType={setDownloadType}
            setShowDownloadModal={setShowDownloadModal}
          />
        );

      case 'reviews':
        return (
          <ReviewsTab
            reviewsLoading={reviewsLoading}
            reviews={reviews}
            setShowNewReviewModal={setShowNewReviewModal}
            editingReview={editingReview}
            setEditingReview={setEditingReview}
            editRating={editRating}
            setEditRating={setEditRating}
            editComment={editComment}
            setEditComment={setEditComment}
            handleUpdateReview={handleUpdateReview}
            openDeleteConfirm={openDeleteConfirm}
            handleEditReview={handleEditReview}
          />
        );

      case 'support':
        return <DisputesTab bookings={bookings} disputes={disputes} />;

      case 'info':
        return (
          <PersonalInfoTab
            hasPendingChanges={hasPendingChanges}
            isEditing={isEditing}
            formData={formData}
            setFormData={setFormData}
            isProfessional={isProfessional}
            showEmailChange={showEmailChange}
            setShowEmailChange={setShowEmailChange}
            user={user}
            newEmail={newEmail}
            setNewEmail={setNewEmail}
            emailPassword={emailPassword}
            setEmailPassword={setEmailPassword}
            handleEmailChangeRequest={handleEmailChangeRequest}
            emailChanging={emailChanging}
            emailChangeStep={emailChangeStep}
            emailOtp={emailOtp}
            setEmailOtp={setEmailOtp}
            handleEmailChangeVerify={handleEmailChangeVerify}
            showPasswordChange={showPasswordChange}
            setShowPasswordChange={setShowPasswordChange}
            currentPassword={currentPassword}
            setCurrentPassword={setCurrentPassword}
            newPassword={newPassword}
            setNewPassword={setNewPassword}
            confirmPassword={confirmPassword}
            setConfirmPassword={setConfirmPassword}
            handlePasswordChange={handlePasswordChange}
            passwordChanging={passwordChanging}
            handleSave={handleSave}
            isSaving={isSaving}
            setIsEditing={setIsEditing}
          />
        );

      default:
        return null;
    }
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />

      {/* MOBILE LAYOUT */}
      <div className="md:hidden pt-16">
        <QuickDetailsCompact user={user} isProfessional={isProfessional} />
        <TabsHorizontal />
        <div className="p-4 relative">
          <button 
            onClick={handleRefresh}
            disabled={isRefetching}
            className="absolute top-4 right-4 z-10 p-2 text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
             <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin text-primary-600' : ''}`} />
          </button>
          {renderTabContent()}
        </div>
      </div>

      {/* DESKTOP LAYOUT */}
      <div className="hidden md:flex flex-col pt-24 h-screen overflow-hidden px-4 max-w-6xl mx-auto">
        <div className="flex gap-6 h-full pb-6">
          {/* Sidebar */}
          <div className="w-72 shrink-0 h-full overflow-y-auto no-scrollbar rounded-2xl">
            <QuickDetailsFull 
              user={user} 
              isProfessional={isProfessional} 
              activeTab={activeTab} 
              handleTabChange={handleTabChange} 
              hasPendingChanges={hasPendingChanges}
            />
          </div>
          {/* Main Content */}
          <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 relative h-full overflow-y-auto no-scrollbar">
            <button 
                onClick={handleRefresh}
                disabled={isRefetching}
                className="absolute top-6 right-6 z-10 p-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors border border-slate-200 dark:border-slate-700"
                title="Refresh Data"
            >
                <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin text-primary-600' : ''}`} />
            </button>
            {renderTabContent()}
          </div>
        </div>
      </div>
      {/* Download Modal */}
      <DownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        type={downloadType}
      />

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteReview}
        title="Delete Review"
        message="Are you sure you want to delete this review? This action cannot be undone."
        confirmText="Delete Review"
        type="danger"
      />

      {/* New Review Modal */}
      {showNewReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowNewReviewModal(false)} />
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6">Write a Review</h3>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Select Booking</label>
                <select
                  value={newReviewBookingId}
                  onChange={(e) => setNewReviewBookingId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                >
                  <option value="">Select a completed booking...</option>
                  {bookings.filter((b: any) => b.status === 'COMPLETED').map((booking: any) => (
                    <option key={booking.id} value={booking.id}>
                      {booking.professional?.name || 'Professional'} - {new Date(booking.startTime).toLocaleDateString()}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-2 ml-1">You can only review completed bookings</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Rating</label>
                <div className="flex gap-2 p-2 justify-center bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 border-dashed">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setNewReviewRating(star)}
                      className="transition-transform hover:scale-110 active:scale-95 p-1"
                    >
                      <Star className={`w-8 h-8 ${star <= newReviewRating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Comment</label>
                <textarea
                  value={newReviewComment}
                  onChange={(e) => setNewReviewComment(e.target.value)}
                  placeholder="Share your experience working with this professional..."
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none transition-all resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setShowNewReviewModal(false)}
                  className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitNewReview}
                  className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-xl font-bold text-sm hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/20"
                >
                  Submit Review
                </button>
              </div>
            </div>
            
            <button 
              onClick={() => setShowNewReviewModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary-600 animate-spin" />
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}
