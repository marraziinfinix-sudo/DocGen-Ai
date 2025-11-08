

import React, { useState, useMemo, useCallback } from 'react';
import { DocumentType, LineItem, Details } from './types';
import { generateDescription } from './services/geminiService';
import { SparklesIcon, PlusIcon, TrashIcon, PrinterIcon } from './components/Icons';
import DocumentPreview from './components/DocumentPreview';

const App: React.FC = () => {
  const [documentType, setDocumentType] = useState<DocumentType>(DocumentType.Invoice);
  const [companyDetails, setCompanyDetails] = useState<Details>({ name: 'Your Company', address: '123 Main St, Anytown, USA', email: 'contact@yourcompany.com', phone: '555-123-4567' });
  const [clientDetails, setClientDetails] = useState<Details>({ name: 'Client Name', address: '456 Oak Ave, Otherville, USA', email: 'client@example.com', phone: '' });
  const [documentNumber, setDocumentNumber] = useState('001');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  });
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: 1, description: 'E.g., Web Design Services', quantity: 10, price: 150.00 },
    { id: 2, description: 'E.g., Content Management System', quantity: 1, price: 2500.00 },
  ]);
  const [notes, setNotes] = useState('Thank you for your business.');
  const [taxRate, setTaxRate] = useState(8);
  const [generatingStates, setGeneratingStates] = useState<Record<number, boolean>>({});

  const handleLineItemChange = useCallback((id: number, field: keyof Omit<LineItem, 'id'>, value: string | number) => {
    setLineItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  }, []);

  const addLineItem = useCallback(() => {
    setLineItems(prevItems => [
      ...prevItems,
      { id: Date.now(), description: '', quantity: 1, price: 0 },
    ]);
  }, []);

  const removeLineItem = useCallback((id: number) => {
    setLineItems(prevItems => prevItems.filter(item => item.id !== id));
  }, []);

  const handleGenerateDescription = async (id: number) => {
    const item = lineItems.find(item => item.id === id);
    if (!item || !item.description) return;

    setGeneratingStates(prev => ({ ...prev, [id]: true }));
    try {
      const newDescription = await generateDescription(item.description);
      handleLineItemChange(id, 'description', newDescription);
    } catch (error) {
      console.error("Failed to generate description", error);
    } finally {
      setGeneratingStates(prev => ({ ...prev, [id]: false }));
    }
  };

  // FIX: This function is now curried to match the signature expected by renderDetailsForm.
  // It takes a setter function and returns another function that takes a field name,
  // which in turn returns the final event handler. This resolves the type errors.
  const handleDetailChange = <T,>(setter: React.Dispatch<React.SetStateAction<T>>) => (field: keyof T) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setter(prev => ({ ...prev, [field]: e.target.value }));
  };

  const { subtotal, taxAmount, total } = useMemo(() => {
    const subtotal = lineItems.reduce((acc, item) => acc + item.quantity * item.price, 0);
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;
    return { subtotal, taxAmount, total };
  }, [lineItems, taxRate]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const renderDetailsForm = (title: string, details: Details, handler: (field: keyof Details) => (e: React.ChangeEvent<HTMLInputElement>) => void) => (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold text-slate-700 mb-3">{title}</h3>
      <div className="space-y-2">
        <input type="text" placeholder="Name" value={details.name} onChange={handler('name')} className="w-full p-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"/>
        <input type="text" placeholder="Address" value={details.address} onChange={handler('address')} className="w-full p-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"/>
        <input type="email" placeholder="Email" value={details.email} onChange={handler('email')} className="w-full p-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"/>
        <input type="tel" placeholder="Phone" value={details.phone} onChange={handler('phone')} className="w-full p-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"/>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen font-sans text-slate-800">
      <header className="bg-white shadow-md sticky top-0 z-20 no-print">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600">AI Doc Generator</h1>
          <button onClick={() => window.print()} className="flex items-center gap-2 bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-indigo-700 transition-colors duration-200">
            <PrinterIcon />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </header>
      
      <main className="container mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-6 no-print">
          {/* Document Type Toggle */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-lg">
              <button onClick={() => setDocumentType(DocumentType.Invoice)} className={`w-full py-2 rounded-md font-semibold transition-colors ${documentType === DocumentType.Invoice ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:bg-slate-200'}`}>
                Invoice
              </button>
              <button onClick={() => setDocumentType(DocumentType.Quotation)} className={`w-full py-2 rounded-md font-semibold transition-colors ${documentType === DocumentType.Quotation ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:bg-slate-200'}`}>
                Quotation
              </button>
            </div>
          </div>
          
          {/* Company & Client Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderDetailsForm("From", companyDetails, handleDetailChange(setCompanyDetails))}
            {renderDetailsForm("To", clientDetails, handleDetailChange(setClientDetails))}
          </div>

          {/* Document Info */}
          <div className="bg-white p-4 rounded-lg shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
             <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">{documentType} #</label>
                <input type="text" value={documentNumber} onChange={e => setDocumentNumber(e.target.value)} className="w-full p-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Date Issued</label>
                <input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} className="w-full p-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            {documentType === DocumentType.Invoice && (
              <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Due Date</label>
                  <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full p-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
            )}
          </div>
          
          {/* Line Items */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-slate-700 mb-3">Items</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-slate-500">
                  <tr className="border-b">
                    <th className="font-semibold p-2 w-1/2">Description</th>
                    <th className="font-semibold p-2 w-1/6">Qty</th>
                    <th className="font-semibold p-2 w-1/6">Price</th>
                    <th className="font-semibold p-2 w-1/6 text-right">Total</th>
                    <th className="font-semibold p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item, index) => (
                    <tr key={item.id} className="border-b border-slate-100">
                      <td className="p-2 align-top">
                        <div className="relative">
                          <textarea
                            value={item.description}
                            onChange={(e) => handleLineItemChange(item.id, 'description', e.target.value)}
                            rows={2}
                            placeholder="Item description"
                            className="w-full p-2 pr-10 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                          />
                          <button onClick={() => handleGenerateDescription(item.id)} disabled={generatingStates[item.id]} className="absolute top-2 right-2 p-1 text-indigo-500 hover:bg-indigo-100 rounded-full disabled:text-slate-400 disabled:cursor-wait">
                            <SparklesIcon isLoading={generatingStates[item.id]} />
                          </button>
                        </div>
                      </td>
                      <td className="p-2 align-top"><input type="number" min="0" value={item.quantity} onChange={(e) => handleLineItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)} className="w-full p-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"/></td>
                      <td className="p-2 align-top"><input type="number" min="0" step="0.01" value={item.price} onChange={(e) => handleLineItemChange(item.id, 'price', parseFloat(e.target.value) || 0)} className="w-full p-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"/></td>
                      <td className="p-2 align-top text-right text-slate-600">{formatCurrency(item.quantity * item.price)}</td>
                      <td className="p-2 align-top"><button onClick={() => removeLineItem(item.id)} className="text-red-500 hover:text-red-700 p-2"><TrashIcon/></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={addLineItem} className="mt-4 flex items-center gap-2 text-indigo-600 font-semibold py-2 px-4 rounded-lg hover:bg-indigo-50 transition-colors">
              <PlusIcon/> Add Item
            </button>
          </div>

          {/* Totals & Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-slate-700 mb-3">Notes / Terms</h3>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} className="w-full p-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"></textarea>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Subtotal</span>
                <span className="font-semibold">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center">
                <label className="text-slate-600">Tax (%)</label>
                <input type="number" value={taxRate} onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)} className="w-20 p-1 border border-slate-200 rounded-md text-right focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Tax</span>
                <span className="font-semibold">{formatCurrency(taxAmount)}</span>
              </div>
              <div className="border-t pt-3 mt-3 flex justify-between items-center">
                <span className="text-xl font-bold text-slate-800">Total</span>
                <span className="text-xl font-bold text-indigo-600">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="sticky top-24">
            <DocumentPreview 
              documentType={documentType}
              companyDetails={companyDetails}
              clientDetails={clientDetails}
              documentNumber={documentNumber}
              issueDate={issueDate}
              dueDate={dueDate}
              lineItems={lineItems}
              notes={notes}
              subtotal={subtotal}
              taxAmount={taxAmount}
              taxRate={taxRate}
              total={total}
              formatCurrency={formatCurrency}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;