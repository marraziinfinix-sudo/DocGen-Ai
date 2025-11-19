import React, { useState } from 'react';
import { Company, Details, Client, Item, SavedDocument } from '../types';
import { PlusIcon, TrashIcon, ViewIcon, EyeSlashIcon } from './Icons';
import { saveCompanies, resetUserData, deleteAccount, defaultUserData as importedDefaultUserData } from '../services/firebaseService';
import { sendPasswordResetEmail, User as FirebaseUser } from 'firebase/auth';
import { auth } from '../services/firebaseConfig';

interface SetupPageProps {
  user: FirebaseUser;
  companies: Company[];
  setCompanies: React.Dispatch<React.SetStateAction<Company[]>>;
  onDone: () => void;
  activeCompanyId: number;
  setActiveCompanyId: React.Dispatch<React.SetStateAction<number>>;
  // Props for reset app functionality
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  setItems: React.Dispatch<React.SetStateAction<Item[]>>;
  setItemCategories: React.Dispatch<React.SetStateAction<string[]>>;
  setSavedInvoices: React.Dispatch<React.SetStateAction<SavedDocument[]>>;
  setSavedQuotations: React.Dispatch<React.SetStateAction<SavedDocument[]>>;
  defaultUserData: typeof importedDefaultUserData;
}

const emptyCompany: Company = {
  id: 0,
  details: { name: '', address: '', email: '', phone: '', bankName: '', accountNumber: '', website: '', taxId: '' },
  logo: null,
  bankQRCode: null,
  defaultNotes: 'Thank you for your business.',
  taxRate: 0,
  currency: '',
  template: 'classic',
  accentColor: '#4f46e5',
};

