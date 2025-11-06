// FIX: Replaced component logic with actual type definitions.
// This file should only contain type definitions for the application.
// All errors in other files were related to incorrect exports from this file.

export enum DocumentType {
  Invoice = 'Invoice',
  Quotation = 'Quotation',
}

export enum InvoiceStatus {
  Pending = 'Pending',
  Paid = 'Paid',
}

export interface LineItem {
  id: number;
  description: string;
  quantity: number;
  price: number;
}

export interface Details {
  name: string;
  address: string;
  email: string;
  phone: string;
  bankName?: string;
  accountNumber?: string;
  website?: string;
  taxId?: string;
}

export interface Company {
  id: number;
  details: Details;
  logo: string | null;
  bankQRCode: string | null;
  defaultNotes: string;
  taxRate: number;
  currency: string;
}

export interface Client extends Details {
  id: number;
}

export interface Item {
  id: number;
  description: string;
  price: number;
}

export interface SavedDocument {
  id: number;
  documentNumber: string;
  documentType: DocumentType;
  clientDetails: Details;
  issueDate: string;
  dueDate: string;
  lineItems: LineItem[];
  total: number;
  status: InvoiceStatus | null;
  paidDate?: string | null;
}