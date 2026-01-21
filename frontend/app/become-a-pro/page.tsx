'use client';

import { useAuth } from '@/contexts/auth-context';
import { CloudinaryService } from '@/lib/services/cloudinary-service';
import { ProfessionalService } from '@/lib/services/professional-service';
import { ProfessionalDocument } from '@/lib/types';
import { Briefcase, Building, CheckCircle, ChevronRight, FileText, Loader2, Upload, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

export default function BecomeProfessionalPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [step, setStep] = useState(0); // 0: Intro, 1: Basic, 2: Expertise, 3: Details, 4: Review
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        title: '',
        category: '',
        bio: '',
        specialties: [] as string[],
        sessionPrice: 0,
        experience: 0,
        languages: [] as string[],
        linkedinUrl: '',
        cvUrl: '',
        specialtyInput: '',
        languageInput: '',
        certifications: [] as ProfessionalDocument[],
        education: [] as ProfessionalDocument[]
    });

    const handleNext = () => setStep(prev => prev + 1);
    const handleBack = () => setStep(prev => prev - 1);

    const [uploading, setUploading] = useState<string | null>(null);

    const handleFileUpload = async (file: File, field: string, index?: number, subField?: 'doc') => {
        try {
            setUploading(`${field}-${index ?? ''}`);
            const result = await CloudinaryService.uploadFile(file, 'documents');
            
            if (index !== undefined && subField && (field === 'education' || field === 'certifications')) {
                const list = [...formData[field]];
                if (!list[index]) list[index] = { name: '' };
                list[index] = { ...list[index], [subField]: result.secure_url };
                setFormData({ ...formData, [field]: list });
            } else {
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

    const addItem = (field: 'education' | 'certifications') => {
        setFormData({ ...formData, [field]: [...formData[field], { name: '', doc: '' }] });
    };

    const removeItem = (field: 'education' | 'certifications', index: number) => {
        const list = [...formData[field]];
        list.splice(index, 1);
        setFormData({ ...formData, [field]: list });
    };

    const updateItem = (field: 'education' | 'certifications', index: number, key: string, value: string) => {
        const list = [...formData[field]];
        list[index] = { ...list[index], [key]: value };
        setFormData({ ...formData, [field]: list });
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        setError('');
        try {
            await ProfessionalService.submitApplication({
                title: formData.title,
                category: formData.category,
                bio: formData.bio,
                specialties: formData.specialties,
                sessionPrice: formData.sessionPrice,
                experience: formData.experience,
                languages: formData.languages,
                linkedinUrl: formData.linkedinUrl,
                cvUrl: formData.cvUrl,
                certifications: formData.certifications,
                education: formData.education
            });
            router.push('/dashboard?success=application_submitted');
        } catch (err: any) {
            setError(err.message || 'Failed to submit application');
        } finally {
            setIsLoading(false);
        }
    };

    const addSpecialty = () => {
        if (formData.specialtyInput && !formData.specialties.includes(formData.specialtyInput)) {
            setFormData(prev => ({ ...prev, specialties: [...prev.specialties, prev.specialtyInput], specialtyInput: '' }));
        }
    };

    const addLanguage = () => {
        if (formData.languageInput && !formData.languages.includes(formData.languageInput)) {
            setFormData(prev => ({ ...prev, languages: [...prev.languages, prev.languageInput], languageInput: '' }));
        }
    };

    if (authLoading) return <div className="flex justify-center items-center min-h-screen"><Loader2 className="animate-spin" /></div>;

    if (!user) {
        // Simple redirect if not logged in (middleware might handle this too)
        if (typeof window !== 'undefined') router.push('/login?redirect=/become-a-pro');
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-3xl">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Become a Professional
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Join our elite network of experts and start earning on your terms.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-3xl">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    
                    {/* Progress Bar */}
                    <div className="mb-8">
                        <div className="flex justify-between items-center mb-2">
                             {[1, 2, 3, 4].map((s) => (
                                 <div key={s} className={`flex flex-col items-center ${step >= s ? 'text-blue-600' : 'text-gray-400'}`}>
                                     <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= s ? 'border-blue-600 bg-blue-50' : 'border-gray-200'}`}>
                                         {step > s ? <CheckCircle size={16} /> : <span>{s}</span>}
                                     </div>
                                 </div>
                             ))}
                        </div>
                        <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                            <div className="bg-blue-600 h-full transition-all duration-300" style={{ width: `${(step / 4) * 100}%` }}></div>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
                            <span className="block sm:inline">{error}</span>
                        </div>
                    )}

                    {/* Step 0: Intro */}
                    {step === 0 && (
                        <div className="space-y-6 text-center">
                            <div className="flex justify-center space-x-8 mb-8">
                                <div className="flex flex-col items-center">
                                    <div className="p-4 bg-blue-100 rounded-full mb-3 text-blue-600"><Briefcase size={32} /></div>
                                    <h4 className="font-semibold text-gray-900">Get Hired</h4>
                                    <p className="text-sm text-gray-500 max-w-xs">Showcase your skills to thousands of potential clients.</p>
                                </div>
                                <div className="flex flex-col items-center">
                                    <div className="p-4 bg-green-100 rounded-full mb-3 text-green-600"><Building size={32} /></div>
                                    <h4 className="font-semibold text-gray-900">Earn More</h4>
                                    <p className="text-sm text-gray-500 max-w-xs">Set your own rates and get paid securely.</p>
                                </div>
                            </div>
                            <div className="border-t pt-6">
                                <button
                                    onClick={handleNext}
                                    className="w-full sm:w-auto flex justify-center py-2 px-8 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    Start Application
                                    <ChevronRight className="ml-2 h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 1: Basic Info */}
                    {step === 1 && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Professional Title</label>
                                <div className="mt-1">
                                    <input
                                        type="text"
                                        required
                                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        placeholder="e.g. Senior Corporate Lawyer"
                                        value={formData.title}
                                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                                    />
                                    <p className="mt-1 text-sm text-gray-500">This will appear under your name on your profile.</p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Category</label>
                                <div className="mt-1">
                                    <select
                                        required
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        value={formData.category} // Assuming you will add category to formData state in a separate edit or if I missed it
                                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                                    >
                                        <option value="">Select a category</option>
                                        {['Technology', 'Business', 'Legal', 'Healthcare', 'Education', 'Finance', 'Marketing', 'Design', 'Engineering', 'Other'].map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Bio</label>
                                <div className="mt-1">
                                    <textarea
                                        required
                                        rows={4}
                                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        placeholder="Describe your expertise, background, and what you offer..."
                                        value={formData.bio}
                                        onChange={(e) => setFormData({...formData, bio: e.target.value})}
                                    />
                                </div>
                            </div>

                             <div className="flex justify-between pt-4">
                                <button type="button" onClick={handleBack} className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none">
                                    Back
                                </button>
                                <button
                                    type="button"
                                    onClick={handleNext}
                                    disabled={!formData.title || !formData.bio || formData.bio.length < 50}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50"
                                >
                                    Next
                                    <ChevronRight className="ml-2 h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Expertise */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Specialties</label>
                                <div className="mt-1 flex space-x-2">
                                    <input
                                        type="text"
                                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        placeholder="e.g. Contract Law, Tax Planning"
                                        value={formData.specialtyInput}
                                        onChange={(e) => setFormData({...formData, specialtyInput: e.target.value})}
                                        onKeyDown={(e) => e.key === 'Enter' && addSpecialty()}
                                    />
                                    <button
                                        type="button"
                                        onClick={addSpecialty}
                                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                                    >
                                        Add
                                    </button>
                                </div>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {formData.specialties.map((spec, idx) => (
                                        <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            {spec}
                                            <button
                                                type="button"
                                                className="ml-1 inline-flex text-blue-400 hover:text-blue-500 focus:outline-none"
                                                onClick={() => setFormData(prev => ({...prev, specialties: prev.specialties.filter((_, i) => i !== idx)}))}
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Languages</label>
                                <div className="mt-1 flex space-x-2">
                                    <input
                                        type="text"
                                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        placeholder="e.g. English, Bengali"
                                        value={formData.languageInput}
                                        onChange={(e) => setFormData({...formData, languageInput: e.target.value})}
                                        onKeyDown={(e) => e.key === 'Enter' && addLanguage()}
                                    />
                                    <button
                                        type="button"
                                        onClick={addLanguage}
                                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                                    >
                                        Add
                                    </button>
                                </div>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {formData.languages.map((lang, idx) => (
                                        <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            {lang}
                                            <button
                                                type="button"
                                                className="ml-1 inline-flex text-green-400 hover:text-green-500 focus:outline-none"
                                                onClick={() => setFormData(prev => ({...prev, languages: prev.languages.filter((_, i) => i !== idx)}))}
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-between pt-4">
                                <button type="button" onClick={handleBack} className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none">
                                    Back
                                </button>
                                <button
                                    type="button"
                                    onClick={handleNext}
                                    disabled={formData.specialties.length === 0 || formData.languages.length === 0}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50"
                                >
                                    Next
                                    <ChevronRight className="ml-2 h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Details */}
                    {step === 3 && (
                         <div className="space-y-6">
                             <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                                 <div className="sm:col-span-3">
                                     <label className="block text-sm font-medium text-gray-700">Session Price (BDT)</label>
                                     <div className="mt-1 relative rounded-md shadow-sm">
                                         <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                             <span className="text-gray-500 sm:text-sm">৳</span>
                                         </div>
                                         <input
                                             type="number"
                                             min="0"
                                             className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md py-2 border px-3"
                                             placeholder="0.00"
                                             value={formData.sessionPrice}
                                             onChange={(e) => setFormData({...formData, sessionPrice: parseFloat(e.target.value)})}
                                         />
                                         <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                             <span className="text-gray-500 sm:text-sm">/session</span>
                                         </div>
                                     </div>
                                 </div>

                                 <div className="sm:col-span-3">
                                     <label className="block text-sm font-medium text-gray-700">Experience (Years)</label>
                                     <div className="mt-1">
                                         <input
                                             type="number"
                                             min="0"
                                             className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                             value={formData.experience}
                                             onChange={(e) => setFormData({...formData, experience: parseInt(e.target.value)})}
                                         />
                                     </div>
                                 </div>
                             </div>

                             {/* Education & Certifications */}
                             <div className="space-y-4 pt-4 border-t border-gray-200">
                                <h3 className="text-md font-medium text-gray-900">Education</h3>
                                <div className="space-y-3">
                                    {formData.education.map((edu, index) => (
                                        <div key={index} className="flex gap-2 items-start">
                                            <input 
                                                type="text" 
                                                value={edu.name}
                                                onChange={(e) => updateItem('education', index, 'name', e.target.value)}
                                                placeholder="Degree / Institution"
                                                className="flex-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            />
                                            {edu.doc ? (
                                                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-md border border-gray-300">
                                                    <a href={edu.doc} target="_blank" className="text-xs font-bold text-blue-600 hover:underline">View</a>
                                                    <button onClick={() => updateItem('education', index, 'doc', '')} className="text-red-500"><X className="w-3 h-3"/></button>
                                                </div>
                                            ) : (
                                                 <div className="relative">
                                                    <input 
                                                        type="file" 
                                                        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'education', index, 'doc')}
                                                        className="absolute inset-0 opacity-0 cursor-pointer w-full"
                                                    />
                                                    <button className="bg-gray-50 border border-gray-300 p-2 rounded-md hover:bg-gray-100">
                                                        {uploading === `education-${index}` ? <Loader2 className="w-4 h-4 animate-spin"/> : <Upload className="w-4 h-4 text-gray-500"/>}
                                                    </button>
                                                </div>
                                            )}
                                            <button onClick={() => removeItem('education', index)} className="p-2 text-gray-400 hover:text-red-500">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    <button 
                                        type="button"
                                        onClick={() => addItem('education')} 
                                        className="text-sm text-blue-600 hover:text-blue-500 font-medium"
                                    >
                                        + Add Education
                                    </button>
                                </div>
                             </div>

                             <div className="space-y-4 pt-4 border-t border-gray-200">
                                <h3 className="text-md font-medium text-gray-900">Certifications</h3>
                                <div className="space-y-3">
                                    {formData.certifications.map((cert, index) => (
                                        <div key={index} className="flex gap-2 items-start">
                                            <input 
                                                type="text" 
                                                value={cert.name}
                                                onChange={(e) => updateItem('certifications', index, 'name', e.target.value)}
                                                placeholder="Certification Name"
                                                className="flex-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            />
                                            {cert.doc ? (
                                                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-md border border-gray-300">
                                                    <a href={cert.doc} target="_blank" className="text-xs font-bold text-blue-600 hover:underline">View</a>
                                                    <button onClick={() => updateItem('certifications', index, 'doc', '')} className="text-red-500"><X className="w-3 h-3"/></button>
                                                </div>
                                            ) : (
                                                 <div className="relative">
                                                    <input 
                                                        type="file" 
                                                        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'certifications', index, 'doc')}
                                                        className="absolute inset-0 opacity-0 cursor-pointer w-full"
                                                    />
                                                    <button className="bg-gray-50 border border-gray-300 p-2 rounded-md hover:bg-gray-100">
                                                        {uploading === `certifications-${index}` ? <Loader2 className="w-4 h-4 animate-spin"/> : <Upload className="w-4 h-4 text-gray-500"/>}
                                                    </button>
                                                </div>
                                            )}
                                            <button onClick={() => removeItem('certifications', index)} className="p-2 text-gray-400 hover:text-red-500">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    <button 
                                        type="button"
                                        onClick={() => addItem('certifications')} 
                                        className="text-sm text-blue-600 hover:text-blue-500 font-medium"
                                    >
                                        + Add Certification
                                    </button>
                                </div>
                             </div>

                             <div className="pt-4 border-t border-gray-200">
                                 <label className="block text-sm font-medium text-gray-700">LinkedIn Profile URL</label>
                                 <div className="mt-1">
                                     <input
                                         type="url"
                                         className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                         placeholder="https://linkedin.com/in/..."
                                         value={formData.linkedinUrl}
                                         onChange={(e) => setFormData({...formData, linkedinUrl: e.target.value})}
                                     />
                                 </div>
                             </div>

                             <div>
                                 <label className="block text-sm font-medium text-gray-700">CV / Resume (Upload or URL)</label>
                                 <div className="mt-1">
                                     {formData.cvUrl && !formData.cvUrl.startsWith('http') ? ( // Assuming file upload returns URL but we can check format
                                         <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md border border-gray-300">
                                             <FileText className="w-4 h-4 text-gray-500"/>
                                             <a href={formData.cvUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline flex-1 truncate">
                                                View Uploaded CV
                                             </a>
                                             <button onClick={() => setFormData({...formData, cvUrl: ''})} className="text-red-500"><X className="w-4 h-4"/></button>
                                         </div>
                                     ) : (
                                         <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="url"
                                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                    placeholder="https://drive.google.com/... (OR Upload below)"
                                                    value={formData.cvUrl}
                                                    onChange={(e) => setFormData({...formData, cvUrl: e.target.value})}
                                                />
                                            </div>
                                            <div className="relative border-2 border-dashed border-gray-300 rounded-md p-4 text-center hover:bg-gray-50 transition-colors">
                                                <input 
                                                    type="file" 
                                                    accept=".pdf,.doc,.docx"
                                                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'cvUrl')}
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                    disabled={uploading === 'cvUrl-'}
                                                />
                                                <div className="text-sm text-gray-500 flex flex-col items-center">
                                                    {uploading === 'cvUrl-' ? <Loader2 className="w-6 h-6 animate-spin mb-1"/> : <Upload className="w-6 h-6 mb-1"/>}
                                                    <span>Click to Upload CV (PDF)</span>
                                                </div>
                                            </div>
                                         </div>
                                     )}
                                 </div>
                             </div>

                             <div className="flex justify-between pt-4">
                                <button type="button" onClick={handleBack} className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none">
                                    Back
                                </button>
                                <button
                                    type="button"
                                    onClick={handleNext}
                                    disabled={formData.sessionPrice <= 0 || !formData.linkedinUrl}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50"
                                >
                                    Review
                                    <ChevronRight className="ml-2 h-4 w-4" />
                                </button>
                            </div>
                         </div>
                    )}

                    {/* Step 4: Review */}
                    {step === 4 && (
                        <div className="space-y-6">
                            <div className="bg-gray-50 p-4 rounded-md">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Review your Application</h3>
                                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                                    <div className="sm:col-span-2">
                                        <dt className="text-sm font-medium text-gray-500">Title & Category</dt>
                                        <dd className="mt-1 text-sm text-gray-900">
                                            <p className="font-semibold">{formData.title}</p>
                                            <p className="text-gray-500 text-xs mb-1">{formData.category}</p>
                                            <p className="whitespace-pre-wrap">{formData.bio}</p>
                                        </dd>
                                    </div>
                                     <div className="sm:col-span-1">
                                        <dt className="text-sm font-medium text-gray-500">Session Price</dt>
                                        <dd className="mt-1 text-sm text-gray-900">৳{formData.sessionPrice}/session</dd>
                                    </div>
                                    <div className="sm:col-span-1">
                                        <dt className="text-sm font-medium text-gray-500">Experience</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{formData.experience} Years</dd>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <dt className="text-sm font-medium text-gray-500">Specialties</dt>
                                        <dd className="mt-1 text-sm text-gray-900 flex flex-wrap gap-1">
                                            {formData.specialties.map(s => <span key={s} className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">{s}</span>)}
                                        </dd>
                                    </div>
                                </dl>
                            </div>

                            <div className="flex justify-between pt-4">
                                <button type="button" onClick={handleBack} className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none">
                                    Back
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={isLoading}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none disabled:opacity-50"
                                >
                                    {isLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <div className='mr-2'><CheckCircle size={16} /></div>}
                                    Submit Application
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