const CompanyForm: React.FC<{
  company: Company;
  onSave: (company: Company) => void;
  onCancel: () => void;
}> = ({ company, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Company>(company);

  const handleDetailChange = (field: keyof Details, value: string) => {
    setFormData(prev => ({ ...prev, details: { ...prev.details, [field]: value } }));
  };
  
  const handleFieldChange = (field: keyof Omit<Company, 'id' | 'details'>, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }

  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (value: string | null) => void
  ) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setter(event.target?.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave(formData);
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
        <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
                <div className="p-4 sm:p-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">
                        {formData.id === 0 ? 'Add New Company' : 'Edit Company'}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-1 space-y-4">
                        <h3 className="text-lg font-semibold text-gray-700">Company Information</h3>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Company Name *</label>
                            <input type="text" value={formData.details.name} onChange={e => handleDetailChange('name', e.target.value)} required className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"/>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Address</label>
                            <input type="text" value={formData.details.address} onChange={e => handleDetailChange('address', e.target.value)} className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                            <input type="email" value={formData.details.email} onChange={e => handleDetailChange('email', e.target.value)} className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Phone</label>
                            <input type="tel" value={formData.details.phone} onChange={e => handleDetailChange('phone', e.target.value)} className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Website</label>
                            <input type="text" value={formData.details.website || ''} onChange={e => handleDetailChange('website', e.target.value)} className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Tax ID / Reg No.</label>
                            <input type="text" value={formData.details.taxId || ''} onChange={e => handleDetailChange('taxId', e.target.value)} className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"/>
                        </div>
                    </div>
                    <div className="md:col-span-1 space-y-4">
                        <h3 className="text-lg font-semibold text-gray-700">Branding & Defaults</h3>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Company Logo</label>
                            <div className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                                {formData.logo ? <img src={formData.logo} alt="Logo Preview" className="max-h-full max-w-full object-contain p-2"/> : <span className="text-gray-400 text-sm">No Logo</span>}
                            </div>
                            <div className="flex items-center justify-between mt-2">
                                <input type="file" accept="image/*" onChange={e => handleImageChange(e, (val) => setFormData(p => ({...p, logo: val})))} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"/>
                                {formData.logo && (
                                    <button type="button" onClick={() => setFormData(p => ({...p, logo: null}))} className="flex-shrink-0 text-sm font-semibold text-red-600 hover:text-red-800 ml-2">
                                        Remove
                                    </button>
                                )}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Default Notes / Terms</label>
                            <textarea value={formData.defaultNotes} onChange={e => handleFieldChange('defaultNotes', e.target.value)} rows={4} className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"/>
                        </div>
                    </div>
                    <div className="md:col-span-1 space-y-4">
                        <h3 className="text-lg font-semibold text-gray-700">Financial Settings</h3>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Default Tax Rate (%)</label>
                          <input type="number" value={formData.taxRate} onChange={e => handleFieldChange('taxRate', parseFloat(e.target.value) || 0)} className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"/>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Currency Symbol</label>
                          <input type="text" value={formData.currency} onChange={e => handleFieldChange('currency', e.target.value)} className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500" placeholder="e.g., $, €, ¥"/>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Bank Name</label>
                          <input type="text" value={formData.details.bankName || ''} onChange={e => handleDetailChange('bankName', e.target.value)} className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"/>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Account Number</label>
                          <input type="text" value={formData.details.accountNumber || ''} onChange={e => handleDetailChange('accountNumber', e.target.value)} className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"/>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Bank QR Code</label>
                            <div className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                                {formData.bankQRCode ? <img src={formData.bankQRCode} alt="QR Code Preview" className="max-h-full max-w-full object-contain p-2"/> : <span className="text-gray-400 text-sm">No QR Code</span>}
                            </div>
                            <div className="flex items-center justify-between mt-2">
                                <input type="file" accept="image/*" onChange={e => handleImageChange(e, (val) => setFormData(p => ({...p, bankQRCode: val})))} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"/>
                                {formData.bankQRCode && (
                                    <button type="button" onClick={() => setFormData(p => ({...p, bankQRCode: null}))} className="flex-shrink-0 text-sm font-semibold text-red-600 hover:text-red-800 ml-2">
                                        Remove
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                
                 <div className="mt-8 pt-6 border-t p-4 sm:p-8">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">Document Design</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Document Template</label>
                            <select value={formData.template} onChange={e => handleFieldChange('template', e.target.value)} className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500">
                                <option value="classic">Classic</option>
                                <option value="modern">Modern</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Accent Color</label>
                            <div className="flex items-center gap-2">
                                <input type="color" value={formData.accentColor} onChange={e => handleFieldChange('accentColor', e.target.value)} className="w-10 h-10 p-1 border border-slate-300 rounded-md cursor-pointer"/>
                                <input type="text" value={formData.accentColor} onChange={e => handleFieldChange('accentColor', e.target.value)} className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"/>
                            </div>
                        </div>
                    </div>
                </div>
                </div>
                <div className="bg-slate-50 p-4 flex justify-end gap-4 border-t">
                    <button type="button" onClick={onCancel} className="bg-slate-200 text-slate-700 font-semibold py-2 px-4 rounded-lg hover:bg-slate-300">Cancel</button>
                    <button type="submit" className="bg-indigo-600 text-white font-semibold py-2 px-6 rounded-lg shadow-md hover:bg-indigo-700">Save Company</button>
                </div>
            </form>
        </div>
    </div>
  );
};

interface PasswordInputProps {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder: string;
    id: string;
    name: string;
    autoComplete?: string;
    required?: boolean;
}

const PasswordInput: React.FC<PasswordInputProps> = ({
    value,
    onChange,
    placeholder,
    id,
    name,
    autoComplete,
    required = false
}) => {
    const [showPassword, setShowPassword] = useState(false);
    return (
        <div className="relative">
            <input
                id={id}
                name={name}
                type={showPassword ? 'text' : 'password'}
                autoComplete={autoComplete}
                required={required}
                value={value}
                onChange={onChange}
                className="w-full p-2 pr-10 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                placeholder={placeholder}
            />
            <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 z-10 pr-3 flex items-center text-sm leading-5 text-gray-500 hover:text-gray-700 focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
            >
                {showPassword ? <EyeSlashIcon /> : <ViewIcon />}
            </button>
        </div>
    );
};

const AccountSettings: React.FC<{ user: FirebaseUser }> = ({ user }) => {
    const [resetSent, setResetSent] = useState(false);
    const [isSending, setIsSending] = useState(false);

    const handlePasswordReset = async () => {
        if (!user.email) {
            alert("Cannot send reset email to an account without an email address.");
            return;
        }
        setIsSending(true);
        try {
            await sendPasswordResetEmail(auth, user.email);
            setResetSent(true);
            alert("A password reset link has been sent to your email address. Please check your inbox.");
        } catch (error: any) {
            alert("Error sending email: " + error.message);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="mb-8 p-6 bg-slate-50 rounded-lg border border-slate-200">
            <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-4">Account Settings</h2>
            
            <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Change Your Password</h3>
                <p className="text-sm text-slate-600 mb-4">Click the button below to send a password reset link to <span className="font-medium">{user.email}</span>.</p>
                {resetSent ? (
                    <p className="text-sm text-green-700 font-medium">Reset email sent. Please check your inbox.</p>
                ) : (
                    <button 
                        onClick={handlePasswordReset} 
                        disabled={isSending}
                        className="bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg shadow-sm hover:bg-slate-700 disabled:bg-slate-400 disabled:cursor-wait">
                        {isSending ? 'Sending...' : 'Send Password Reset Email'}
                    </button>
                )}
            </div>
        </div>
    );
};

interface ConfirmationModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    onConfirm: () => void;
    onCancel: () => void;
    buttonColor: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    title,
    message,
    confirmText,
    onConfirm,
    onCancel,
    buttonColor,
}) => {
    const [input, setInput] = useState('');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onCancel}>
            <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full" onClick={e => e.stopPropagation()}>
                <div className="p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">{title}</h2>
                    <p className="text-gray-600 mb-4">{message}</p>
                    <p className="font-semibold text-gray-700 mb-2">
                        Type "<span className="font-mono text-red-600">{confirmText}</span>" to confirm:
                    </p>
                    <input
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                        placeholder={confirmText}
                    />
                </div>
                <div className="bg-slate-50 p-4 flex justify-end gap-4 border-t">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="bg-slate-200 text-slate-700 font-semibold py-2 px-4 rounded-lg hover:bg-slate-300"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={input !== confirmText}
                        className={`${buttonColor} text-white font-semibold py-2 px-6 rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {title.includes('Reset') ? 'Reset' : 'Delete'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const SetupPage: React.FC<SetupPageProps> = ({ 
    user,
    companies, setCompanies, 
    onDone,
    activeCompanyId,
    setActiveCompanyId,
    setClients,
    setItems,
    setItemCategories,
    setSavedInvoices,
    setSavedQuotations,
    defaultUserData,
}) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingCompany, setEditingCompany] = useState<Company | null>(null);
    const [isResetAppModalOpen, setIsResetAppModalOpen] = useState(false);
    const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false);

    const handleAddNew = () => {
        setEditingCompany({ ...emptyCompany });
        setIsFormOpen(true);
    };
    
    const handleEdit = (company: Company) => {
        setEditingCompany(company);
        setIsFormOpen(true);
    };

    const handleDelete = (id: number) => {
        if (companies.length <= 1) {
            alert("You must have at least one company profile.");
            return;
        }
        if (window.confirm('Are you sure you want to delete this company profile?')) {
            setCompanies(prev => {
                const newCompanies = prev.filter(c => c.id !== id);
                if (id === activeCompanyId) {
                    setActiveCompanyId(newCompanies[0].id);
                }
                saveCompanies(newCompanies);
                return newCompanies;
            });
        }
    };
    
    const handleFormSave = (updatedCompany: Company) => {
        if (updatedCompany.id === 0) { // New company
            const newCompany = { ...updatedCompany, id: Date.now() };
            setCompanies(prev => {
                const newCompanies = [...prev, newCompany];
                saveCompanies(newCompanies);
                return newCompanies;
            });
            setActiveCompanyId(newCompany.id); // Set new company as active
        } else { // Existing company
            setCompanies(prev => {
                const newCompanies = prev.map(c => c.id === updatedCompany.id ? updatedCompany : c);
                saveCompanies(newCompanies);
                return newCompanies;
            });
        }
        setIsFormOpen(false);
        setEditingCompany(null);
    };

    const handleFormCancel = () => {
        setIsFormOpen(false);
        setEditingCompany(null);
    };

    const handleResetAppData = async () => {
        if (!user) return;
        try {
            await resetUserData(user.uid);
            alert("Application data reset successfully!");
            // Reset local states to default
            setCompanies(defaultUserData.companies);
            setClients(defaultUserData.clients);
            setItems(defaultUserData.items);
            setItemCategories(defaultUserData.itemCategories);
            setSavedInvoices(defaultUserData.savedInvoices);
            setSavedQuotations(defaultUserData.savedQuotations);
            setActiveCompanyId(defaultUserData.activeCompanyId);
            setIsResetAppModalOpen(false);
        } catch (error: any) {
            alert("Error resetting application data: " + error.message);
        }
    };

    const handleDeleteAccount = async () => {
        if (!user) return;
        try {
            await deleteAccount(user); // Call the Firebase service function
            // onAuthStateChanged in App.tsx will handle clearing states and redirecting to login
        } catch (error: any) {
            // Firebase deleteUser can require recent login, inform user
            if (error.code === 'auth/requires-recent-login') {
                alert("Please log out and log in again to re-authenticate before deleting your account.");
            } else {
                alert("Error deleting account: " + error.message);
            }
        } finally {
            setIsDeleteAccountModalOpen(false);
        }
    };

  return (
    <>
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto bg-white p-4 sm:p-8 rounded-lg shadow-md">
            {user && (
                <AccountSettings user={user} />
            )}
            <div className="mb-8 p-6 bg-slate-50 rounded-lg border border-slate-200">
                <h2 className="text-xl font-bold text-gray-800 mb-2">Active Company Profile</h2>
                <p className="text-slate-600 mb-4">Select the default company profile to be used when creating new documents.</p>
                <select
                    value={activeCompanyId}
                    onChange={e => setActiveCompanyId(parseInt(e.target.value, 10))}
                    className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                    aria-label="Select active company profile"
                >
                    {companies.map(company => (
                    <option key={company.id} value={company.id}>
                        {company.details.name || `Company #${company.id}`}
                    </option>
                    ))}
                </select>
            </div>

            <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h2 className="text-2xl font-bold text-gray-800">Manage Company Profiles</h2>
                <button onClick={handleAddNew} className="flex items-center gap-2 bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-indigo-700">
                    <PlusIcon /> <span className="hidden sm:inline">Add New</span>
                </button>
            </div>

            <div className="space-y-4">
                {companies.map(company => (
                    <div key={company.id} className="bg-slate-50 p-4 rounded-lg border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-2">
                        <div className="flex items-center gap-4">
                            {company.logo && <img src={company.logo} alt="logo" className="w-12 h-12 object-contain bg-white rounded-md p-1 border flex-shrink-0" />}
                            <div>
                                <p className="font-bold text-slate-800">{company.details.name}</p>
                                <p className="text-sm text-slate-500 break-all">{company.details.email}</p>
                            </div>
                        </div>
                        <div className="flex gap-2 items-center self-end sm:self-center flex-shrink-0">
                            <div className="w-6 h-6 rounded-full border" style={{backgroundColor: company.accentColor}}></div>
                            <span className="text-sm capitalize text-slate-600 font-medium">{company.template}</span>
                            <div className="w-px h-5 bg-slate-200 mx-1"></div>
                            <button onClick={() => handleEdit(company)} className="font-semibold text-indigo-600 py-1 px-3 rounded-lg hover:bg-indigo-50">Edit</button>
                            <button onClick={() => handleDelete(company.id)} className="font-semibold text-red-600 py-1 px-3 rounded-lg hover:bg-red-50">Delete</button>
                        </div>
                    </div>
                ))}
            </div>
            
            {/* Danger Zone */}
            <div className="mt-8 pt-6 border-t border-red-200 bg-red-50 p-6 rounded-lg">
                <h2 className="text-xl font-bold text-red-800 mb-4">Danger Zone</h2>
                <p className="text-sm text-red-700 mb-6">These actions are permanent and cannot be undone.</p>
                
                <div className="space-y-4">
                    <div>
                        <h3 className="font-semibold text-red-700 mb-2">Reset Application Data</h3>
                        <p className="text-sm text-red-600 mb-3">This will delete ALL your companies, clients, items, invoices, and quotations. Your account will remain active.</p>
                        <button
                            onClick={() => setIsResetAppModalOpen(true)}
                            className="bg-red-600 text-white font-semibold py-2 px-4 rounded-lg shadow-sm hover:bg-red-700"
                        >
                            Reset All Data
                        </button>
                    </div>
                    <div className="border-t border-red-100 pt-4">
                        <h3 className="font-semibold text-red-700 mb-2">Delete Account Permanently</h3>
                        <p className="text-sm text-red-600 mb-3">This will permanently delete your account and ALL associated data. This action cannot be undone.</p>
                        <button
                            onClick={() => setIsDeleteAccountModalOpen(true)}
                            className="bg-red-600 text-white font-semibold py-2 px-4 rounded-lg shadow-sm hover:bg-red-700"
                        >
                            Delete My Account
                        </button>
                    </div>
                </div>
            </div>

            <div className="mt-8 text-right">
                <button onClick={onDone} className="bg-slate-500 text-white font-semibold py-2 px-6 rounded-lg shadow-md hover:bg-slate-600 transition-colors duration-200">
                    Done
                </button>
            </div>
        </div>

        {isFormOpen && editingCompany && (
            <CompanyForm 
                company={editingCompany}
                onSave={handleFormSave}
                onCancel={handleFormCancel}
            />
        )}

        {isResetAppModalOpen && (
            <ConfirmationModal
                isOpen={isResetAppModalOpen}
                title="Confirm Reset Application Data"
                message="Are you absolutely sure you want to reset all your application data? This action will delete ALL your companies, clients, items, invoices, and quotations. This is irreversible."
                confirmText="RESET"
                onConfirm={handleResetAppData}
                onCancel={() => setIsResetAppModalOpen(false)}
                buttonColor="bg-red-600 hover:bg-red-700"
            />
        )}

        {isDeleteAccountModalOpen && (
            <ConfirmationModal
                isOpen={isDeleteAccountModalOpen}
                title="Confirm Delete Account"
                message="Are you absolutely sure you want to permanently delete your account? This action will delete your account and ALL associated data from our system. This is irreversible."
                confirmText="DELETE"
                onConfirm={handleDeleteAccount}
                onCancel={() => setIsDeleteAccountModalOpen(false)}
                buttonColor="bg-red-600 hover:bg-red-700"
            />
        )}
      </main>
    </>
  );
};

export default SetupPage;