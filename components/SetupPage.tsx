import React from 'react';
import { Details } from '../types';

interface SetupPageProps {
  companyDetails: Details;
  setCompanyDetails: React.Dispatch<React.SetStateAction<Details>>;
  companyLogo: string | null;
  setCompanyLogo: React.Dispatch<React.SetStateAction<string | null>>;
  bankQRCode: string | null;
  setBankQRCode: React.Dispatch<React.SetStateAction<string | null>>;
  notes: string;
  setNotes: React.Dispatch<React.SetStateAction<string>>;
  taxRate: number;
  setTaxRate: React.Dispatch<React.SetStateAction<number>>;
  currency: string;
  setCurrency: React.Dispatch<React.SetStateAction<string>>;
  onDone: () => void;
}

const SetupPage: React.FC<SetupPageProps> = ({
  companyDetails,
  setCompanyDetails,
  companyLogo,
  setCompanyLogo,
  bankQRCode,
  setBankQRCode,
  notes,
  setNotes,
  taxRate,
  setTaxRate,
  currency,
  setCurrency,
  onDone,
}) => {
  const handleDetailChange = (field: keyof Details, value: string) => {
    setCompanyDetails(prev => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<string | null>>
  ) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setter(event.target?.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };


  return (
    <main className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">Company Setup</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company Information */}
          <div className="md:col-span-1">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Company Information</h3>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Company Name</label>
                    <input type="text" value={companyDetails.name} onChange={e => handleDetailChange('name', e.target.value)} className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Address</label>
                    <input type="text" value={companyDetails.address} onChange={e => handleDetailChange('address', e.target.value)} className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                    <input type="email" value={companyDetails.email} onChange={e => handleDetailChange('email', e.target.value)} className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Phone</label>
                    <input type="tel" value={companyDetails.phone} onChange={e => handleDetailChange('phone', e.target.value)} className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"/>
                </div>
            </div>
          </div>
          
          {/* Branding & Defaults */}
          <div className="md:col-span-1">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Branding & Defaults</h3>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Company Logo</label>
                    <div className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                        {companyLogo ? (
                            <img src={companyLogo} alt="Company Logo Preview" className="max-h-full max-w-full object-contain p-2"/>
                        ) : (
                            <span className="text-gray-400 text-sm">No Logo Uploaded</span>
                        )}
                    </div>
                    <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, setCompanyLogo)} className="mt-2 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"/>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Default Notes / Terms</label>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4} className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"></textarea>
                </div>
            </div>
          </div>

          {/* Financial Settings */}
          <div className="md:col-span-1">
             <h3 className="text-lg font-semibold text-gray-700 mb-4">Financial Settings</h3>
             <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Default Tax Rate (%)</label>
                  <input type="number" value={taxRate} onChange={e => setTaxRate(parseFloat(e.target.value) || 0)} className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Currency Symbol</label>
                  <input
                    type="text"
                    value={currency}
                    onChange={e => setCurrency(e.target.value)}
                    className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., $, €, ¥, RM"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={companyDetails.bankName || ''}
                    onChange={e => handleDetailChange('bankName', e.target.value)}
                    className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., Global Bank"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Account Number</label>
                  <input
                    type="text"
                    value={companyDetails.accountNumber || ''}
                    onChange={e => handleDetailChange('accountNumber', e.target.value)}
                    className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., 1234567890"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Bank QR Code</label>
                  <div className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                      {bankQRCode ? (
                          <img src={bankQRCode} alt="Bank QR Code Preview" className="max-h-full max-w-full object-contain p-2"/>
                      ) : (
                          <span className="text-gray-400 text-sm">No QR Code</span>
                      )}
                  </div>
                  <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, setBankQRCode)} className="mt-2 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"/>
                </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t text-right">
            <button onClick={onDone} className="bg-indigo-600 text-white font-semibold py-2 px-6 rounded-lg shadow-md hover:bg-indigo-700 transition-colors duration-200">
                Done
            </button>
        </div>
      </div>
    </main>
  );
};

export default SetupPage;