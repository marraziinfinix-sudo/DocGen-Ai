import React, { useState, useRef, useEffect } from 'react';
import { Company, Details, GDriveUser } from '../types';
import { PlusIcon, DownloadIcon, UploadIcon, ChevronDownIcon, GoogleDriveIcon } from './Icons';
import * as driveService from '../services/googleDriveService';

interface SetupPageProps {
  companies: Company[];
  setCompanies: React.Dispatch<React.SetStateAction<Company[]>>;
  onDone: () => void;
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


const SetupPage: React.FC<SetupPageProps> = ({ 
    companies, setCompanies, 
    onDone 
}) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingCompany, setEditingCompany] = useState<Company | null>(null);
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Google Drive State
    const [gdriveStatus, setGdriveStatus] = useState<'loading' | 'ready' | 'connected' | 'error' | 'connecting'>('loading');
    const [gdriveUser, setGdriveUser] = useState<GDriveUser | null>(null);
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
    const [isDriveActionLoading, setIsDriveActionLoading] = useState(false);


    useEffect(() => {
        const closeMenu = () => setIsExportMenuOpen(false);
        if (isExportMenuOpen) {
            window.addEventListener('click', closeMenu);
        }
        return () => window.removeEventListener('click', closeMenu);
    }, [isExportMenuOpen]);

    useEffect(() => {
      async function initializeGapi() {
        try {
          await driveService.initClient();
          const user = driveService.getCurrentUser();
          if (user) {
            setGdriveUser(user);
            setGdriveStatus('connected');
          } else {
            setGdriveStatus('ready');
          }
        } catch (error) {
          console.error("Error initializing Google Drive service:", error);
          setGdriveStatus('error');
        }
      }
      initializeGapi();
    }, []);

    const handleConnectDrive = async () => {
        setGdriveStatus('connecting');
        try {
            const user = await driveService.signIn();
            setGdriveUser(user);
            setGdriveStatus('connected');
        } catch (error) {
            console.error('Google Drive sign-in error:', error);
            alert('Failed to connect to Google Drive. Please try again.');
            setGdriveStatus('ready');
        }
    };
    
    const handleDisconnectDrive = () => {
        driveService.signOut();
        setGdriveUser(null);
        setGdriveStatus('ready');
    };

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
            setCompanies(prev => prev.filter(c => c.id !== id));
        }
    };
    
    const handleFormSave = (updatedCompany: Company) => {
        if (updatedCompany.id === 0) { // New company
            setCompanies(prev => [...prev, { ...updatedCompany, id: Date.now() }]);
        } else { // Existing company
            setCompanies(prev => prev.map(c => c.id === updatedCompany.id ? updatedCompany : c));
        }
        setIsFormOpen(false);
        setEditingCompany(null);
    };

    const handleFormCancel = () => {
        setIsFormOpen(false);
        setEditingCompany(null);
    };
    
    const handleSaveToLocal = (dataType: string, data: any) => {
        try {
            const dataIsPresent = data && (!Array.isArray(data) || data.length > 0) && (Object.keys(data).length > 0);
            if (!dataIsPresent) {
                alert(`No data to export for "${dataType}".`);
                return;
            }

            const jsonString = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const date = new Date().toISOString().split('T')[0];
            link.download = `invquo-ai-backup-${dataType}-${date}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error(`Failed to export ${dataType} data:`, error);
            alert(`An error occurred while exporting ${dataType} data.`);
        } finally {
            setIsExportMenuOpen(false);
            setIsSaveModalOpen(false);
        }
    };

    const prepareDataForSave = (category: string) => {
        if (category === 'all') {
            const dataToExport: { [key: string]: any } = {};
            const keys = ['companies', 'clients', 'items', 'savedInvoices', 'savedQuotations'];
            keys.forEach(key => {
                const item = localStorage.getItem(key);
                if (item) {
                    dataToExport[key] = JSON.parse(item);
                }
            });
            return { name: 'all', data: dataToExport };
        } else {
            const item = localStorage.getItem(category);
            return { name: category, data: item ? JSON.parse(item) : [] };
        }
    }

    const handleSaveFlow = async (location: 'local' | 'gdrive') => {
        setIsSaveModalOpen(false);
        const {name, data} = prepareDataForSave('all'); // For now, only support saving all data
        if (location === 'local') {
            handleSaveToLocal(name, data);
        } else {
            setIsDriveActionLoading(true);
            try {
                const date = new Date().toISOString().split('T')[0];
                const fileName = `invquo-ai-backup-${name}-${date}.json`;
                const jsonString = JSON.stringify(data, null, 2);
                await driveService.uploadFile(fileName, jsonString);
                alert('Successfully saved backup to Google Drive!');
            } catch (error) {
                console.error('Failed to save to Google Drive', error);
                alert('An error occurred while saving to Google Drive. Please try again.');
            } finally {
                setIsDriveActionLoading(false);
            }
        }
    };

    const handleLoadFromLocalClick = () => {
        setIsLoadModalOpen(false);
        fileInputRef.current?.click();
    };

    const handleLoadFromDriveClick = async () => {
        setIsLoadModalOpen(false);
        setIsDriveActionLoading(true);
        try {
            const fileContent = await driveService.showPicker();
            processImportedData(fileContent);
        } catch (error: any) {
             if (error?.message !== 'Picker cancelled') {
                console.error('Error loading from Google Drive:', error);
                alert('An error occurred while loading from Google Drive. Please check console for details.');
             }
        } finally {
            setIsDriveActionLoading(false);
        }
    };

    const processImportedData = (jsonData: string) => {
        if (!window.confirm('This will overwrite all existing data. This action cannot be undone. Are you sure you want to proceed?')) {
            return;
        }
        try {
            const data = JSON.parse(jsonData);
            const requiredKeys = ['companies', 'clients', 'items', 'savedInvoices', 'savedQuotations'];
            const importedKeys = Object.keys(data);
            
            const isFullBackup = requiredKeys.every(key => importedKeys.includes(key));
            const isPartialBackup = requiredKeys.some(key => importedKeys.includes(key) && Array.isArray(data[key]));

            if (!isFullBackup && !isPartialBackup) {
                alert('Invalid backup file. The file does not appear to contain valid data.');
                return;
            }
            
            requiredKeys.forEach(key => {
                if (data[key]) {
                    localStorage.setItem(key, JSON.stringify(data[key]));
                } else if (isFullBackup) {
                    localStorage.removeItem(key);
                }
            });

            alert('Data imported successfully! The application will now reload.');
            window.location.reload();
        } catch (error) {
            console.error('Failed to process imported data:', error);
            alert('An error occurred while importing data. The file might be corrupted or in the wrong format.');
        } finally {
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            processImportedData(text);
        };
        reader.readAsText(file);
    };

  return (
    <>
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto bg-white p-4 sm:p-8 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h2 className="text-2xl font-bold text-gray-800">Company Profiles</h2>
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
            
            <div className="mt-8 pt-6 border-t">
                {/* Google Drive Integration */}
                <div className="mb-8">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Google Drive Integration</h2>
                    <div className="bg-slate-50 p-4 rounded-lg border">
                        {gdriveStatus === 'loading' && <p className="text-slate-600">Initializing...</p>}
                        {gdriveStatus === 'error' && <p className="text-red-600">Could not connect to Google services. Please check your network or browser settings.</p>}
                        {gdriveStatus === 'ready' && (
                            <button onClick={handleConnectDrive} className="flex items-center justify-center gap-2 bg-white text-slate-700 font-semibold py-2 px-4 rounded-lg shadow-sm border hover:bg-slate-100">
                                <GoogleDriveIcon /> Connect to Google Drive
                            </button>
                        )}
                        {gdriveStatus === 'connecting' && <p className="text-slate-600">Connecting to Google Drive...</p>}
                        {gdriveStatus === 'connected' && gdriveUser && (
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <img src={gdriveUser.picture} alt="User" className="w-10 h-10 rounded-full"/>
                                    <div>
                                        <p className="font-semibold text-slate-800">{gdriveUser.name}</p>
                                        <p className="text-sm text-slate-500">{gdriveUser.email}</p>
                                    </div>
                                </div>
                                <button onClick={handleDisconnectDrive} className="font-semibold text-red-600 py-1 px-3 rounded-lg hover:bg-red-50">Disconnect</button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mb-8">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Data Management</h2>
                    <p className="text-slate-600 mb-4">Save all your data to a file for backup. You can restore from this file on any device.</p>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <button onClick={() => setIsSaveModalOpen(true)} className="flex-1 flex items-center justify-center gap-2 bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-slate-700">
                            <DownloadIcon /> Save Data Backup
                        </button>
                        <button onClick={() => setIsLoadModalOpen(true)} className="flex-1 flex items-center justify-center gap-2 bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-slate-700">
                            <UploadIcon /> Load Data Backup
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden"/>
                    </div>
                </div>
                <div className="text-right">
                    <button onClick={onDone} className="bg-slate-500 text-white font-semibold py-2 px-6 rounded-lg shadow-md hover:bg-slate-600 transition-colors duration-200">
                        Done
                    </button>
                </div>
            </div>
        </div>

        {isFormOpen && editingCompany && (
            <CompanyForm 
                company={editingCompany}
                onSave={handleFormSave}
                onCancel={handleFormCancel}
            />
        )}
      </main>

        {/* Save Modal */}
        {isSaveModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4">
                <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
                    <div className="p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Save Backup To...</h3>
                        <div className="space-y-4">
                           <button onClick={() => handleSaveFlow('local')} className="w-full flex items-center justify-center gap-2 bg-slate-600 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:bg-slate-700">
                                <DownloadIcon/> Local Computer
                           </button>
                           <button onClick={() => handleSaveFlow('gdrive')} disabled={gdriveStatus !== 'connected'} className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed">
                                <GoogleDriveIcon/> Google Drive
                           </button>
                        </div>
                    </div>
                    <div className="bg-slate-50 p-4 flex justify-end gap-4 border-t">
                        <button type="button" onClick={() => setIsSaveModalOpen(false)} className="bg-slate-200 text-slate-700 font-semibold py-2 px-4 rounded-lg hover:bg-slate-300">Cancel</button>
                    </div>
                </div>
            </div>
        )}

        {/* Load Modal */}
        {isLoadModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4">
                <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
                    <div className="p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Load Backup From...</h3>
                        <p className="text-sm text-slate-500 mb-4">Warning: Loading a backup will overwrite all current data.</p>
                        <div className="space-y-4">
                           <button onClick={handleLoadFromLocalClick} className="w-full flex items-center justify-center gap-2 bg-slate-600 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:bg-slate-700">
                                <UploadIcon/> Local Computer
                           </button>
                           <button onClick={handleLoadFromDriveClick} disabled={gdriveStatus !== 'connected'} className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed">
                                <GoogleDriveIcon/> Google Drive
                           </button>
                        </div>
                    </div>
                    <div className="bg-slate-50 p-4 flex justify-end gap-4 border-t">
                        <button type="button" onClick={() => setIsLoadModalOpen(false)} className="bg-slate-200 text-slate-700 font-semibold py-2 px-4 rounded-lg hover:bg-slate-300">Cancel</button>
                    </div>
                </div>
            </div>
        )}
        
        {/* Drive Action Loading Overlay */}
        {isDriveActionLoading && (
            <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 text-white">
                <div className="flex flex-col items-center gap-4">
                    <svg className="animate-spin h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-lg font-semibold">Processing with Google Drive...</p>
                </div>
            </div>
        )}
    </>
  );
};

export default SetupPage;