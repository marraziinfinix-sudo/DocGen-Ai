
import React, { useState, useRef, useEffect } from 'react';
import { Company, Details } from '../types';
import { PlusIcon, DownloadIcon, UploadIcon, ChevronDownIcon, FolderIcon } from './Icons';

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

const DB_NAME = 'InvQuoAISettings';
const STORE_NAME = 'SettingsStore';
const HANDLE_KEY = 'saveDirectoryHandle';

// Helper to verify and request permissions for the File System Access API.
async function verifyPermission(handle: FileSystemDirectoryHandle) {
    const options = { mode: 'readwrite' as const };
    // Check if permission was already granted.
    // FIX: Cast handle to `any` to access experimental File System Access API permission methods, which may not be in the default TS typings.
    if ((await (handle as any).queryPermission(options)) === 'granted') {
        return true;
    }
    // Request permission. If the user grants permission, return true.
    // FIX: Cast handle to `any` to access experimental File System Access API permission methods, which may not be in the default TS typings.
    if ((await (handle as any).requestPermission(options)) === 'granted') {
        return true;
    }
    // The user didn't grant permission, so return false.
    return false;
}

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
    const [directoryHandle, setDirectoryHandle] = useState<FileSystemDirectoryHandle | null>(null);
    const [directoryName, setDirectoryName] = useState<string | null>(null);

    const isFileSystemApiSupported = 'showDirectoryPicker' in window;
    const isInIframe = window.self !== window.top;

    useEffect(() => {
        const closeMenu = () => setIsExportMenuOpen(false);
        if (isExportMenuOpen) {
            window.addEventListener('click', closeMenu);
        }
        return () => window.removeEventListener('click', closeMenu);
    }, [isExportMenuOpen]);

    useEffect(() => {
        if (!isFileSystemApiSupported || isInIframe) return;

        const loadHandle = async () => {
            const dbRequest = indexedDB.open(DB_NAME, 1);
            dbRequest.onupgradeneeded = () => dbRequest.result.createObjectStore(STORE_NAME);
            dbRequest.onsuccess = () => {
                const db = dbRequest.result;
                const tx = db.transaction(STORE_NAME, 'readonly');
                const store = tx.objectStore(STORE_NAME);
                const getRequest = store.get(HANDLE_KEY);
                
                getRequest.onsuccess = async () => {
                    const handle = getRequest.result as FileSystemDirectoryHandle | undefined;
                    if (handle) {
                        if (await verifyPermission(handle)) {
                            setDirectoryHandle(handle);
                            setDirectoryName(handle.name);
                        } else {
                            // Permission denied or revoked. Clear the stored handle.
                            const deleteTx = db.transaction(STORE_NAME, 'readwrite');
                            deleteTx.objectStore(STORE_NAME).delete(HANDLE_KEY);
                        }
                    }
                };
                tx.oncomplete = () => db.close();
            };
        };
        loadHandle();
    }, [isFileSystemApiSupported, isInIframe]);

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
    
    const handleSetSaveLocation = async () => {
        if (!isFileSystemApiSupported) {
            alert('Your browser does not support this feature.');
            return;
        }
        try {
            const handle = await (window as any).showDirectoryPicker();
            setDirectoryHandle(handle);
            setDirectoryName(handle.name);
            
            const dbRequest = indexedDB.open(DB_NAME, 1);
            dbRequest.onupgradeneeded = () => dbRequest.result.createObjectStore(STORE_NAME);
            dbRequest.onsuccess = () => {
                const db = dbRequest.result;
                const tx = db.transaction(STORE_NAME, 'readwrite');
                tx.objectStore(STORE_NAME).put(handle, HANDLE_KEY);
                tx.oncomplete = () => db.close();
            };
        } catch (error: any) {
            if (error.name !== 'AbortError') {
              console.error('Error selecting directory:', error);
            }
        }
    };

    const handleClearSaveLocation = () => {
        setDirectoryHandle(null);
        setDirectoryName(null);
        const dbRequest = indexedDB.open(DB_NAME, 1);
        dbRequest.onsuccess = () => {
            const db = dbRequest.result;
            const tx = db.transaction(STORE_NAME, 'readwrite');
            tx.objectStore(STORE_NAME).delete(HANDLE_KEY);
            tx.oncomplete = () => db.close();
        };
    };

    const prepareDataForSave = (category: string) => {
        if (category === 'all') {
            const dataToExport: { [key: string]: any } = {};
            const keys = ['companies', 'clients', 'items', 'savedInvoices', 'savedQuotations'];
            keys.forEach(key => {
                const item = localStorage.getItem(key);
                if (item) {
                    try {
                        dataToExport[key] = JSON.parse(item);
                    } catch (e) {
                        console.error(`Could not parse ${key} from localStorage`, e);
                    }
                }
            });
            return { name: 'all', data: dataToExport };
        } else {
            const item = localStorage.getItem(category);
            return { name: category, data: item ? JSON.parse(item) : [] };
        }
    }

    const handleExportData = async (category: string) => {
        setIsExportMenuOpen(false);
        const { name, data } = prepareDataForSave(category);

        const dataIsPresent = data && (!Array.isArray(data) || data.length > 0) && (typeof data === 'object' && Object.keys(data).length > 0);
        if (!dataIsPresent) {
            alert(`No data to export for "${name}".`);
            return;
        }

        const date = new Date().toISOString().split('T')[0];
        const fileName = `invquo-ai-backup-${name}-${date}.json`;
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });

        if (directoryHandle && await verifyPermission(directoryHandle)) {
            try {
                const fileHandle = await directoryHandle.getFileHandle(fileName, { create: true });
                const writable = await fileHandle.createWritable();
                await writable.write(blob);
                await writable.close();
                alert(`Data successfully exported to '${directoryHandle.name}'!`);
                return;
            } catch (error: any) {
                console.error('Error saving with File System Access API:', error);
                if (error.name !== 'AbortError') {
                    alert('Could not save to the selected directory. The file will be saved to your Downloads folder instead.');
                } else {
                    return; 
                }
            }
        }

        // Fallback to the standard download method
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
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
                <div className="mb-8">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Local Save Location</h2>
                     { isFileSystemApiSupported && !isInIframe ? (
                        <div className="bg-slate-50 p-4 rounded-lg border space-y-3">
                            <p className="text-slate-600 text-sm">Set a default folder to save backups directly without a "Save As" prompt.</p>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <p className="text-sm text-slate-700">
                                    Current save folder: 
                                    {directoryName ? (
                                        <span className="font-semibold text-indigo-700 ml-1 break-all">{directoryName}</span>
                                    ) : (
                                        <span className="text-slate-500 ml-1">Not set (saves to Downloads)</span>
                                    )}
                                </p>
                                <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                                    <button onClick={handleSetSaveLocation} className="flex items-center justify-center gap-2 bg-white text-slate-700 font-semibold py-2 px-4 rounded-lg shadow-sm border hover:bg-slate-100 text-sm">
                                        <FolderIcon /> {directoryName ? 'Change' : 'Set Location'}
                                    </button>
                                    {directoryName && (
                                        <button onClick={handleClearSaveLocation} className="text-sm font-semibold text-red-600 py-2 px-3 rounded-lg hover:bg-red-50">Clear</button>
                                    )}
                                </div>
                            </div>
                        </div>
                     ) : (
                        <div className="bg-slate-50 p-4 rounded-lg border">
                            <p className="text-slate-600 text-sm">
                                {isInIframe
                                    ? "Setting a default save location is disabled in this embedded view due to browser security policies. Backups will be saved to your Downloads folder."
                                    : "Your browser doesn't support setting a default save location. Backups will be saved to your Downloads folder."}
                            </p>
                        </div>
                     )}
                </div>

                <div className="mb-8">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Data Management</h2>
                    <p className="text-slate-600 mb-4">Save your data to a file for backup, or restore from a previously saved file.</p>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative inline-block text-left flex-1">
                          <button onClick={(e) => { e.stopPropagation(); setIsExportMenuOpen(prev => !prev); }} className="w-full flex items-center justify-center gap-2 bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-slate-700">
                            <DownloadIcon />
                            <span>Export Data</span>
                            <ChevronDownIcon />
                          </button>
                          {isExportMenuOpen && (
                            <div className="origin-top-right absolute right-0 mt-2 w-full rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                              <div className="py-1" role="menu">
                                <button onClick={() => handleExportData('all')} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100" role="menuitem">Export All Data</button>
                                <div className="border-t my-1"></div>
                                <button onClick={() => handleExportData('companies')} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100" role="menuitem">Export Companies</button>
                                <button onClick={() => handleExportData('clients')} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100" role="menuitem">Export Clients</button>
                                <button onClick={() => handleExportData('items')} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100" role="menuitem">Export Items</button>
                                <button onClick={() => handleExportData('savedInvoices')} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100" role="menuitem">Export Invoices</button>
                                <button onClick={() => handleExportData('savedQuotations')} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100" role="menuitem">Export Quotations</button>
                              </div>
                            </div>
                          )}
                        </div>

                        <button onClick={() => fileInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-slate-700">
                            <UploadIcon /> Import Data
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
    </>
  );
};

export default SetupPage;
