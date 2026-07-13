/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface HCP {
  id: string;
  name: string;
  specialty: string;
  hospital: string;
  email: string;
  phone: string;
  prescribingTier: 'High (Tier 1)' | 'Medium (Tier 2)' | 'Low (Tier 3)';
  lastContacted: string;
  targetFrequency: number; // times per quarter
  completedFrequency: number;
  avatarUrl?: string;
}

export type InteractionChannel = 'In-Person' | 'Virtual' | 'Email' | 'Phone';

export interface Interaction {
  id: string;
  hcpId: string;
  hcpName: string;
  date: string;
  channel: InteractionChannel;
  duration: number; // in minutes
  topics: string[];
  notes: string;
  samplesProvided: {
    name: string;
    quantity: number;
    valuePerUnit: number;
  }[];
  adverseEventFlag: boolean;
  adverseEventDetails?: string;
  medicalInquiryFlag: boolean;
  medicalInquiryDetails?: string;
  followUpDate?: string;
  followUpTask?: string;
  logMethod: 'Structured Form' | 'Conversational AI';
  complianceStatus: 'Approved' | 'Flagged for Review' | 'AE Escalated' | 'MIR Routed';
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
  extractions?: Partial<ExtractedEntities>;
}

export interface ExtractedEntities {
  hcpName?: string;
  specialty?: string;
  products?: string[];
  topicsDiscussed?: string[];
  samplesRequested?: { name: string; qty: number }[];
  adverseEvent?: { flagged: boolean; details?: string };
  medicalInquiry?: { flagged: boolean; details?: string };
  followUpTask?: string;
  followUpDate?: string;
  sentiment?: 'Positive' | 'Neutral' | 'Skeptical';
  notes?: string;
}
