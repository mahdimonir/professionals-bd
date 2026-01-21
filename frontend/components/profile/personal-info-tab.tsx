import { CloudinaryService } from '@/lib/services/cloudinary-service';
import { ProfessionalDocument } from '@/lib/types';
import { AlertCircle, Briefcase, Check, FileText, Key, Loader2, Lock, Mail, Phone, Plus, Save, Trash2, Upload, User as UserIcon, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface PersonalInfoTabProps {
  hasPendingChanges: boolean;
  isEditing: boolean;
  formData: any;
  setFormData: (data: any) => void;
  isProfessional: boolean;
  showEmailChange: boolean;
  setShowEmailChange: (show: boolean) => void;
  user: any;
  newEmail: string;
  setNewEmail: (email: string) => void;
  emailPassword: string;
  setEmailPassword: (password: string) => void;
  handleEmailChangeRequest: () => void;
  emailChanging: boolean;
  emailChangeStep: 'request' | 'verify';
  emailOtp: string;
  setEmailOtp: (otp: string) => void;
  handleEmailChangeVerify: () => void;
  showPasswordChange: boolean;
  setShowPasswordChange: (show: boolean) => void;
  currentPassword: string;
  setCurrentPassword: (password: string) => void;
  newPassword: string;
  setNewPassword: (password: string) => void;
  confirmPassword: string;
  setConfirmPassword: (password: string) => void;
  handlePasswordChange: () => void;
  passwordChanging: boolean;
  handleSave: () => void;
  isSaving: boolean;
  setIsEditing: (isEditing: boolean) => void;
}

export function PersonalInfoTab({
  hasPendingChanges,
  isEditing,
  formData,
  setFormData,
  isProfessional,
  showEmailChange,
  setShowEmailChange,
  user,
  newEmail,
  setNewEmail,
  emailPassword,
  setEmailPassword,
  handleEmailChangeRequest,
  emailChanging,
  emailChangeStep,
  emailOtp,
  setEmailOtp,
  handleEmailChangeVerify,
  showPasswordChange,
  setShowPasswordChange,
  currentPassword,
  setCurrentPassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  handlePasswordChange,
  passwordChanging,
  handleSave,
  isSaving,
  setIsEditing
}: PersonalInfoTabProps) {
  const [uploading, setUploading] = useState<string | null>(null);

  const handleFileUpload = async (file: File, field: string, index?: number, subField?: 'doc') => {
    try {
      setUploading(`${field}-${index ?? ''}`);
      const folder = field === 'avatar' ? 'avatars' : 'documents';
      const result = await CloudinaryService.uploadFile(file, folder);
      
      if (index !== undefined && subField) {
        // Handle array fields (education, certifications)
        const list = [...(formData[field] || [])];
        if (!list[index]) list[index] = { name: '' };
        list[index] = { ...list[index], [subField]: result.secure_url };
        setFormData({ ...formData, [field]: list });
      } else {
        // Handle simple fields (avatar, cvUrl)
        setFormData({ ...formData, [field]: result.secure_url });
      }
      toast.success('Upload complete');
    } catch (error) {
      toast.error('Upload failed');
      console.error(error);
    } finally {
      setUploading(null);
    }
  };

  const addItem = (field: string) => {
    setFormData({ ...formData, [field]: [...(formData[field] || []), { name: '', doc: '' }] });
  };

  const removeItem = (field: string, index: number) => {
    const list = [...(formData[field] || [])];
    list.splice(index, 1);
    setFormData({ ...formData, [field]: list });
  };

  const updateItem = (field: string, index: number, key: string, value: string) => {
    const list = [...(formData[field] || [])];
    list[index] = { ...list[index], [key]: value };
    setFormData({ ...formData, [field]: list });
  };
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Profile</h2>
        <p className="text-sm text-slate-500">Your profile information</p>
      </div>
      {/* Pending Changes Alert */}
      {hasPendingChanges && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 shrink-0" />
            <div>
              <p className="font-bold text-sm text-yellow-700 dark:text-yellow-400">Pending Profile Changes</p>
              <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-1">
                Your critical field updates are awaiting moderator approval. You can continue using the platform with your current approved data.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Basic Info */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Basic Information</h4>
        <div className="space-y-3">
          {/* Avatar section moved to QuickDetails */}

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
            <div className="relative">
              <input
                type="text"
                disabled={!isEditing}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-10 pr-4 py-3 text-sm disabled:opacity-60"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone</label>
            <div className="relative">
              <input
                type="tel"
                disabled={!isEditing}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-10 pr-4 py-3 text-sm disabled:opacity-60"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
              />
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
          </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Bio</label>
              <textarea
                disabled={!isEditing}
                rows={3}
                placeholder="Tell us about yourself..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm disabled:opacity-60 resize-none"
                value={formData.bio}
                onChange={e => setFormData({ ...formData, bio: e.target.value })}
              />
            </div>
        </div>
      </div>

      {/* Email Change */}
      <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Address</h4>
          <button
            onClick={() => setShowEmailChange(!showEmailChange)}
            className="text-xs font-bold text-primary-600 hover:underline"
          >
            {showEmailChange ? 'Cancel' : 'Change Email'}
          </button>
        </div>
        
        {!showEmailChange ? (
          <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <Mail className="w-4 h-4 text-slate-400" />
            <p className="text-sm text-slate-600 dark:text-slate-300">{user.email}</p>
          </div>
        ) : (
          <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
            {emailChangeStep === 'request' ? (
              <>
                <input
                  type="email"
                  placeholder="New email address"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-sm"
                />
                <input
                  type="password"
                  placeholder="Current password"
                  value={emailPassword}
                  onChange={e => setEmailPassword(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-sm"
                />
                <button
                  onClick={handleEmailChangeRequest}
                  disabled={emailChanging}
                  className="w-full bg-primary-600 text-white py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2"
                >
                  {emailChanging ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                  Send Verification Code
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                  <Check className="w-4 h-4" />
                  Code sent to {newEmail}
                </div>
                <input
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={emailOtp}
                  onChange={e => setEmailOtp(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-sm text-center"
                  maxLength={6}
                />
                <button
                  onClick={handleEmailChangeVerify}
                  disabled={emailChanging}
                  className="w-full bg-primary-600 text-white py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2"
                >
                  {emailChanging ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Verify & Update Email
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Password Change */}
      <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Password</h4>
          <button
            onClick={() => setShowPasswordChange(!showPasswordChange)}
            className="text-xs font-bold text-primary-600 hover:underline"
          >
            {showPasswordChange ? 'Cancel' : 'Change Password'}
          </button>
        </div>

        {showPasswordChange && (
          <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
            <div className="relative">
              <input
                type="password"
                placeholder="Current password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg pl-10 pr-4 py-3 text-sm"
              />
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
            <div className="relative">
              <input
                type="password"
                placeholder="New password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg pl-10 pr-4 py-3 text-sm"
              />
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
            <div className="relative">
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg pl-10 pr-4 py-3 text-sm"
              />
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
            <button
              onClick={handlePasswordChange}
              disabled={passwordChanging}
              className="w-full bg-primary-600 text-white py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2"
            >
              {passwordChanging ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              Update Password
            </button>
          </div>
        )}
      </div>

      {/* Professional Info */}
      {isProfessional && (
        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Briefcase className="w-3 h-3" /> Professional Details
          </h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title</label>
              <input
                type="text"
                disabled={!isEditing}
                placeholder="e.g., Senior Software Engineer"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-sm disabled:opacity-60"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
              <select
                disabled={!isEditing}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-sm disabled:opacity-60"
                value={formData.category || ''}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
              >
                  <option value="">Select Category</option>
                  {['Technology', 'Business', 'Legal', 'Healthcare', 'Education', 'Finance', 'Marketing', 'Design', 'Engineering', 'Other'].map(c => (
                      <option key={c} value={c}>{c}</option>
                  ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Experience (Years)</label>
                <input
                  type="number"
                  disabled={!isEditing}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-sm disabled:opacity-60"
                  value={formData.experience}
                  onChange={e => setFormData({ ...formData, experience: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Session Price (৳)</label>
                <input
                  type="number"
                  disabled={!isEditing}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-sm disabled:opacity-60"
                  value={formData.sessionPrice}
                  onChange={e => setFormData({ ...formData, sessionPrice: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Specialties (comma-separated)</label>
              <input
                type="text"
                disabled={!isEditing}
                placeholder="React, Node.js, TypeScript"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-sm disabled:opacity-60"
                value={formData.specialties.join(', ')}
                onChange={e => setFormData({ ...formData, specialties: e.target.value.split(',').map((s: string) => s.trim()) })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Languages (comma-separated)</label>
              <input
                type="text"
                disabled={!isEditing}
                placeholder="English, Bengali"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-sm disabled:opacity-60"
                value={formData.languages.join(', ')}
                onChange={e => setFormData({ ...formData, languages: e.target.value.split(',').map((s: string) => s.trim()) })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">LinkedIn URL</label>
                <input
                  type="url"
                  disabled={!isEditing}
                  placeholder="https://linkedin.com/in/..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-sm disabled:opacity-60"
                  value={formData.linkedinUrl}
                  onChange={e => setFormData({ ...formData, linkedinUrl: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">CV / Resume</label>
                <div className="relative">
                   {formData.cvUrl ? (
                        <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                            <FileText className="w-4 h-4 text-slate-500" />
                            <a href={formData.cvUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-600 hover:underline truncate flex-1">View CV</a>
                            {isEditing && (
                                <button onClick={() => setFormData({...formData, cvUrl: ''})} className="text-red-500 hover:text-red-600 p-1">
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                   ) : (
                       isEditing ? (
                           <div className="relative border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg p-3 text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                               <input 
                                    type="file" 
                                    accept=".pdf,.doc,.docx"
                                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'cvUrl')}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    disabled={uploading === 'cvUrl-'}
                               />
                               <div className="text-xs text-slate-500 font-medium flex items-center justify-center gap-2">
                                   {uploading === 'cvUrl-' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                   <span>Upload CV (PDF)</span>
                               </div>
                           </div>
                       ) : (
                           <p className="text-sm text-slate-400 italic">No CV uploaded</p>
                       )
                   )}
                </div>
              </div>
            </div>

            {/* EDU & CERTS */}
            <div className="space-y-4">
                {/* Certifications */}
                <div>
                   <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Certifications</label>
                   <div className="space-y-2">
                       {/* Ensure it's an array */}
                       {(Array.isArray(formData.certifications) ? formData.certifications : []).map((cert: ProfessionalDocument, index: number) => (
                           <div key={index} className="flex gap-2 items-start">
                               <input 
                                    type="text" 
                                    value={cert.name}
                                    onChange={(e) => updateItem('certifications', index, 'name', e.target.value)}
                                    placeholder="Certification Name"
                                    disabled={!isEditing}
                                    className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm disabled:opacity-60"
                               />
                                {cert.doc ? (
                                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                        <a href={cert.doc} target="_blank" className="text-xs font-bold text-primary-600 hover:underline">View</a>
                                        {isEditing && <button onClick={() => updateItem('certifications', index, 'doc', '')} className="text-red-500"><X className="w-3 h-3"/></button>}
                                    </div>
                                ) : (
                                    isEditing && (
                                        <div className="relative">
                                            <input 
                                                type="file" 
                                                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'certifications', index, 'doc')}
                                                className="absolute inset-0 opacity-0 cursor-pointer w-full"
                                                title="Upload Certificate"
                                            />
                                            <button className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 rounded-lg hover:bg-slate-200">
                                                {uploading === `certifications-${index}` ? <Loader2 className="w-4 h-4 animate-spin"/> : <Upload className="w-4 h-4 text-slate-500"/>}
                                            </button>
                                        </div>
                                    )
                                )}
                               {isEditing && (
                                   <button onClick={() => removeItem('certifications', index)} className="p-2 text-slate-400 hover:text-red-500">
                                       <Trash2 className="w-4 h-4" />
                                   </button>
                               )}
                           </div>
                       ))}
                       {isEditing && (
                           <button onClick={() => addItem('certifications')} className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1">
                               <Plus className="w-3 h-3" /> Add Certification
                           </button>
                       )}
                   </div>
                </div>

                {/* Education */}
                 <div>
                   <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Education</label>
                   <div className="space-y-2">
                       {(Array.isArray(formData.education) ? formData.education : []).map((edu: ProfessionalDocument, index: number) => (
                           <div key={index} className="flex gap-2 items-start">
                               <input 
                                    type="text" 
                                    value={edu.name}
                                    onChange={(e) => updateItem('education', index, 'name', e.target.value)}
                                    placeholder="Degree / Institution"
                                    disabled={!isEditing}
                                    className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm disabled:opacity-60"
                               />
                                {edu.doc ? (
                                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                        <a href={edu.doc} target="_blank" className="text-xs font-bold text-primary-600 hover:underline">View</a>
                                        {isEditing && <button onClick={() => updateItem('education', index, 'doc', '')} className="text-red-500"><X className="w-3 h-3"/></button>}
                                    </div>
                                ) : (
                                    isEditing && (
                                        <div className="relative">
                                            <input 
                                                type="file" 
                                                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'education', index, 'doc')}
                                                className="absolute inset-0 opacity-0 cursor-pointer w-full"
                                                title="Upload Document"
                                            />
                                            <button className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 rounded-lg hover:bg-slate-200">
                                                {uploading === `education-${index}` ? <Loader2 className="w-4 h-4 animate-spin"/> : <Upload className="w-4 h-4 text-slate-500"/>}
                                            </button>
                                        </div>
                                    )
                                )}
                               {isEditing && (
                                   <button onClick={() => removeItem('education', index)} className="p-2 text-slate-400 hover:text-red-500">
                                       <Trash2 className="w-4 h-4" />
                                   </button>
                               )}
                           </div>
                       ))}
                       {isEditing && (
                           <button onClick={() => addItem('education')} className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1">
                               <Plus className="w-3 h-3" /> Add Education
                           </button>
                       )}
                   </div>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
        {isEditing ? (
          <div className="flex gap-3">
            <button
              onClick={() => setIsEditing(false)}
              className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 bg-primary-600 text-white py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="w-full bg-slate-900 dark:bg-slate-700 text-white py-3 rounded-lg font-bold text-sm"
          >
            Edit Profile
          </button>
        )}
      </div>
    </div>
  );
}
