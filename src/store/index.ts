/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { HCP, Interaction, ChatMessage, ExtractedEntities, InteractionChannel } from '../types';

// Mock HCP initial data (Life Science Expert Approved Profiles)
const initialHcps: HCP[] = [
  {
    id: 'hcp-1',
    name: 'Dr. Sarah Chen',
    specialty: 'Cardiologist',
    hospital: 'St. Jude Heart Center',
    email: 'sarah.chen@stjude.org',
    phone: '(555) 234-8901',
    prescribingTier: 'High (Tier 1)',
    lastContacted: '2026-06-15',
    targetFrequency: 6,
    completedFrequency: 4,
  },
  {
    id: 'hcp-2',
    name: 'Dr. Aris Thorne',
    specialty: 'Oncologist',
    hospital: 'Johns Hopkins Oncology',
    email: 'a.thorne@jhmi.edu',
    phone: '(555) 789-1234',
    prescribingTier: 'High (Tier 1)',
    lastContacted: '2026-07-02',
    targetFrequency: 8,
    completedFrequency: 7,
  },
  {
    id: 'hcp-3',
    name: 'Dr. Marcus Vance',
    specialty: 'Neurologist',
    hospital: 'Cleveland Clinic Neurology',
    email: 'vancem@ccf.org',
    phone: '(555) 456-7890',
    prescribingTier: 'Medium (Tier 2)',
    lastContacted: '2026-05-20',
    targetFrequency: 4,
    completedFrequency: 2,
  },
  {
    id: 'hcp-4',
    name: 'Dr. Elena Rostova',
    specialty: 'Endocrinologist',
    hospital: 'Massachusetts General Hospital',
    email: 'e.rostova@mgh.harvard.edu',
    phone: '(555) 890-5678',
    prescribingTier: 'Medium (Tier 2)',
    lastContacted: '2026-07-08',
    targetFrequency: 4,
    completedFrequency: 3,
  },
  {
    id: 'hcp-5',
    name: 'Dr. James Sterling',
    specialty: 'Rheumatologist',
    hospital: 'Stanford Medicine',
    email: 'jsterling@stanford.edu',
    phone: '(555) 345-6789',
    prescribingTier: 'Low (Tier 3)',
    lastContacted: '2026-04-10',
    targetFrequency: 2,
    completedFrequency: 1,
  }
];

// Historical interactions for list preview
const initialInteractions: Interaction[] = [
  {
    id: 'int-1',
    hcpId: 'hcp-1',
    hcpName: 'Dr. Sarah Chen',
    date: '2026-06-15',
    channel: 'In-Person',
    duration: 25,
    topics: ['Efficacy in Renal Impairment', 'Clinical Trials Phase 3 Results'],
    notes: 'Dr. Chen was highly receptive to the new CardiaMax clinical trial data showing a 15% reduction in cardiovascular events. She asked about dosage adjustments for renal impaired patients. Provided clinical brief. No adverse events reported.',
    samplesProvided: [
      { name: 'CardiaMax 10mg Starter Kit', quantity: 5, valuePerUnit: 45.00 }
    ],
    adverseEventFlag: false,
    medicalInquiryFlag: true,
    medicalInquiryDetails: 'Requested official Medical Information brief on CardiaMax dosing guidelines in geriatric patients with eGFR < 30 mL/min.',
    followUpDate: '2026-07-20',
    followUpTask: 'Deliver geriatric renal dosing medical report directly from Medical Affairs.',
    logMethod: 'Structured Form',
    complianceStatus: 'MIR Routed'
  },
  {
    id: 'int-2',
    hcpId: 'hcp-2',
    hcpName: 'Dr. Aris Thorne',
    date: '2026-07-02',
    channel: 'Virtual',
    duration: 15,
    topics: ['Safety & Tolerability Profile', 'Patient Co-pay Assistance'],
    notes: 'Brief touchpoint via Zoom. Discussed the updated tolerability profile of OncoShield. Discussed the new co-pay card program to alleviate patient out-of-pocket costs. Dr. Thorne noted that cost is the major barrier for his Tier 2 patients.',
    samplesProvided: [
      { name: 'OncoShield Co-pay Voucher', quantity: 20, valuePerUnit: 0.00 }
    ],
    adverseEventFlag: false,
    medicalInquiryFlag: false,
    followUpDate: '2026-07-16',
    followUpTask: 'Send links to the digital co-pay enrollment portal.',
    logMethod: 'Conversational AI',
    complianceStatus: 'Approved'
  }
];

// Draft interaction initial state
interface DraftState {
  hcpId: string;
  date: string;
  channel: InteractionChannel;
  duration: number;
  topics: string[];
  notes: string;
  samplesProvided: { name: string; quantity: number; valuePerUnit: number }[];
  adverseEventFlag: boolean;
  adverseEventDetails: string;
  medicalInquiryFlag: boolean;
  medicalInquiryDetails: string;
  followUpDate: string;
  followUpTask: string;
}

const emptyDraft: DraftState = {
  hcpId: '',
  date: new Date().toISOString().split('T')[0],
  channel: 'In-Person',
  duration: 15,
  topics: [],
  notes: '',
  samplesProvided: [],
  adverseEventFlag: false,
  adverseEventDetails: '',
  medicalInquiryFlag: false,
  medicalInquiryDetails: '',
  followUpDate: '',
  followUpTask: '',
};

