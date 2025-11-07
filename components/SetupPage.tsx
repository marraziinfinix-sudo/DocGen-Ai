import React, { useRef } from 'react';
import { Company, Details, Client, Item, SavedDocument, AppDataBackup } from '../types';
import { SyncStatus } from '../App';
import * as GoogleDriveService from '../services/googleDriveService';
import { PlusIcon, DownloadIcon, CloudUploadIcon } from './Icons';

interface SetupPageProps {
  companies: Company[];
  setCompanies: React.Dispatch<React.SetStateAction<Company[]>>;
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  items: Item[];
  setItems: React.Dispatch<React.SetStateAction<Item[]>>;
  savedInvoices: SavedDocument[];
  setSavedInvoices: React.Dispatch<React.SetStateAction<SavedDocument[]>>;
  savedQuotations: SavedDocument[];
  setSavedQuotations: React.Dispatch<React.SetStateAction<SavedDocument[]>>;
  onDone: () => void;
  // Google Drive Props
  googleClientId: string;
  setGoogleClientId: (id: string) => void;
  isGapiReady: boolean;
  isSignedIn: boolean;
  setIsSignedIn: (signedIn: boolean) => void;
  syncStatus: SyncStatus;
  setSyncStatus: (status: SyncStatus) => void;
  isAutoSyncEnabled: boolean;
  setIsAutoSyncEnabled: (enabled: boolean) => void;
  handleTokenResponse: (tokenResponse: any) => void;
  performSync: () => Promise<void>;
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
  const [formData, setFormData] = React.useState<Company>(company);

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
    <div className="fixed inset-0 bg-black bg-opacity-50 z-30 flex justify-center items-center p-4">
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
                
