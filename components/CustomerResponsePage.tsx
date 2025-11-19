
import React, { useEffect, useState } from 'react';
import { QuotationStatus, SavedDocument } from '../types';
import { fetchQuotationForResponse, respondToQuotation } from '../services/firebaseService';
import { SparklesIcon } from './Icons';

const CustomerResponsePage: React.FC = () => {
  const [quotation, setQuotation] = useState<SavedDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionTaken, setActionTaken] = useState<'agreed' | 'rejected' | null>(null);
  const [processing, setProcessing] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const uid = params.get('uid');
  const docId = params.get('id');

  useEffect(() => {
    const loadQuotation = async () => {
      if (!uid || !docId) {
        setError('Invalid link. Missing information.');
        setLoading(false);
        return;
      }

      try {
        const doc = await fetchQuotationForResponse(uid, Number(docId));
        if (doc) {
          setQuotation(doc);
          if (doc.quotationStatus === QuotationStatus.Agreed) setActionTaken('agreed');
          if (doc.quotationStatus === QuotationStatus.Rejected) setActionTaken('rejected');
        } else {
          setError('Quotation not found or has been removed.');
        }
      } catch (err) {
        console.error(err);
        setError('Unable to load quotation details.');
      } finally {
        setLoading(false);
      }
    };

    loadQuotation();
  }, [uid, docId]);

  const handleResponse = async (agree: boolean) => {
    if (!quotation || !uid) return;
    setProcessing(true);
    try {
      const newStatus = agree ? QuotationStatus.Agreed : QuotationStatus.Rejected;
      await respondToQuotation(uid, quotation.id, newStatus);
      setActionTaken(agree ? 'agreed' : 'rejected');
    } catch (err) {
      alert('Failed to register response. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return `${currency} ${amount.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !quotation) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md w-full">
          <div className="text-red-500 text-5xl mb-4">!</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Unable to Load</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-indigo-600 p-6 text-white text-center">
          <h1 className="text-2xl font-bold">{quotation.companyDetails.name}</h1>
          <p className="opacity-80">Quotation Response</p>
        </div>

        {/* Content */}
        <div className="p-8">
          {actionTaken ? (
            <div className="text-center py-8">
              <div className={`mx-auto flex items-center justify-center h-20 w-20 rounded-full mb-6 ${actionTaken === 'agreed' ? 'bg-green-100' : 'bg-red-100'}`}>
                {actionTaken === 'agreed' ? (
                  <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                ) : (
                  <svg className="h-10 w-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                )}
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {actionTaken === 'agreed' ? 'Thank You!' : 'Response Recorded'}
              </h2>
              <p className="text-gray-600">
                You have {actionTaken} this quotation. The merchant has been notified.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-8 text-center">
                <p className="text-lg text-gray-700 mb-2">
                  Do you agree with the quotation <span className="font-bold text-indigo-600">#{quotation.documentNumber}</span> and the total price <span className="font-bold text-indigo-600">{formatCurrency(quotation.total, quotation.currency)}</span> provided?
                </p>
                <p className="text-sm text-gray-500">
                  Issued on: {new Date(quotation.issueDate).toLocaleDateString()}
                </p>
              </div>

              {/* Preview Mini Table */}
              <div className="bg-slate-50 rounded-lg border p-4 mb-8 text-sm">
                <h3 className="font-semibold text-gray-700 mb-2 border-b pb-2">Items Summary</h3>
                {quotation.lineItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between py-1">
                    <span className="text-slate-600">{item.quantity}x {item.name}</span>
                    <span className="font-medium">{formatCurrency(item.price * item.quantity, quotation.currency)}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-3 mt-3 border-t font-bold text-lg">
                    <span>Total</span>
                    <span>{formatCurrency(quotation.total, quotation.currency)}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => handleResponse(false)}
                  disabled={processing}
                  className="py-4 px-6 bg-white border-2 border-slate-200 text-slate-700 rounded-lg font-bold hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition-all disabled:opacity-50"
                >
                  No, I Disagree
                </button>
                <button
                  onClick={() => handleResponse(true)}
                  disabled={processing}
                  className="py-4 px-6 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  {processing && <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>}
                  Yes, I Agree
                </button>
              </div>
            </>
          )}
        </div>
        
        <div className="bg-gray-50 p-4 text-center text-xs text-gray-400">
          Powered by InvQuo
        </div>
      </div>
    </div>
  );
};

export default CustomerResponsePage;
