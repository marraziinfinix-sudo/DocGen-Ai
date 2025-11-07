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
  PartiallyPaid = 'Partially Paid',
}

export enum QuotationStatus {
  Active = 'Active',
  Expired = 'Expired',
  Agreed = 'Agreed',
}

export interface Payment {
  id: number;
  amount: number;
  date: string;
  method: string;
  notes?: string;
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
  template: string;
  accentColor: string;
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
  companyDetails: Details;
  companyLogo: string | null;
  bankQRCode: string | null;
  issueDate: string;
  dueDate: string;
  lineItems: LineItem[];
  notes: string;
  taxRate: number;
  currency: string;
  total: number;
  status: InvoiceStatus | null;
  quotationStatus?: QuotationStatus | null;
  paidDate?: string | null;
  payments?: Payment[];
  template: string;
  accentColor: string;
}

export interface AppDataBackup {
  companies: Company[];
  clients: Client[];
  items: Item[];
  savedInvoices: SavedDocument[];
  savedQuotations: SavedDocument[];
}
