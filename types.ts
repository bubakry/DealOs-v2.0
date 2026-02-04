export enum DealStage {
  New = 'New',
  Called = 'Called',
  OfferSent = 'Offer Sent',
  Negotiating = 'Negotiating',
  UnderContract = 'Under Contract',
  Dead = 'Dead',
}

export enum DealStatus {
  Active = 'Active',
  Pending = 'Pending',
  Sold = 'Sold',
  Expired = 'Expired',
}

export interface AssignmentAnalysis {
  arv: number;
  repairs: number;
  assignmentFee: number;
  mao: number;
  spread: number;
  confidence: 'Low' | 'Med' | 'High';
}

export interface SellerFinanceAnalysis {
  purchasePrice: number;
  downPayment: number;
  interestRate: number;
  termYears: number;
  taxesInsurance: number;
  rentEstimate: number;
  monthlyPayment: number;
  cashflow: number;
  dscr: number;
  viability: 'Pass' | 'Maybe' | 'No';
}

export interface SubToAnalysis {
  loanBalance: number;
  interestRate: number;
  monthlyPI: number;
  taxesInsurance: number;
  arrears: number;
  rentEstimate: number;
  totalPayment: number;
  entryCost: number;
  cashflow: number;
  viability: 'Pass' | 'Maybe' | 'No';
}

export interface Deal {
  id: string;
  address: string;
  zip: string;
  city: string;
  state: string;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  dom: number;
  listDate: string; // ISO date string
  status: string;
  agentName: string;
  agentPhone: string;
  agentEmail: string;
  url: string;
  remarks: string;
  
  // App specific
  stage: DealStage;
  isFavorite: boolean;
  notes: string;
  followUpDate: string | null;
  
  // Analyses
  analysisAssignment?: AssignmentAnalysis;
  analysisSellerFinance?: SellerFinanceAnalysis;
  analysisSubTo?: SubToAnalysis;
  
  buyerTags: string[];
}

export interface CsvMapping {
  address: string;
  city?: string;
  state?: string;
  zip: string;
  price: string;
  beds: string;
  baths: string;
  sqft: string;
  dom?: string;
  listDate?: string;
  agentName: string;
  agentPhone: string;
  agentEmail: string;
  url: string;
  remarks: string;
  status: string;
}
