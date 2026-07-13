/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, addChatMessage, setChatGenerating, updateLiveExtractions, setDraftFromExtracted, submitDraft, clearLiveExtractions } from '../store';
import { ChatMessage, ExtractedEntities } from '../types';
import { Send, Sparkles, BrainCircuit, CheckSquare, RefreshCw, AlertTriangle, UserCheck, Pill, CalendarCheck, HelpCircle } from 'lucide-react';

const PRESET_DICTATIONS = [
  {
    title: 'Standard Product Detail & Samples',
    short: 'Dr. Sarah Chen — CardiaMax discussion with sample request',
    text: "Met with Dr. Sarah Chen at St. Jude yesterday for 20 minutes. We reviewed the CardiaMax 10mg Phase 3 trial efficacy data. She was impressed by the cardiovascular risk reduction and requested 5 patient starter kits. I scheduled a follow-up visit on 2026-07-28 to bring her updated guidelines.",
    extractions: {
      hcpName: 'Dr. Sarah Chen',
      specialty: 'Cardiologist',
      products: ['CardiaMax 10mg'],
      topicsDiscussed: ['Efficacy Profile', 'Clinical Trials Phase 3 Results'],
      samplesRequested: [{ name: 'CardiaMax 10mg Starter Pack', qty: 5 }],
      adverseEvent: { flagged: false },
      medicalInquiry: { flagged: false },
      followUpTask: 'Deliver updated cardiovascular dosing guidelines.',
      followUpDate: '2026-07-28',
      sentiment: 'Positive'
    } as ExtractedEntities
  },
  {
    title: 'Urgent Adverse Event Compliance Flag',
    short: 'Dr. Elena Rostova — GlucoSet severe side effects',
    text: "Had a quick call with Dr. Elena Rostova. She mentioned a female diabetic patient on GlucoSet 100mg complained of severe muscle cramps and mild renal discomfort. We need to escalate this. No samples provided. Dosing is unchanged.",
    extractions: {
      hcpName: 'Dr. Elena Rostova',
      specialty: 'Endocrinologist',
      products: ['GlucoSet 100mg'],
      topicsDiscussed: ['Safety & Tolerability Profile'],
      samplesRequested: [],
      adverseEvent: {
        flagged: true,
        details: "Female diabetic patient on GlucoSet 100mg complained of severe muscle cramps and mild renal discomfort."
      },
      medicalInquiry: { flagged: false },
      followUpTask: '24h Adverse Event escalation response from pharmacovigilance team.',
      followUpDate: '2026-07-11',
      sentiment: 'Skeptical'
    } as ExtractedEntities
  },
  {
    title: 'Medical Affairs Inquiry (Off-Label)',
    short: 'Dr. Aris Thorne — OncoShield off-label combination query',
    text: "I visited Dr. Aris Thorne at Johns Hopkins. He asked whether OncoShield 50mg can be safely combined off-label with a second-line PD-1 inhibitor for metastatic colorectal patients, as he has a complex case. He wants written clinical case studies from our medical affairs team. Delivered 10 co-pay cards.",
    extractions: {
      hcpName: 'Dr. Aris Thorne',
      specialty: 'Oncologist',
      products: ['OncoShield 50mg'],
      topicsDiscussed: ['Clinical Trials Phase 3 Results', 'Patient Support & Co-pay Programs'],
      samplesRequested: [{ name: 'OncoShield Co-pay Voucher', qty: 10 }],
      adverseEvent: { flagged: false },
      medicalInquiry: {
        flagged: true,
        details: "HCP requested clinical case studies on safety/efficacy of combining OncoShield 50mg off-label with PD-1 inhibitors for colorectal cancer patients."
      },
      followUpTask: 'Route off-label inquiry to Medical Science Liaison (MSL).',
      followUpDate: '2026-07-15',
      sentiment: 'Neutral'
    } as ExtractedEntities
  }
];