                 <div className="mt-8 pt-6 border-t p-8">
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

const SetupPage: React.FC<SetupPageProps> = (props) => {
    const {
        companies, setCompanies, clients, setClients, items, setItems,
        savedInvoices, setSavedInvoices, savedQuotations, setSavedQuotations,
        onDone, googleClientId, setGoogleClientId, isGapiReady, isSignedIn, setIsSignedIn,
        syncStatus, setSyncStatus, isAutoSyncEnabled, setIsAutoSyncEnabled, handleTokenResponse, performSync
    } = props;

    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const [editingCompany, setEditingCompany] = React.useState<Company | null>(null);
    const restoreInputRef = useRef<HTMLInputElement>(null);

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
    
    const handleDownloadBackup = () => {
        try {
            const backupData: AppDataBackup = { companies, clients, items, savedInvoices, savedQuotations };
            const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'quotinv_ai_backup.json';
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            alert('Error generating backup file.');
        }
    };

    const handleFileRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!window.confirm("Restore from file? This will overwrite ALL current local data.")) return;
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data: AppDataBackup = JSON.parse(e.target?.result as string);
                if (data.companies && data.clients && data.items && data.savedInvoices && data.savedQuotations) {
                    setCompanies(data.companies);
                    setClients(data.clients);
                    setItems(data.items);
                    setSavedInvoices(data.savedInvoices);
                    setSavedQuotations(data.savedQuotations);
                    alert("Data restored successfully!");
                } else { throw new Error("Invalid format"); }
            } catch { alert("Failed to restore. File may be corrupt."); }
        };
        reader.readAsText(file);
    };

    // Google Drive Handlers
    const handleConnectClick = () => {
        if (!googleClientId) {
            alert("Please provide a Google Client ID first.");
            return;
        }
        localStorage.setItem('googleClientId', googleClientId);
        GoogleDriveService.initGoogleClient(googleClientId, handleTokenResponse);
        GoogleDriveService.handleAuthClick();
    };
    
    const handleDisconnectClick = () => {
        GoogleDriveService.handleSignOutClick();
        localStorage.removeItem('googleAuthToken');
        setIsSignedIn(false);
        setSyncStatus('disconnected');
    };

    const handleToggleAutoSync = (e: React.ChangeEvent<HTMLInputElement>) => {
        const enabled = e.target.checked;
        setIsAutoSyncEnabled(enabled);
        localStorage.setItem('isAutoSyncEnabled', String(enabled));
    };

    const handleRestoreFromDrive = async () => {
        if (!window.confirm("Restore from Google Drive? This will overwrite ALL current local data.")) return;
        setSyncStatus('syncing');
        try {
            const data = await GoogleDriveService.loadBackupFromDrive();
            if (data) {
                const backupData = data as AppDataBackup;
                if (backupData.companies && backupData.clients && backupData.items && backupData.savedInvoices && backupData.savedQuotations) {
                    setCompanies(backupData.companies);
                    setClients(backupData.clients);
                    setItems(backupData.items);
                    setSavedInvoices(backupData.savedInvoices);
                    setSavedQuotations(backupData.savedQuotations);
                    setSyncStatus('synced');
                    alert("Data restored from Google Drive successfully!");
                } else { throw new Error("Invalid format in Drive file."); }
            } else {
                alert("No backup file found in Google Drive.");
                setSyncStatus('idle');
            }
        } catch (error) {
            console.error("Drive restore failed", error);
            alert("Failed to restore from Google Drive. Check console for details.");
            setSyncStatus('error');
        }
    };
    
    const getSyncStatusMessage = () => {
        switch (syncStatus) {
            case 'idle': return 'Connected. Last sync was successful.';
            case 'syncing': return 'Syncing...';
            case 'synced': return `Synced just now.`;
            case 'error': return 'Error: Sync failed. Please reconnect.';
            case 'disconnected': return 'Not connected to Google Drive.';
            default: return 'Ready.';
        }
    };

  return (
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
            <h2 className="text-xl font-bold text-gray-800 mb-4">Cloud Sync (Google Drive)</h2>
            <div className="bg-slate-50 p-6 rounded-lg border">
                {!isSignedIn ? (
                    <>
                        <p className="text-sm text-slate-600 mb-2">Connect to Google Drive to enable automatic cloud backup and sync across devices.</p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <input
                                type="text"
                                placeholder="Enter Your Google Client ID"
                                value={googleClientId}
                                onChange={e => setGoogleClientId(e.target.value)}
                                className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                            />
                            <button onClick={handleConnectClick} disabled={!isGapiReady || !googleClientId} className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed">
                                {isGapiReady ? 'Connect' : 'Initializing...'}
                            </button>
                        </div>
                    </>
                ) : (
                    <div>
                        <p className="text-sm text-green-700 font-semibold mb-4">Connected to Google Drive.</p>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center">
                                <label htmlFor="auto-sync-toggle" className="font-medium text-slate-700">Enable Auto-Sync</label>
                                <input id="auto-sync-toggle" type="checkbox" checked={isAutoSyncEnabled} onChange={handleToggleAutoSync} className="ml-4 h-6 w-11 rounded-full bg-slate-300 relative inline-flex items-center transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 checked:bg-indigo-600">
                                  <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${isAutoSyncEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                </input>
                            </div>
                            <button onClick={handleDisconnectClick} className="font-semibold text-red-600 py-1 px-3 rounded-lg hover:bg-red-50">Disconnect</button>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 items-center justify-between pt-4 border-t">
                            <p className="text-sm text-slate-500">{getSyncStatusMessage()}</p>
                            <div className="flex gap-2">
                                <button onClick={() => performSync()} disabled={syncStatus === 'syncing'} className="bg-white text-slate-700 font-semibold py-2 px-4 rounded-lg border border-slate-300 hover:bg-slate-100 disabled:bg-slate-100 disabled:text-slate-400">
                                    {syncStatus === 'syncing' ? 'Syncing...' : 'Sync Now'}
                                </button>
                                <button onClick={handleRestoreFromDrive} disabled={syncStatus === 'syncing'} className="bg-indigo-100 text-indigo-700 font-semibold py-2 px-4 rounded-lg hover:bg-indigo-200 disabled:bg-indigo-50 disabled:text-indigo-300">
                                    Restore from Drive
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>

        <div className="mt-8 pt-6 border-t">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Manual Data Backup & Restore</h2>
            <div className="bg-slate-50 p-4 rounded-lg border">
                 <p className="text-sm text-slate-500 max-w-2xl mb-4">
                    Download a local backup file of all your data. You can use this file to restore your data on this or another device at any time.
                </p>
                <div className="flex items-center gap-2">
                    <input type="file" ref={restoreInputRef} onChange={handleFileRestore} style={{ display: 'none' }} accept=".json" />
                    <button onClick={handleDownloadBackup} className="flex items-center gap-2 bg-white text-slate-700 font-semibold py-2 px-4 rounded-lg border border-slate-300 hover:bg-slate-100">
                        <DownloadIcon />
                        Download Backup
                    </button>
                    <button onClick={() => restoreInputRef.current?.click()} className="flex items-center gap-2 bg-white text-slate-700 font-semibold py-2 px-4 rounded-lg border border-slate-300 hover:bg-slate-100">
                       <CloudUploadIcon />
                        Restore from File
                    </button>
                </div>
            </div>
        </div>
        
        <div className="mt-8 pt-6 border-t text-right">
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
    </main>
  );
};

export default SetupPage;