// Slices definition
const appSlice = createSlice({
  name: 'app',
  initialState: {
    hcps: initialHcps,
    interactions: initialInteractions,
    draft: emptyDraft,
    activeTab: 'dashboard' as 'dashboard' | 'logger' | 'history' | 'technical',
    loggerMode: 'form' as 'form' | 'chat',
    chatMessages: [
      {
        id: 'msg-init-1',
        sender: 'agent' as const,
        text: "Hi! I am your AI Co-pilot for HCP Interactions. You can dictate or type your contact report in plain natural language. For example:\n\n*\"Met with Dr. Chen at St. Jude yesterday for 20 minutes. We discussed CardioGard efficacy and she requested 5 starter kits. No adverse events.\"*\n\nI will parse this in real-time, populate the compliant CRM record, flag any adverse events, and log it to your Postgres/MySQL database.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ] as ChatMessage[],
    chatIsGenerating: false,
    liveExtractions: {} as Partial<ExtractedEntities>,
  },
  reducers: {
    setTab: (state, action: PayloadAction<'dashboard' | 'logger' | 'history' | 'technical'>) => {
      state.activeTab = action.payload;
    },
    setLoggerMode: (state, action: PayloadAction<'form' | 'chat'>) => {
      state.loggerMode = action.payload;
    },
    updateDraftField: (state, action: PayloadAction<{ field: keyof DraftState; value: any }>) => {
      const { field, value } = action.payload;
      (state.draft as any)[field] = value;
    },
    resetDraft: (state) => {
      state.draft = {
        ...emptyDraft,
        date: new Date().toISOString().split('T')[0]
      };
    },
    setDraftFromExtracted: (state, action: PayloadAction<Partial<ExtractedEntities>>) => {
      const ext = action.payload;
      // Match HCP name to ID
      if (ext.hcpName) {
        const found = state.hcps.find(h => h.name.toLowerCase().includes(ext.hcpName!.toLowerCase()));
        if (found) {
          state.draft.hcpId = found.id;
        }
      }
      
      if (ext.topicsDiscussed) {
        state.draft.topics = ext.topicsDiscussed;
      }
      if (ext.notes) {
        state.draft.notes = ext.notes;
      }
      if (ext.followUpDate) {
        state.draft.followUpDate = ext.followUpDate;
      }
      if (ext.followUpTask) {
        state.draft.followUpTask = ext.followUpTask;
      }
      if (ext.adverseEvent) {
        state.draft.adverseEventFlag = ext.adverseEvent.flagged;
        state.draft.adverseEventDetails = ext.adverseEvent.details || '';
      }
      if (ext.medicalInquiry) {
        state.draft.medicalInquiryFlag = ext.medicalInquiry.flagged;
        state.draft.medicalInquiryDetails = ext.medicalInquiry.details || '';
      }
      if (ext.samplesRequested && ext.samplesRequested.length > 0) {
        state.draft.samplesProvided = ext.samplesRequested.map(s => {
          // Set standard value per unit for mock products
          let value = 15;
          if (s.name.includes('Shield')) value = 65;
          if (s.name.includes('Cardia')) value = 45;
          return {
            name: s.name,
            quantity: s.qty,
            valuePerUnit: value
          };
        });
      }
    },
    addChatMessage: (state, action: PayloadAction<ChatMessage>) => {
      state.chatMessages.push(action.payload);
    },
    setChatGenerating: (state, action: PayloadAction<boolean>) => {
      state.chatIsGenerating = action.payload;
    },
    updateLiveExtractions: (state, action: PayloadAction<Partial<ExtractedEntities>>) => {
      state.liveExtractions = { ...state.liveExtractions, ...action.payload };
    },
    clearLiveExtractions: (state) => {
      state.liveExtractions = {};
    },
    submitDraft: (state, action: PayloadAction<'Structured Form' | 'Conversational AI'>) => {
      const draft = state.draft;
      const hcp = state.hcps.find(h => h.id === draft.hcpId);
      if (!hcp) return;

      let complianceStatus: Interaction['complianceStatus'] = 'Approved';
      if (draft.adverseEventFlag) {
        complianceStatus = 'AE Escalated';
      } else if (draft.medicalInquiryFlag) {
        complianceStatus = 'MIR Routed';
      }

      const newInteraction: Interaction = {
        id: `int-${Date.now()}`,
        hcpId: draft.hcpId,
        hcpName: hcp.name,
        date: draft.date,
        channel: draft.channel,
        duration: Number(draft.duration),
        topics: draft.topics,
        notes: draft.notes,
        samplesProvided: draft.samplesProvided,
        adverseEventFlag: draft.adverseEventFlag,
        adverseEventDetails: draft.adverseEventDetails || undefined,
        medicalInquiryFlag: draft.medicalInquiryFlag,
        medicalInquiryDetails: draft.medicalInquiryDetails || undefined,
        followUpDate: draft.followUpDate || undefined,
        followUpTask: draft.followUpTask || undefined,
        logMethod: action.payload,
        complianceStatus
      };

      state.interactions.unshift(newInteraction);

      // Update HCP last contacted & frequency progress
      const hcpIndex = state.hcps.findIndex(h => h.id === draft.hcpId);
      if (hcpIndex !== -1) {
        state.hcps[hcpIndex].lastContacted = draft.date;
        state.hcps[hcpIndex].completedFrequency += 1;
      }

      // Reset Draft
      state.draft = {
        ...emptyDraft,
        date: new Date().toISOString().split('T')[0]
      };
      state.liveExtractions = {};
    }
  }
});

export const {
  setTab,
  setLoggerMode,
  updateDraftField,
  resetDraft,
  setDraftFromExtracted,
  addChatMessage,
  setChatGenerating,
  updateLiveExtractions,
  clearLiveExtractions,
  submitDraft
} = appSlice.actions;

export const store = configureStore({
  reducer: {
    app: appSlice.reducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