export default function ConversationalLogger() {
  const dispatch = useDispatch();
  const messages = useSelector((state: RootState) => state.app.chatMessages);
  const isGenerating = useSelector((state: RootState) => state.app.chatIsGenerating);
  const liveExtractions = useSelector((state: RootState) => state.app.liveExtractions);
  const draft = useSelector((state: RootState) => state.app.draft);
  const hcps = useSelector((state: RootState) => state.app.hcps);

  const [input, setInput] = useState('');
  const [activePresetIndex, setActivePresetIndex] = useState<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const activeHcp = hcps.find(h => h.id === draft.hcpId);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  // Simulate LangGraph Agent extraction flow
  const handleSendMessage = (text: string, presetExt?: ExtractedEntities) => {
    if (!text.trim()) return;

    // Send user message
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    dispatch(addChatMessage(userMsg));
    setInput('');
    dispatch(setChatGenerating(true));

    // Simulate multi-node LangGraph execution with llama-3.3-70b-versatile on Groq
    setTimeout(() => {
      // Step 1: Simulated Entity Extraction Node
      const extractions: ExtractedEntities = {
        ...(presetExt || simulateNlpExtraction(text)),
        notes: text
      };
      dispatch(updateLiveExtractions(extractions));

      // Step 2: Simulated Agent response message based on compliance results
      let responseText = `### LangGraph Node: \`entity_extractor\` -> \`compliance_auditor\`
**Processed successfully with \`llama-3.3-70b-versatile\` on Groq.**

Based on your dictation report, I have successfully extracted the following structured records:
- **HCP Identified**: **${extractions.hcpName || 'Not found (Default to draft Selection)'}** (${extractions.specialty || 'General'})
- **Products Discussed**: ${extractions.products && extractions.products.length > 0 ? extractions.products.map(p => `\`${p}\``).join(', ') : '*None detected*'}
- **Follow-Up Task**: ${extractions.followUpTask ? `_"${extractions.followUpTask}"_` : '*None set*'} ${extractions.followUpDate ? `by **${extractions.followUpDate}**` : ''}
`;

      if (extractions.adverseEvent?.flagged) {
        responseText += `\n\n🚨 **CRITICAL COMPLIANCE NOTICE (24-Hour PhRMA SLA)**: 
An **Adverse Event (AE)** has been flagged regarding *${extractions.products?.[0] || 'the treatment'}*. This has triggered an automatic regulatory report. Under life sciences compliance policies, we have locked the draft for immediate safety validation. Details have been parsed.`;
      } else if (extractions.medicalInquiry?.flagged) {
        responseText += `\n\n⚠️ **COMPLIANCE ALERT**: 
A **Medical Information Request (MIR)** was identified regarding off-label efficacy. I have structured this request and routed it to Medical Affairs. Remember, field representatives are strictly prohibited from answering off-label questions directly.`;
      } else {
        responseText += `\n\n✅ **COMPLIANCE AUDIT PASSED**: No Adverse Events or Off-label compliance alerts were triggered in this transcript. Sunshine Act sample limits have been cross-checked and approved.`;
      }

      responseText += `\n\nClick **"Sync to Draft Form"** below to load these parsed values into the core CRM database model.`;

      const agentMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'agent',
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        extractions
      };

      dispatch(addChatMessage(agentMsg));
      dispatch(setChatGenerating(false));
    }, 1800);
  };

  // Simple rule-based NLP simulator for typing custom entries
  const simulateNlpExtraction = (text: string): ExtractedEntities => {
    const t = text.toLowerCase();
    let hcpName = '';
    let specialty = '';
    let products: string[] = [];
    let topicsDiscussed: string[] = [];
    let samplesRequested: { name: string; qty: number }[] = [];
    let adverseEvent = { flagged: false, details: '' };
    let medicalInquiry = { flagged: false, details: '' };
    let followUpTask = '';
    let followUpDate = '';

    // Match Doctors in state
    if (t.includes('chen')) {
      hcpName = 'Dr. Sarah Chen';
      specialty = 'Cardiologist';
    } else if (t.includes('thorne')) {
      hcpName = 'Dr. Aris Thorne';
      specialty = 'Oncologist';
    } else if (t.includes('rostova')) {
      hcpName = 'Dr. Elena Rostova';
      specialty = 'Endocrinologist';
    } else if (t.includes('vance')) {
      hcpName = 'Dr. Marcus Vance';
      specialty = 'Neurologist';
    } else if (t.includes('sterling')) {
      hcpName = 'Dr. James Sterling';
      specialty = 'Rheumatologist';
    }

    // Match Products
    if (t.includes('cardia') || t.includes('max')) {
      products.push('CardiaMax 10mg');
      topicsDiscussed.push('Efficacy Profile');
      if (t.includes('sample') || t.includes('kit') || t.includes('pack')) {
        samplesRequested.push({ name: 'CardiaMax 10mg Starter Pack', qty: 5 });
      }
    }
    if (t.includes('shield')) {
      products.push('OncoShield 50mg');
      topicsDiscussed.push('Clinical Trials Phase 3 Results');
      if (t.includes('voucher') || t.includes('copay') || t.includes('card')) {
        samplesRequested.push({ name: 'OncoShield Co-pay Voucher', qty: 10 });
      }
    }
    if (t.includes('gluco') || t.includes('set')) {
      products.push('GlucoSet 100mg');
      topicsDiscussed.push('Safety & Tolerability Profile');
    }

    // Adverse Events scan
    if (t.includes('side effect') || t.includes('cramp') || t.includes('pain') || t.includes('adverse') || t.includes('reaction') || t.includes('discomfort') || t.includes('hospitalized')) {
      adverseEvent.flagged = true;
      adverseEvent.details = text;
      topicsDiscussed.push('Safety & Tolerability Profile');
    }

    // Medical Inquiry scan
    if (t.includes('ask') || t.includes('inquiry') || t.includes('off-label') || t.includes('combine') || t.includes('question') || t.includes('why')) {
      medicalInquiry.flagged = true;
      medicalInquiry.details = text;
    }

    // Follow up scan
    if (t.includes('follow up') || t.includes('visit') || t.includes('schedule') || t.includes('next time')) {
      followUpTask = 'Follow-up regarding discussion points.';
      followUpDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 2 weeks out
    }

    return {
      hcpName,
      specialty,
      products,
      topicsDiscussed: topicsDiscussed.length > 0 ? topicsDiscussed : ['Efficacy Profile'],
      samplesRequested,
      adverseEvent,
      medicalInquiry,
      followUpTask: followUpTask || undefined,
      followUpDate: followUpDate || undefined,
      sentiment: adverseEvent.flagged ? 'Skeptical' : 'Positive'
    };
  };

  const applyExtractedToDraft = () => {
    dispatch(setDraftFromExtracted(liveExtractions));
  };

  const handleApplyAndSubmit = () => {
    applyExtractedToDraft();
    // Dispatch submit after small delay to let state catch up
    setTimeout(() => {
      dispatch(submitDraft('Conversational AI'));
      dispatch(addChatMessage({
        id: `msg-submit-${Date.now()}`,
        sender: 'agent',
        text: `📊 **Sync Completed**: I have synchronized the parsed interaction draft with the Database. \n\n* The contact history has been updated.\n* The completed quarterly contact tally for **${liveExtractions.hcpName || 'the HCP'}** has been incremented.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }));
      dispatch(clearLiveExtractions());
    }, 100);
  };

  return (
    <div id="conversational-logger-container" className="flex flex-col gap-6">
      {/* CHAT INTERFACE PANEL */}
      <div className="bg-white border border-slate-250/75 rounded-xl shadow-xs overflow-hidden flex flex-col h-[520px]">
        {/* HEADER */}
        <div className="px-6 py-3.5 bg-slate-50/70 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-indigo-50 text-indigo-755 p-2 rounded-lg border border-indigo-100/60 shadow-xxs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-800 tracking-tight">AI Voice Co-pilot</h2>
              <p className="text-xxs text-slate-450 mt-0.5">Model Engine: <code className="bg-slate-100 border border-slate-200/60 px-1 py-0.5 rounded text-indigo-700 font-mono text-xxs">llama-3.3-70b-versatile @ Groq</code></p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xxs text-emerald-800 font-extrabold bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">Live Agent</span>
          </div>
        </div>

        {/* DICTATION PRESETS */}
        <div className="px-6 py-3 border-b border-slate-150/60 bg-slate-50/30">
          <h3 className="text-xxs font-extrabold text-slate-400 uppercase tracking-widest mb-2">Select Dictation Transcript Scenario</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {PRESET_DICTATIONS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setActivePresetIndex(idx);
                  setInput(preset.text);
                }}
                className={`text-left p-2.5 rounded-lg border text-xs transition-all duration-150 flex flex-col justify-start gap-1 cursor-pointer ${
                  activePresetIndex === idx
                    ? 'bg-indigo-50/50 border-indigo-300 text-indigo-900 shadow-xxs ring-1 ring-indigo-500/25'
                    : 'bg-white border-slate-200/80 text-slate-600 hover:bg-slate-50/60 hover:border-slate-350'
                }`}
              >
                <span className="font-extrabold text-slate-800 text-xxs flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${activePresetIndex === idx ? 'bg-indigo-600 animate-pulse' : 'bg-slate-300'}`}></span>
                  {preset.title.split(' ')[0]} {preset.title.split(' ').slice(1).join(' ')}
                </span>
                <span className="text-slate-450 text-xxs truncate max-w-full italic font-medium">"{preset.short}"</span>
              </button>
            ))}
          </div>
        </div>

        {/* MESSAGES BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/15">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-[85%] ${
                msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
              }`}
            >
              <div
                className={`p-2 rounded-lg shrink-0 flex items-center justify-center w-8 h-8 border shadow-xxs ${
                  msg.sender === 'user' 
                    ? 'bg-indigo-600 border-indigo-700 text-white font-bold text-xxs' 
                    : 'bg-slate-50 border-slate-200 text-indigo-700'
                }`}
              >
                {msg.sender === 'user' ? 'REP' : <BrainCircuit className="w-4 h-4" />}
              </div>
              <div
                className={`p-4 rounded-xl text-xs space-y-2 leading-relaxed shadow-xxs border ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 border-indigo-700 text-white font-medium'
                    : 'bg-white border-slate-200 text-slate-800'
                }`}
              >
                {msg.sender === 'user' ? (
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                ) : (
                  <div className="space-y-2 whitespace-pre-wrap">
                    {msg.text.split('\n\n').map((para, pIdx) => {
                      if (para.startsWith('###')) {
                        return <h4 key={pIdx} className="font-bold text-indigo-755 text-xs border-b border-indigo-50 pb-1 mt-3 flex items-center gap-1.5">{para.replace('###', '').trim()}</h4>;
                      }
                      if (para.startsWith('**Processed') || para.startsWith('✅') || para.startsWith('🚨') || para.startsWith('⚠️')) {
                        return (
                          <div key={pIdx} className={`p-2.5 rounded-lg border text-xxs font-semibold ${
                            para.includes('🚨') ? 'bg-rose-50 border-rose-100 text-rose-800' :
                            para.includes('⚠️') ? 'bg-amber-50 border-amber-100 text-amber-800' :
                            para.includes('✅') ? 'bg-emerald-50 border-emerald-100 text-emerald-800' :
                            'bg-slate-50 border-slate-200 text-slate-700 font-mono font-medium'
                          }`}>
                            {para}
                          </div>
                        );
                      }
                      return <p key={pIdx} className="text-xs">{para}</p>;
                    })}
                  </div>
                )}
                <span className={`block text-xxs mt-1.5 text-right font-semibold ${msg.sender === 'user' ? 'text-indigo-200' : 'text-slate-400'}`}>
                  {msg.timestamp}
                </span>
              </div>
            </div>
          ))}

          {isGenerating && (
            <div className="flex gap-3 max-w-[80%] mr-auto items-center animate-pulse">
              <div className="bg-indigo-50 text-indigo-600 p-2 rounded-lg shrink-0 border border-indigo-100">
                <BrainCircuit className="w-5 h-5 animate-spin" />
              </div>
              <div className="bg-white border border-indigo-150 p-3.5 rounded-xl text-xs text-slate-500 font-bold">
                {"LangGraph routing workflow ➔ Llama3 parsing clinical details..."}
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* INPUT FORM */}
        <div className="p-4 border-t border-slate-150/60 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!input.trim()) return;
              const preset = activePresetIndex !== null ? PRESET_DICTATIONS[activePresetIndex] : null;
              handleSendMessage(input, preset && preset.text === input ? preset.extractions : undefined);
              setActivePresetIndex(null);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Dictate or type interaction details (e.g., 'Visited Dr. Sarah Chen')"
              className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-xs focus:outline-none focus:ring-4 focus:ring-indigo-50 transition"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isGenerating}
            />
            <button
              type="submit"
              disabled={isGenerating || !input.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white font-bold p-2.5 rounded-lg transition shrink-0 flex items-center justify-center shadow-xxs border border-indigo-700 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* LIVE AI EXTRACTION VISUALIZER PANEL */}
      <div className="bg-white border border-slate-250/75 rounded-xl shadow-xs p-6 flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-150/60 pb-3 mb-4">
          <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-indigo-600" />
            Live Entity Extraction Panel
          </h3>
          <span className="text-xxs text-slate-400 font-mono uppercase font-bold tracking-wider">LangGraph Registry</span>
        </div>

        {Object.keys(liveExtractions).length > 0 ? (
          <div className="space-y-4 flex-1 overflow-y-auto">
            {/* DOCTOR EXTR */}
            <div className="border border-slate-150/70 rounded-lg p-3 bg-slate-50/50">
              <span className="text-xxs font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                <UserCheck className="w-3.5 h-3.5 text-indigo-500" /> HCP Profile Identified
              </span>
              {liveExtractions.hcpName ? (
                <div>
                  <span className="text-xs font-bold text-slate-800">{liveExtractions.hcpName}</span>
                  <span className="text-xxs text-indigo-700 font-semibold block mt-0.5">{liveExtractions.specialty || 'Specialty Pending'}</span>
                </div>
              ) : (
                <span className="text-xs text-rose-500 italic font-bold">HCP details not found in database registry.</span>
              )}
            </div>

            {/* PRODUCTS EXTR */}
            <div className="border border-slate-150/70 rounded-lg p-3 bg-slate-50/50">
              <span className="text-xxs font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                <Pill className="w-3.5 h-3.5 text-indigo-500" /> Products Discussed
              </span>
              {liveExtractions.products && liveExtractions.products.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {liveExtractions.products.map(p => (
                    <span key={p} className="bg-indigo-50 border border-indigo-150 text-indigo-850 text-xxs px-2.5 py-0.5 rounded font-bold shadow-xxs">
                      💊 {p}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-slate-400 italic font-medium">No drug products extracted.</span>
              )}
            </div>

            {/* SAMPLES EXTR */}
            <div className="border border-slate-150/70 rounded-lg p-3 bg-slate-50/50">
              <span className="text-xxs font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-indigo-500" /> Samples & Vouchers Allocation
              </span>
              {liveExtractions.samplesRequested && liveExtractions.samplesRequested.length > 0 ? (
                <div className="space-y-1.5">
                  {liveExtractions.samplesRequested.map(s => (
                    <div key={s.name} className="flex justify-between text-xs text-slate-700 font-semibold bg-white p-1.5 border border-slate-150 rounded">
                      <span className="font-medium text-slate-650">{s.name}</span>
                      <span className="font-bold text-slate-900 bg-slate-50 border px-1.5 py-0.5 rounded">Qty: {s.qty}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-slate-400 italic font-medium">No clinical samples requested.</span>
              )}
            </div>

            {/* COMPLIANCE ALERT BOXES */}
            {(liveExtractions.adverseEvent?.flagged || liveExtractions.medicalInquiry?.flagged) && (
              <div className="border border-amber-200 rounded-lg p-3 bg-amber-50/20 space-y-2">
                <span className="text-xxs font-extrabold text-amber-800 uppercase tracking-widest flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> compliance auditor flags
                </span>
                {liveExtractions.adverseEvent?.flagged && (
                  <div className="p-2.5 bg-rose-50 border border-rose-150 rounded text-xxs text-rose-800 font-semibold">
                    <span className="font-black block uppercase text-rose-700 mb-0.5">🚨 ADVERSE EVENT (AE) COMPLIANCE</span>
                    {liveExtractions.adverseEvent.details || 'Adverse response mentioned.'}
                  </div>
                )}
                {liveExtractions.medicalInquiry?.flagged && (
                  <div className="p-2.5 bg-amber-50 border border-amber-150 rounded text-xxs text-amber-800 font-semibold">
                    <span className="font-black block uppercase text-amber-700 mb-0.5">⚠️ MEDICAL INFORMATION REQUEST (MIR)</span>
                    {liveExtractions.medicalInquiry.details || 'Off-label usage details requested.'}
                  </div>
                )}
              </div>
            )}

            {/* NEXT STEPS EXTR */}
            <div className="border border-slate-150/70 rounded-lg p-3 bg-slate-50/50">
              <span className="text-xxs font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                <CalendarCheck className="w-3.5 h-3.5 text-indigo-500" /> Extracted Follow-Up Action
              </span>
              {liveExtractions.followUpTask ? (
                <div className="space-y-1 text-xs text-slate-700">
                  <p className="italic font-medium text-slate-650">"{liveExtractions.followUpTask}"</p>
                  {liveExtractions.followUpDate && (
                    <p className="text-xxs text-indigo-755 font-bold mt-1">Target Date: {liveExtractions.followUpDate}</p>
                  )}
                </div>
              ) : (
                <span className="text-xs text-slate-400 italic font-medium">No follow-up action items parsed.</span>
              )}
            </div>

            {/* ACTION AREA */}
            <div className="pt-4 border-t border-slate-150/60 space-y-2">
              <button
                type="button"
                onClick={applyExtractedToDraft}
                className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold py-2 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                Sync Parsed Draft to Form
              </button>
              <button
                type="button"
                onClick={handleApplyAndSubmit}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 rounded-lg shadow-sm border border-indigo-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <CheckSquare className="w-4 h-4" />
                Approve & Commit to Database
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-450 border border-dashed border-slate-250/60 rounded-xl bg-slate-50/30">
            <BrainCircuit className="w-10 h-10 text-slate-350 mb-3 animate-pulse" />
            <p className="text-xs font-bold text-slate-700">Waiting for Voice Dictation</p>
            <p className="text-xxs text-slate-450 max-w-[220px] mt-1 font-medium">Select a dictation script preset or type notes in the box to initiate AI routing parsing.</p>
          </div>
        )}
      </div>
    </div>
  );
}
