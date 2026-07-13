/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { store, RootState, setTab, setLoggerMode } from './store';
import StructuredForm from './components/StructuredForm';
import ConversationalLogger from './components/ConversationalLogger';
import HcpDirectory from './components/HcpDirectory';
import TechnicalExplorer from './components/TechnicalExplorer';
import { 
  Users, 
  Calendar, 
  ShieldAlert, 
  BrainCircuit, 
  FileText, 
  Heart, 
  ClipboardList, 
  Plus, 
  CheckCircle, 
  MessageSquare, 
  Settings,
  HelpCircle,
  Sparkles
} from 'lucide-react';

function DashboardStats() {
  const interactions = useSelector((state: RootState) => state.app.interactions);
  const hcps = useSelector((state: RootState) => state.app.hcps);

  // Stats Calculations
  const totalCalls = interactions.length;
  
  const totalSunshineValue = interactions.reduce((sum, int) => {
    const samplesSum = int.samplesProvided.reduce((sSum, item) => sSum + (item.quantity * item.valuePerUnit), 0);
    return sum + samplesSum;
  }, 0);

  const adverseEventsEscalated = interactions.filter(i => i.adverseEventFlag).length;

  const totalCompletedContacts = hcps.reduce((sum, h) => sum + h.completedFrequency, 0);
  const totalTargetContacts = hcps.reduce((sum, h) => sum + h.targetFrequency, 0);
  const contactCompletionRate = Math.round((totalCompletedContacts / totalTargetContacts) * 100);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* KPI 1: TOTAL CONTACTS */}
      <div className="bg-white p-6 border-l-4 border-l-indigo-600 border-y border-r border-slate-200 rounded-r-xl rounded-l-md shadow-xs clinical-hover-card">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xxs font-extrabold text-slate-400 uppercase tracking-widest">Interactions Logged</span>
          <div className="bg-indigo-50 p-2 rounded-lg text-indigo-700">
            <ClipboardList className="w-5 h-5" />
          </div>
        </div>
        <p className="text-3xl font-black text-slate-900 tracking-tight">{totalCalls}</p>
        <span className="text-xxs text-slate-500 font-medium mt-1 block">🔒 Encrypted audit trails preserved</span>
      </div>

      {/* KPI 2: TARGET COMPLETION RATE */}
      <div className="bg-white p-6 border-l-4 border-l-emerald-600 border-y border-r border-slate-200 rounded-r-xl rounded-l-md shadow-xs clinical-hover-card">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xxs font-extrabold text-slate-400 uppercase tracking-widest">Quarterly Contact Quota</span>
          <div className="bg-emerald-50 p-2 rounded-lg text-emerald-700">
            <Users className="w-5 h-5" />
          </div>
        </div>
        <p className="text-3xl font-black text-slate-900 tracking-tight">{contactCompletionRate}%</p>
        <div className="w-full h-1.5 bg-slate-100 rounded-full mt-3 overflow-hidden">
          <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, contactCompletionRate)}%` }} />
        </div>
      </div>

      {/* KPI 3: SUNSHINE ACT VALUE */}
      <div className="bg-white p-6 border-l-4 border-l-amber-500 border-y border-r border-slate-200 rounded-r-xl rounded-l-md shadow-xs clinical-hover-card">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xxs font-extrabold text-slate-400 uppercase tracking-widest">Aggregate Spend Value</span>
          <div className="bg-amber-50 p-2 rounded-lg text-amber-700">
            <FileText className="w-5 h-5" />
          </div>
        </div>
        <p className="text-3xl font-black text-slate-900 tracking-tight">${totalSunshineValue.toFixed(2)}</p>
        <span className="text-xxs text-slate-500 font-medium mt-1 block">National transparency threshold tracked</span>
      </div>

      {/* KPI 4: ADVERSE EVENTS */}
      <div className={`bg-white p-6 border-l-4 border-l-rose-600 border-y border-r border-slate-200 rounded-r-xl rounded-l-md shadow-xs clinical-hover-card ${adverseEventsEscalated > 0 ? 'bg-rose-50/5' : ''}`}>
        <div className="flex items-center justify-between mb-4">
          <span className="text-xxs font-extrabold text-rose-600 uppercase tracking-widest">Safety Escalations</span>
          <div className="bg-rose-50 p-2 rounded-lg text-rose-700 animate-pulse">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>
        <p className="text-3xl font-black text-rose-600 tracking-tight">{adverseEventsEscalated}</p>
        <span className="text-xxs text-rose-600/95 font-bold mt-1 block">🚨 Pharmacovigilance SLA Dispatch</span>
      </div>
    </div>
  );
}

function HistoryPanel() {
  const interactions = useSelector((state: RootState) => state.app.interactions);

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Interaction History & Compliance Log</h3>
          <p className="text-xxs text-slate-500 mt-0.5">Real-time certified sales records and audit trail.</p>
        </div>
        <span className="text-xxs font-mono font-bold text-slate-400 bg-slate-150 px-2 py-0.5 rounded uppercase self-start sm:self-auto">
          Postgres Synced
        </span>
      </div>

      {interactions.length > 0 ? (
        <div className="divide-y divide-slate-100 max-h-[570px] overflow-y-auto">
          {interactions.map((int) => (
            <div key={int.id} className="p-6 hover:bg-slate-50/30 transition duration-150 animate-fadeIn">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <div className="bg-slate-100 text-slate-700 w-8 h-8 rounded-lg font-bold text-xs flex items-center justify-center border border-slate-200 shadow-xxs">
                    {int.channel === 'In-Person' ? '📍' : int.channel === 'Virtual' ? '💻' : int.channel === 'Email' ? '✉️' : '📞'}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-850">{int.hcpName}</h4>
                    <span className="text-xxs text-slate-400 font-bold uppercase tracking-wider block mt-0.5">{int.channel} Call • {int.duration} mins • {int.date}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-xxs font-extrabold px-2.5 py-0.5 rounded-full border ${
                    int.logMethod === 'Conversational AI'
                      ? 'bg-indigo-50 text-indigo-750 border-indigo-150/70 shadow-xxs'
                      : 'bg-slate-100 text-slate-650 border-slate-200'
                  }`}>
                    🤖 {int.logMethod}
                  </span>

                  <span className={`text-xxs font-extrabold px-2.5 py-0.5 rounded-full border ${
                    int.complianceStatus === 'Approved'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-150'
                      : int.complianceStatus === 'AE Escalated'
                      ? 'bg-rose-50 text-rose-800 border-rose-150 animate-pulse'
                      : 'bg-amber-50 text-amber-800 border-amber-150'
                  }`}>
                    {int.complianceStatus}
                  </span>
                </div>
              </div>

              {/* NOTES */}
              <p className="text-xs text-slate-650 leading-relaxed bg-slate-50/70 border border-slate-150/60 rounded-lg p-3.5 font-medium italic">
                "{int.notes}"
              </p>

              {/* PRODUCTS / SAMPLES */}
              {int.samplesProvided.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3 items-center">
                  <span className="text-xxs font-extrabold text-slate-400 uppercase tracking-widest mr-1">Distributed:</span>
                  {int.samplesProvided.map((s, idx) => (
                    <span key={idx} className="bg-indigo-50 text-indigo-850 border border-indigo-150/80 text-xxs px-2.5 py-0.5 rounded-md font-bold shadow-xxs">
                      📦 {s.name} (Qty: {s.quantity})
                    </span>
                  ))}
                </div>
              )}

              {/* ADVERSE EVENT ESCALATION BANNER */}
              {int.adverseEventFlag && (
                <div className="mt-3 bg-rose-50/50 border border-rose-100 rounded-lg p-3 text-xxs text-rose-800 font-semibold shadow-xxs">
                  <strong className="text-rose-700 font-black block uppercase tracking-wider mb-0.5">🚨 Pharmacovigilance Regulatory Dispatch</strong>
                  {int.adverseEventDetails}
                </div>
              )}

              {/* MEDICAL INFORMATION REQUEST ACTION */}
              {int.medicalInquiryFlag && (
                <div className="mt-3 bg-amber-50/50 border border-amber-100 rounded-lg p-3 text-xxs text-amber-800 font-semibold shadow-xxs">
                  <strong className="text-amber-700 font-black block uppercase tracking-wider mb-0.5">✉️ Medical Inquiry Routed to MSL</strong>
                  {int.medicalInquiryDetails}
                </div>
              )}

              {/* FOLLOW UP TASK */}
              {int.followUpTask && (
                <div className="mt-3 text-xxs font-bold text-slate-500 flex items-center gap-1">
                  <span>📅 Scheduled Task ({int.followUpDate}):</span>
                  <span className="text-indigo-650 bg-indigo-50/50 border border-indigo-100/60 px-2 py-0.5 rounded font-bold">"{int.followUpTask}"</span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-slate-400 text-xs font-semibold bg-slate-50/20">
          No interactions logged during this sales cycle.
        </div>
      )}
    </div>
  );
}

