import React, { useState } from 'react';
import { Company, Details } from '../types';
import { PlusIcon } from './Icons';

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
    <div className="fixed inset-0 bg-black bg-opacity-50 z-30 flex justify-center items-center p-4">
        <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
                <div className="p-8">
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
                            <input type="file" accept="image/*" onChange={e => handleImageChange(e, (val) => setFormData(p => ({...p, logo: val})))} className="mt-2 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"/>
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
                            <input type="file" accept="image/*" onChange={e => handleImageChange(e, (val) => setFormData(p => ({...p, bankQRCode: val})))} className="mt-2 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"/>
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


const SetupPage: React.FC<SetupPageProps> = ({ companies, setCompanies, onDone }) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingCompany, setEditingCompany] = useState<Company | null>(null);

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


  return (
    <main className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
            <h2 className="text-2xl font-bold text-gray-800">Company Profiles</h2>
            <button onClick={handleAddNew} className="flex items-center gap-2 bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-indigo-700">
                <PlusIcon /> Add New
            </button>
        </div>

        <div className="space-y-4">
            {companies.map(company => (
                 <div key={company.id} className="bg-slate-50 p-4 rounded-lg border flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        {company.logo && <img src={company.logo} alt="logo" className="w-12 h-12 object-contain bg-white rounded-md p-1 border" />}
                        <div>
                            <p className="font-bold text-slate-800">{company.details.name}</p>
                            <p className="text-sm text-slate-500">{company.details.email}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => handleEdit(company)} className="font-semibold text-indigo-600 py-1 px-3 rounded-lg hover:bg-indigo-50">Edit</button>
                        <button onClick={() => handleDelete(company.id)} className="font-semibold text-red-600 py-1 px-3 rounded-lg hover:bg-red-50">Delete</button>
                    </div>
                </div>
            ))}
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