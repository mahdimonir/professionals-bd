import { useAuth } from '@/contexts/auth-context';
import { authService } from '@/lib/services/auth-service';
import { CloudinaryService } from '@/lib/services/cloudinary-service';
import { Loader2, Settings as SettingsIcon, Upload, X } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';

interface ProfileAvatarProps {
  user: any;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  canEdit?: boolean;
}

export function ProfileAvatar({ user, className = '', size = 'lg', canEdit = true }: ProfileAvatarProps) {
  const { refreshSession } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  
  // Dialog States
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const sizeClasses = {
      sm: 'w-12 h-12 text-lg',
      md: 'w-16 h-16 text-xl',
      lg: 'w-24 h-24 text-3xl'
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setShowActionDialog(false);
      setShowPreviewDialog(true);
      
      // Reset input so same file can be selected again if needed
      e.target.value = '';
  };

  const handleUploadConfirm = async () => {
      if (!selectedFile) return;

      try {
          setIsUploading(true);
          toast.loading('Uploading avatar...', { id: 'avatar-upload' });
          
          // 1. Upload to Cloudinary
          const result = await CloudinaryService.uploadFile(selectedFile, 'avatars');
          
          // 2. Update Backend & Local Session
          // Using authService because it handles localStorage update automatically
          await authService.updateProfile({ avatar: result.secure_url });
          
          // 3. Refresh Session (to trigger context updates)
          refreshSession();
          
          toast.success('Avatar updated successfully');
          setShowPreviewDialog(false);
          setPreviewUrl(null);
          setSelectedFile(null);
      } catch (error) {
          console.error(error);
          toast.error('Failed to update avatar');
      } finally {
          setIsUploading(false);
          toast.dismiss('avatar-upload');
      }
  };

  const handleViewAvatar = () => {
    if (user?.avatar) {
      setShowViewer(true);
    }
    setShowActionDialog(false);
  };

  const handleAvatarClick = () => {
      if (!canEdit) {
          if (user?.avatar) setShowViewer(true);
          return;
      }
      if (!isUploading) setShowActionDialog(true);
  };

  return (
    <>
      <div 
        className={`relative group mx-auto mb-4 cursor-pointer w-fit ${className}`}
        onClick={handleAvatarClick}
      >
          <div className={`${sizeClasses[size]} bg-gradient-to-tr from-primary-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-black overflow-hidden relative shadow-lg`}>
            {user?.avatar ? (
              <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              user.name?.charAt(0)?.toUpperCase() || 'U'
            )}
             {/* Hover Overlay */}
             {canEdit && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <SettingsIcon className="w-6 h-6 text-white" />
                </div>
             )}
          </div>
          
           {/* Hidden Input only triggered via button */}
           {canEdit && (
               <input 
                   type="file" 
                   accept="image/*"
                   className="hidden"
                   id={`avatar-upload-input-${size}`}
                   onChange={handleFileSelect}
               />
           )}
      </div>

      {/* Action Dialog (View / Change) */}
      {showActionDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowActionDialog(false)} />
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white text-center">Profile Photo</h3>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={handleViewAvatar}
                disabled={!user?.avatar}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Upload className="w-5 h-5 rotate-180" /> {/* Eye icon fallback or similar */}
                </div>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">View</span>
              </button>
              <button 
                onClick={() => document.getElementById(`avatar-upload-input-${size}`)?.click()}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Upload className="w-5 h-5" />
                </div>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Change</span>
              </button>
            </div>
            <button 
              onClick={() => setShowActionDialog(false)}
              className="w-full py-3 rounded-lg text-slate-500 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Avatar Viewer Dialog */}
      {showViewer && user?.avatar && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowViewer(false)} />
            <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Profile Photo</h3>
                    <button 
                        onClick={() => setShowViewer(false)}
                        className="p-1 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <img 
                        src={user.avatar} 
                        alt={user.name} 
                        className="w-full h-full object-contain"
                    />
                </div>
            </div>
         </div>
      )}

      {/* Preview Confirmation Dialog */}
      {showPreviewDialog && previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => !isUploading && setShowPreviewDialog(false)} />
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden p-6 text-center space-y-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Update Profile Photo?</h3>
            
            <div className="w-32 h-32 mx-auto rounded-full overflow-hidden border-4 border-white dark:border-slate-800 shadow-lg">
              <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => {
                  setShowPreviewDialog(false);
                  setPreviewUrl(null);
                  setSelectedFile(null);
                }}
                disabled={isUploading}
                className="flex-1 py-3 rounded-xl font-bold text-sm bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleUploadConfirm}
                disabled={isUploading}
                className="flex-1 py-3 rounded-xl font-bold text-sm bg-primary-600 text-white hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
              >
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
