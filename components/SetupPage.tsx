
import React, { useState, useRef, useEffect } from 'react';
import { Company, Details } from '../types';
import { PlusIcon, UploadIcon, ChevronDownIcon } from './Icons';

interface SetupPageProps {
  companies: Company[];
  setCompanies: React.Dispatch<React.SetStateAction<Company[]>>;
  onDone: () => void;
  activeCompanyId: number;
  setActiveCompanyId: React.Dispatch<React.SetStateAction<number>>;
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
    onDone,
    activeCompanyId,
    setActiveCompanyId
}) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingCompany, setEditingCompany] = useState<Company | null>(null);
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const exportMenuRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
                setIsExportMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [exportMenuRef]);

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
                return newCompanies;
            });
        }
    };
    
    const handleFormSave = (updatedCompany: Company) => {
        if (updatedCompany.id === 0) { // New company
            const newCompany = { ...updatedCompany, id: Date.now() };
            setCompanies(prev => [...prev, newCompany]);
            setActiveCompanyId(newCompany.id); // Set new company as active
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
    
    const handleExportData = async (dataType: 'full' | 'companies' | 'clients' | 'items' | 'invoices' | 'quotations') => {
        let dataToExport: any;
        const date = new Date().toISOString().split('T')[0];
        let fileName = `invquo-ai-backup-${dataType}-${date}.json`;

        const keyMap = {
            companies: 'companies',
            clients: 'clients',
            items: 'items',
            invoices: 'savedInvoices',
            quotations: 'savedQuotations'
        };

        if (dataType === 'full') {
            const fullData: { [key: string]: any } = {};
            const keys = ['companies', 'clients', 'items', 'savedInvoices', 'savedQuotations', 'activeCompanyId'];
            keys.forEach(key => {
                const item = localStorage.getItem(key);
                if (item) {
                    try {
                        fullData[key] = JSON.parse(item);
                    } catch (e) {
                        fullData[key] = item;
                    }
                }
            });

            const hasContent = Object.values(fullData).some(v => (Array.isArray(v) ? v.length > 0 : v !== null));
            if (!hasContent) {
                alert('No data to export.');
                return;
            }
            dataToExport = fullData;
        } else {
            const storageKey = keyMap[dataType];
            const item = localStorage.getItem(storageKey);
            if (!item || (JSON.parse(item) as any[]).length === 0) {
                alert(`No ${dataType} data to export.`);
                return;
            }
            dataToExport = JSON.parse(item);
        }

        const jsonString = JSON.stringify(dataToExport, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });

        if ('showSaveFilePicker' in window && window.self === window.top) {
            try {
                const handle = await (window as any).showSaveFilePicker({
                    suggestedName: fileName,
                    types: [{
                        description: 'JSON Backup File',
                        accept: { 'application/json': ['.json'] },
                    }],
                });
                const writable = await handle.createWritable();
                await writable.write(blob);
                await writable.close();
                return;
            } catch (err: any) {
                if (err.name === 'AbortError') return;
                console.error('Error using showSaveFilePicker, trying fallback:', err);
            }
        }
        
        try {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Fallback download method also failed:', error);
            alert('Could not save the file. Your browser may not support this feature or it may be blocked.');
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

            if (!isFullBackup) {
                alert('Invalid backup file. The file does not appear to contain all the required data for a full restore.');
                return;
            }
            
            [...requiredKeys, 'activeCompanyId'].forEach(key => {
                if (data[key]) {
                    localStorage.setItem(key, JSON.stringify(data[key]));
                } else {
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
            
            <div className="mt-8 pt-6 border-t">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Data Management</h2>
                <p className="text-slate-600 mb-4">Backup your application data to a JSON file, or restore from a previous backup. You can export a full backup or specific data types.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-50 p-4 rounded-lg border">
                        <h3 className="font-semibold text-slate-700 mb-2">Export Data</h3>
                        <p className="text-sm text-slate-500 mb-4">Save your data to a file. You can save a full backup or individual data types.</p>
                        <div ref={exportMenuRef} className="relative inline-block text-left">
                            <button onClick={() => setIsExportMenuOpen(!isExportMenuOpen)} type="button" className="inline-flex items-center justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                Choose data to export
                                <ChevronDownIcon />
                            </button>
                            {isExportMenuOpen && (
                                <div className="origin-top-left absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                                    <div className="py-1" role="menu" aria-orientation="vertical">
                                        <button onClick={() => { handleExportData('full'); setIsExportMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">Full Backup</button>
                                        <div className="border-t my-1"></div>
                                        <button onClick={() => { handleExportData('companies'); setIsExportMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">Companies</button>
                                        <button onClick={() => { handleExportData('clients'); setIsExportMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">Clients</button>
                                        <button onClick={() => { handleExportData('items'); setIsExportMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">Items</button>
                                        <button onClick={() => { handleExportData('invoices'); setIsExportMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">Invoices</button>
                                        <button onClick={() => { handleExportData('quotations'); setIsExportMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">Quotations</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="bg-slate-50 p-4 rounded-lg border">
                        <h3 className="font-semibold text-slate-700 mb-2">Import Data</h3>
                        <p className="text-sm text-slate-500 mb-4">Restore from a full backup file. This will <span className="font-bold text-red-600">overwrite</span> all current data.</p>
                        <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-2 bg-white text-slate-700 font-semibold py-2 px-4 rounded-lg shadow-sm border hover:bg-slate-100">
                            <UploadIcon /> Choose Backup File...
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden"/>
                    </div>
                </div>
                 <p className="text-xs text-slate-500 mt-3">
                    Your browser will prompt you to choose a save/load location. All data remains on your local computer and is not sent to any server.
                </p>

                <div className="mt-8 text-right">
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
