
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
  Rejected = 'Rejected',
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
  name: string; // New field for item name
  description: string; // Additional details for the item
  quantity: number;
  costPrice: number;
  markup: number;
  price: number; // This is the selling price
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
  name: string; // New field for item name
  description: string; // Additional details for the item
  costPrice: number;
  price: number; // This is the default selling price
  category?: string;
}

export interface Recurrence {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  endDate?: string | null;
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
  recurrence?: Recurrence | null;
  recurrenceParentId?: number | null;
  relatedDocumentId?: number | null; // Link between Quote and Invoice
}
