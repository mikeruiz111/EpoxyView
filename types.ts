export enum AppState {
  IDLE = 'IDLE',
  CAPTURE = 'CAPTURE',
  PREVIEW = 'PREVIEW',
  PROCESSING = 'PROCESSING',
  RESULT = 'RESULT',
  ERROR = 'ERROR'
}

export type UserMode = 'CUSTOMER' | 'CONTRACTOR';

// FORMS DATA
export interface LeadData {
  name: string;
  phone: string;
  email: string;
}

export interface QuoteData {
  sqFt: string;
  pricePerSqFt: string;
}

// A type for our validation errors object
export type FormErrors = Partial<Record<keyof (LeadData & QuoteData), string>>;


// STYLES
export interface EpoxyStyle {
  id: string;
  name: string;
  promptDescription: string;
  css: string;
}
