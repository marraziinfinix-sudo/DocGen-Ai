
import React, { useState, useRef } from 'react';
import { DownloadIcon, UploadIcon } from './Icons';

interface DataPageProps {
  onDone: () => void;
}

const DataPage: React.FC<DataPageProps> = ({ onDone }) => {
    const [exportOption, setExportOption] = useState('all');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExportData = () => {
        try {
            const date = new Date().toISOString().split('T')[0];
            let dataToExport: any;
            let filename: string;

            if (exportOption === 'all') {
                const allData: { [key: string]: any } = {};
                const keys = ['companies', 'clients', 'items', 'savedInvoices', 'savedQuotations'];
                keys.forEach(key => {
                    const item = localStorage.getItem(key);
                    if (item) {
                        allData[key] = JSON.parse(item);
                    }
                });
                dataToExport = allData;
                filename = `invquo-ai-backup-${date}.json`;
            } else {
                const keyMap: { [key: string]: string } = {
                    companies: 'companies',
                    clients: 'clients',
                    items: 'items',
                    invoices: 'savedInvoices',
                    quotations: 'savedQuotations',
                };
                const storageKey = keyMap[exportOption];
                const item = localStorage.getItem(storageKey);
                dataToExport = item ? JSON.parse(item) : [];
                filename = `invquo-ai-${exportOption}-${date}.json`;
            }
    
            const optionTextMap: { [key: string]: string } = {
                all: "All Data",
                companies: "Company Profiles",
                clients: "Clients",
                items: "Items",
                invoices: "Invoices",
                quotations: "Quotations"
            };

            if (
                !dataToExport ||
                (Array.isArray(dataToExport) && dataToExport.length === 0) ||
                (typeof dataToExport === 'object' && !Array.isArray(dataToExport) && Object.keys(dataToExport).length === 0)
            ) {
                alert(`No data found for "${optionTextMap[exportOption]}" to export.`);
                return;
            }
    
            const jsonString = JSON.stringify(dataToExport, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            alert(`'${optionTextMap[exportOption]}' exported successfully!`);
    
        } catch (error) {
            console.error('Failed to export data:', error);
            alert('An error occurred while exporting data.');
        }
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!window.confirm('This will overwrite all existing data. This action cannot be undone. Are you sure you want to proceed?')) {
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const data = JSON.parse(text);
                
                const requiredKeys = ['companies', 'clients', 'items', 'savedInvoices', 'savedQuotations'];
                const importedKeys = Object.keys(data);
                const hasAllKeys = requiredKeys.every(key => importedKeys.includes(key));
                
                if (!hasAllKeys) {
                    alert('Invalid backup file. The file is missing required data sections.');
                    return;
                }

                requiredKeys.forEach(key => {
                    if (data[key]) {
                        localStorage.setItem(key, JSON.stringify(data[key]));
                    }
                });

                alert('Data imported successfully! The application will now reload.');
                window.location.reload();
            } catch (error) {
                console.error('Failed to import data:', error);
                alert('An error occurred while importing data. The file might be corrupted or in the wrong format.');
            } finally {
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-800">Data Management</h2>
                <p className="mt-2 text-slate-500">Backup, restore, or export your application data.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Export Card */}
                <div className="bg-white p-6 rounded-lg shadow-md border flex flex-col">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Export Data</h3>
                    <p className="text-sm text-slate-500 mb-4 flex-grow">Download your data as a JSON file. You can export all data for a complete backup, or select a specific data type.</p>
                    <div className="flex flex-col sm:flex-row items-center gap-2">
                        <select
                            value={exportOption}
                            onChange={e => setExportOption(e.target.value)}
                            className="w-full sm:flex-grow p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="all">All Data (Backup)</option>
                            <option value="companies">Company Profiles</option>
                            <option value="clients">Clients</option>
                            <option value="items">Items</option>
                            <option value="invoices">Invoices</option>
                            <option value="quotations">Quotations</option>
                        </select>
                        <button onClick={handleExportData} className="w-full sm:w-auto flex-shrink-0 flex items-center justify-center gap-2 bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-slate-700">
                            <DownloadIcon /> Export
                        </button>
                    </div>
                </div>

                {/* Import Card */}
                <div className="bg-white p-6 rounded-lg shadow-md border flex flex-col">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Import Data</h3>
                    <p className="text-sm text-slate-500 mb-4 flex-grow">Restore your application data from a backup file (`.json`).</p>
                    
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg mb-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 3.001-1.742 3.001H4.42c-1.53 0-2.493-1.667-1.743-3.001l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-yellow-700">
                                    <span className="font-bold">Warning:</span> Importing a backup file will overwrite all existing data. This action cannot be undone.
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <button onClick={handleImportClick} className="w-full flex items-center justify-center gap-2 bg-red-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-red-700">
                        <UploadIcon /> Import From Backup
                    </button>
                </div>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json"
                className="hidden"
            />

            <div className="mt-8 pt-6 border-t text-right">
                <button onClick={onDone} className="bg-slate-500 text-white font-semibold py-2 px-6 rounded-lg shadow-md hover:bg-slate-600 transition-colors duration-200">
                    Done
                </button>
            </div>
        </div>
    );
};

export default DataPage;
