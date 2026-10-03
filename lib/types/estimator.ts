export type ProjectType = 'remplacement_complet' | 'reparation' | 'nouvelle_construction';

export type MaterialType = 'bardeaux_asphalte' | 'tole' | 'membrane_elastomere';

export type SlopeType = 'faible' | 'moyenne' | 'forte';

export type CrmStatus = 'pending' | 'sent' | 'failed';

export type LeadStatus = 'nouveau' | 'en_traitement' | 'contacte' | 'qualifie' | 'perdu';

export interface ProjectStepData {
  projectType: ProjectType;
  material: MaterialType;
  surfaceSqFt: number;
  slope: SlopeType;
  demolition: boolean;
}

export interface ContactStepData {
  fullName: string;
  email: string;
  phone: string;
  city: string;
  message?: string;
}

export interface EstimateBreakdown {
  materialBasePricePerSqFt: number;
  demolitionCostPerSqFt: number;
  surfaceSqFt: number;
  slopeMultiplier: number;
  projectTypeMultiplier: number;
  subtotal: number;
  rangeMin: number;
  rangeMax: number;
  tps: number;
  tvq: number;
  totalWithTaxes: number;
  totalRangeMinWithTaxes: number;
  totalRangeMaxWithTaxes: number;
}

export interface LeadSubmissionPayload {
  project: ProjectStepData;
  estimate: EstimateBreakdown;
  contact: ContactStepData;
}

export interface LeadSubmissionResponse {
  success: boolean;
  leadId: string;
  referenceNumber: string;
  message: string;
  createdAt: string;
  verifiedEstimate?: EstimateBreakdown;
  crmStatus?: CrmStatus;
}

export interface LeadRecord {
  id: string;
  reference_number: string;
  full_name: string;
  email: string;
  phone: string;
  city: string;
  message?: string | null;
  project_type: ProjectType;
  material: MaterialType;
  surface_sqft: number;
  slope: SlopeType;
  demolition: boolean;
  subtotal: number;
  range_min: number;
  range_max: number;
  tps: number;
  tvq: number;
  total_with_taxes: number;
  crm_status: CrmStatus;
  crm_response?: Record<string, unknown> | null;
  status: LeadStatus;
  created_at: string;
  updated_at: string;
}

export interface CrmWebhookPayload {
  leadId: string;
  referenceNumber: string;
  timestamp: string;
  source: string;
  contact: {
    fullName: string;
    email: string;
    phone: string;
    city: string;
    message?: string;
  };
  project: {
    type: ProjectType;
    material: MaterialType;
    surfaceSqFt: number;
    slope: SlopeType;
    demolition: boolean;
  };
  estimate: {
    subtotal: number;
    rangeMin: number;
    rangeMax: number;
    tps: number;
    tvq: number;
    totalWithTaxes: number;
    currency: string;
  };
}