function MainAppShell() {
  const dispatch = useDispatch();
  const activeTab = useSelector((state: RootState) => state.app.activeTab);
  const loggerMode = useSelector((state: RootState) => state.app.loggerMode);

  return (
    <div className="min-h-screen bg-slate-50 clinical-grid-bg flex flex-col font-sans">
      {/* GLOBAL TOP NAVIGATION HEADER */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xxs">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-indigo-700 to-indigo-900 p-2.5 rounded-xl text-white shadow-sm shadow-indigo-700/20 border border-indigo-600/10">
            <Heart className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
                BioAgent <span className="text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded text-xs border border-indigo-150/70">Rx Portal</span>
              </h1>
              <span className="inline-flex items-center gap-0.5 rounded-full bg-slate-100 px-2 py-0.5 text-xxs font-bold text-slate-500 ring-1 ring-inset ring-slate-200">
                CRM v1.0
              </span>
            </div>
            <p className="text-xxs text-slate-450 font-medium">FDA-audited, real-time PhRMA compliance portal and AI-dictation logger.</p>
          </div>
        </div>

        {/* TOP LEVEL NAVIGATION TABS */}
        <nav className="flex bg-slate-100/90 p-1 rounded-xl border border-slate-250/60 shadow-xxs">
          <button
            onClick={() => dispatch(setTab('dashboard'))}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 ${
              activeTab === 'dashboard'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/30'
                : 'text-slate-650 hover:text-slate-900 hover:bg-slate-50/50'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => dispatch(setTab('logger'))}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 ${
              activeTab === 'logger'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/30'
                : 'text-slate-650 hover:text-slate-900 hover:bg-slate-50/50'
            }`}
          >
            Log Interaction
          </button>
          <button
            onClick={() => dispatch(setTab('history'))}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 ${
              activeTab === 'history'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/30'
                : 'text-slate-650 hover:text-slate-900 hover:bg-slate-50/50'
            }`}
          >
            HCP Registry
          </button>
          <button
            onClick={() => dispatch(setTab('technical'))}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 ${
              activeTab === 'technical'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/30'
                : 'text-slate-650 hover:text-slate-900 hover:bg-slate-50/50'
            }`}
          >
            Architecture
          </button>
        </nav>
      </header>

      {/* WORKSPACE CONTENT BODY */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 animate-fadeIn">
        {/* TAB: DASHBOARD OVERVIEW */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <DashboardStats />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* PRIMARY VISITS & QUICK LOG */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-white border border-slate-200/80 rounded-xl shadow-xs p-6">
                  <h3 className="text-xxs font-extrabold text-slate-450 uppercase tracking-widest mb-3.5">Field Rep Interactions</h3>
                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        dispatch(setLoggerMode('chat'));
                        dispatch(setTab('logger'));
                      }}
                      className="w-full bg-gradient-to-tr from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white py-3 px-4 rounded-xl text-xs font-bold shadow-sm hover:shadow-md transition flex items-center justify-center gap-2"
                    >
                      <BrainCircuit className="w-4 h-4" />
                      Voice AI Co-pilot
                    </button>
                    <button
                      onClick={() => {
                        dispatch(setLoggerMode('form'));
                        dispatch(setTab('logger'));
                      }}
                      className="w-full bg-white hover:bg-slate-50/80 text-slate-700 border border-slate-200 py-3 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4 text-slate-500" />
                      Structured Log Entry
                    </button>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-850 rounded-xl p-5 text-white shadow-sm relative overflow-hidden">
                  <div className="absolute right-0 top-0 opacity-5 pointer-events-none transform translate-x-2 -translate-y-2">
                    <ShieldAlert className="w-32 h-32 text-indigo-400" />
                  </div>
                  <h4 className="text-xs font-bold text-indigo-200 mb-3 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-indigo-400" />
                    PhRMA Compliance Regulations
                  </h4>
                  <ul className="space-y-2.5 text-xxs text-slate-300 leading-relaxed list-disc list-inside font-medium">
                    <li><strong>Sunshine Act Spend:</strong> All starter sample kits must match fair market transparency logging.</li>
                    <li><strong>Safety Event Flares:</strong> Any Adverse Events (AE) mentioned trigger mandatory 24h reports.</li>
                    <li><strong>Off-Label Restraints:</strong> Reps must gate clinical combination details and forward requests to MSLs.</li>
                  </ul>
                </div>
              </div>

              {/* DYNAMIC AUDIT TRAIL LIST */}
              <div className="lg:col-span-8">
                <HistoryPanel />
              </div>
            </div>
          </div>
        )}

        {/* TAB: LOG INTERACTION WORKSPACE (COMBINED DUAL-PANE WORKSPACE) */}
        {activeTab === 'logger' && (
          <div className="space-y-6">
            {/* WORKSPACE CONTROLLER BANNER */}
            <div className="bg-white border border-slate-200/80 rounded-xl shadow-xxs p-4.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-sm font-bold text-indigo-950 flex items-center gap-2">
                  <Sparkles className="w-4.5 h-4.5 text-indigo-600 animate-pulse" />
                  Dual-Pane AI-First CRM Workspace
                </h2>
                <p className="text-xxs text-slate-500 mt-0.5">
                  Type or choose a dictation script in the <strong className="text-slate-700">Voice Co-pilot (Right)</strong>. Llama3 parses context and populates the <strong className="text-slate-700">Compliance Form (Left)</strong>.
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 text-xxs font-mono font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-150/70">
                <BrainCircuit className="w-3.5 h-3.5" />
                LangGraph Gateway
              </div>
            </div>

            {/* DUAL-PANE WORKSPACE */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {/* LEFT COLUMN: STRUCTURED FORM (READ-ONLY VIEW) */}
              <div className="space-y-6">
                <StructuredForm />
              </div>

              {/* RIGHT COLUMN: AI VOICE CO-PILOT (INTERACTIVE CHAT & EXTRACTIONS) */}
              <div className="space-y-6">
                <ConversationalLogger />
              </div>
            </div>
          </div>
        )}

        {/* TAB: HCP DIRECTORY */}
        {activeTab === 'history' && (
          <HcpDirectory />
        )}

        {/* TAB: TECHNICAL EXPLORER */}
        {activeTab === 'technical' && (
          <TechnicalExplorer />
        )}
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-250/60 mt-12 py-5 px-6 text-center text-slate-400 text-xxs font-semibold flex flex-col sm:flex-row sm:justify-between items-center gap-3">
        <p>© 2026 AI-First Life Sciences CRM Portal. Sunshine Act aggregate spend and pharmacovigilance trails are cryptographic verified.</p>
        <div className="flex gap-4 font-bold text-slate-450">
          <span className="hover:text-indigo-650 transition cursor-pointer">Security Policies</span>
          <span className="hover:text-indigo-650 transition cursor-pointer">FDA Reporting Gateway</span>
          <span className="hover:text-indigo-650 transition cursor-pointer">System Specifications</span>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <MainAppShell />
    </Provider>
  );
}
