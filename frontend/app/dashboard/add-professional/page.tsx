'use client';

import Navbar from '@/components/ui/navbar';
import { useAuth } from '@/contexts/auth-context';
import { AdminService } from '@/lib/services/admin-service';
import { CloudinaryService } from '@/lib/services/cloudinary-service';
import { Role } from '@/lib/types';
import { ArrowLeft, CheckCircle, FileText, Loader2, Plus, Send, Upload, User, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const CATEGORIES = [
  'Technology', 'Business', 'Legal', 'Healthcare', 'Education', 
  'Finance', 'Marketing', 'Design', 'Engineering', 'Other'
];

const LANGUAGES = ['English', 'Bengali', 'Hindi', 'Arabic', 'Spanish', 'French', 'German'];

export default function AddProfessionalPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otpEmail, setOTPEmail] = useState('');
  const [otp, setOTP] = useState('');
  const [devOTP, setDevOTP] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    // User info
    name: '',
    email: '',
    password: '',
    phone: '',
    bio: '',
    location: '',
    avatar: '',
    // Professional info
    title: '',
    category: '',
    specialties: '',
    sessionPrice: '',
    experience: '',
    languages: [] as string[],
    linkedinUrl: '',
    cvUrl: '',
    platformCommission: '30',
  });

  const [uploading, setUploading] = useState<string | null>(null);

  const handleFileUpload = async (file: File, field: string) => {
    try {
      setUploading(field);
      const folder = field === 'avatar' ? 'avatars' : 'documents';
      const result = await CloudinaryService.uploadFile(file, folder);
      setFormData(prev => ({ ...prev, [field]: result.secure_url }));
      toast.success('Upload complete');
    } catch (error) {
      toast.error('Upload failed');
      console.error(error);
    } finally {
      setUploading(null);
    }
  };

  useEffect(() => {
    if (!authLoading && (!user || user.role !== Role.ADMIN)) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleLanguage = (lang: string) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter(l => l !== lang)
        : [...prev.languages, lang]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await AdminService.addDraftProfessional({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone || undefined,
        avatar: formData.avatar || undefined,
        bio: formData.bio || undefined,
        location: formData.location || undefined,
        title: formData.title,
        category: formData.category,
        specialties: formData.specialties.split(',').map(s => s.trim()).filter(Boolean),
        sessionPrice: parseFloat(formData.sessionPrice) || 0,
        experience: parseInt(formData.experience) || 0,
        languages: formData.languages,
        linkedinUrl: formData.linkedinUrl || undefined,
        cvUrl: formData.cvUrl || undefined,
        platformCommission: parseFloat(formData.platformCommission) || 30,
      });

      if (response.success) {
        setOTPEmail(formData.email);
        setDevOTP(response.data.otp || '');
        setShowOTPModal(true);
      } else {
        setError('Failed to create professional');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOTP = async () => {
    setVerifying(true);
    setError('');

    try {
      const response = await AdminService.verifyDraftProfessional(otpEmail, otp);
      if (response.success) {
        setSuccess(true);
        setShowOTPModal(false);
        setTimeout(() => router.push('/dashboard'), 2000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setVerifying(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary-600" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50 dark:bg-slate-950">
        <div className="text-center">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Professional Added!</h1>
          <p className="text-slate-500">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 pt-28 pb-20">
        <Link 
          href="/dashboard" 
          className="inline-flex items-center gap-2 text-slate-500 hover:text-primary-600 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center">
              <User className="w-7 h-7 text-primary-600" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white">Add Professional</h1>
              <p className="text-slate-500 text-sm">Create a new verified professional account</p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* User Information */}
            <div>
              <h2 className="font-black text-sm uppercase tracking-widest text-slate-400 mb-4">User Information</h2>
              
              {/* Avatar Upload */}
              <div className="mb-6 flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-slate-700 relative">
                  {formData.avatar ? (
                    <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-slate-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  )}
                </div>
                <div className="relative">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'avatar')}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        disabled={!!uploading}
                    />
                    <button type="button" className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50">
                        {uploading === 'avatar' ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Upload Photo'}
                    </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name *</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email *</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password *</label>
                  <input type="password" name="password" value={formData.password} onChange={handleChange} required minLength={6}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Location</label>
                  <input type="text" name="location" value={formData.location} onChange={handleChange} placeholder="City, Country"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Bio</label>
                  <textarea name="bio" value={formData.bio} onChange={handleChange} rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none" />
                </div>
              </div>
            </div>

            {/* Professional Information */}
            <div>
              <h2 className="font-black text-sm uppercase tracking-widest text-slate-400 mb-4">Professional Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title *</label>
                  <input type="text" name="title" value={formData.title} onChange={handleChange} required placeholder="e.g. Software Engineer"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category *</label>
                  <select name="category" value={formData.category} onChange={handleChange} required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                    <option value="">Select category</option>
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Specialties *</label>
                  <input type="text" name="specialties" value={formData.specialties} onChange={handleChange} required
                    placeholder="Comma separated: React, Node.js, AWS"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Session Price (৳) *</label>
                  <input type="number" name="sessionPrice" value={formData.sessionPrice} onChange={handleChange} required min="0"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Experience (years) *</label>
                  <input type="number" name="experience" value={formData.experience} onChange={handleChange} required min="0"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">LinkedIn URL</label>
                  <input type="url" name="linkedinUrl" value={formData.linkedinUrl} onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">CV / Resume</label>
                   {formData.cvUrl && !formData.cvUrl.startsWith('http') ? (
                       <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                            <FileText className="w-4 h-4 text-slate-500" />
                            <a href={formData.cvUrl} target="_blank" rel="noreferrer" className="text-sm text-primary-600 hover:underline flex-1 truncate">View CV</a>
                            <button type="button" onClick={() => setFormData({...formData, cvUrl: ''})} className="text-red-500 hover:text-red-600"><X className="w-4 h-4"/></button>
                       </div>
                   ) : (
                       <div className="relative border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg p-3 text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                           <input 
                                type="file" 
                                accept=".pdf,.doc,.docx"
                                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'cvUrl')}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                disabled={uploading === 'cvUrl'}
                           />
                           <div className="flex flex-col items-center text-sm text-slate-500">
                               {uploading === 'cvUrl' ? <Loader2 className="w-5 h-5 animate-spin mb-1"/> : <Upload className="w-5 h-5 mb-1"/>}
                               <span>Upload CV</span>
                           </div>
                       </div>
                   )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Platform Commission (%)</label>
                  <input type="number" name="platformCommission" value={formData.platformCommission} onChange={handleChange} min="0" max="100"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Languages *</label>
                  <div className="flex flex-wrap gap-2">
                    {LANGUAGES.map(lang => (
                      <button key={lang} type="button" onClick={() => toggleLanguage(lang)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          formData.languages.includes(lang)
                            ? 'bg-primary-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                        }`}>
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-4">
              <button type="submit" disabled={isSubmitting || formData.languages.length === 0}
                className="w-full bg-primary-600 hover:bg-primary-500 text-white font-black text-sm uppercase tracking-widest py-4 rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {isSubmitting ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Creating...</>
                ) : (
                  <><Plus className="w-5 h-5" /> Create Professional</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* OTP Modal */}
      {showOTPModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">Verify Email</h2>
                <p className="text-sm text-slate-500 mt-1">Enter the OTP sent to {otpEmail}</p>
              </div>
              <button onClick={() => setShowOTPModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {devOTP && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-3 rounded-xl mb-4 text-sm">
                <span className="font-bold">Dev OTP:</span> {devOTP}
              </div>
            )}

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 p-3 rounded-xl mb-4 text-sm">
                {error}
              </div>
            )}

            <input type="text" value={otp} onChange={e => setOTP(e.target.value)} placeholder="Enter 6-digit OTP"
              maxLength={6} 
              className="w-full px-4 py-4 text-center text-2xl font-mono tracking-[0.5em] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 mb-4" />

            <button onClick={handleVerifyOTP} disabled={otp.length !== 6 || verifying}
              className="w-full bg-primary-600 hover:bg-primary-500 text-white font-black text-sm uppercase tracking-widest py-4 rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50">
              {verifying ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Verifying...</>
              ) : (
                <><Send className="w-5 h-5" /> Verify & Activate</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
