/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, updateDraftField, submitDraft, resetDraft } from '../store';
import { AlertTriangle, Plus, Trash2, CheckCircle2, ShieldAlert, FileText, Calendar } from 'lucide-react';

const STANDARD_SAMPLES = [
  { name: 'CardiaMax 10mg Starter Pack', value: 45.00 },
  { name: 'OncoShield 50mg Sample Vial', value: 120.00 },
  { name: 'NeuroMed 5mg Therapeutic Kit', value: 35.00 },
  { name: 'GlucoSet 100mg Sample Card', value: 15.00 }
];

const GENERAL_TOPICS = [
  'Efficacy Profile',
  'Safety & Tolerability Profile',
  'Clinical Trials Phase 3 Results',
  'Patient Support & Co-pay Programs',
  'Dosage & Administration Guidelines',
  'Competitor Comparison Data'
];

export default function StructuredForm() {
  const dispatch = useDispatch();
  const hcps = useSelector((state: RootState) => state.app.hcps);
  const draft = useSelector((state: RootState) => state.app.draft);
  
  const [sampleSelection, setSampleSelection] = useState('');
  const [sampleQty, setSampleQty] = useState(1);
  const [formSubmitted, setFormSubmitted] = useState(false);

  // Validation errors state
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const activeHcp = hcps.find(h => h.id === draft.hcpId);

  const handleTopicToggle = (topic: string) => {
    let newTopics = [...draft.topics];
    if (newTopics.includes(topic)) {
      newTopics = newTopics.filter(t => t !== topic);
    } else {
      newTopics.push(topic);
    }
    dispatch(updateDraftField({ field: 'topics', value: newTopics }));
  };

  const handleAddSample = () => {
    if (!sampleSelection) return;
    const item = STANDARD_SAMPLES.find(s => s.name === sampleSelection);
    if (!item) return;

    // Check if sample already added
    const existingIndex = draft.samplesProvided.findIndex(s => s.name === sampleSelection);
    let newSamples = [...draft.samplesProvided];

    if (existingIndex !== -1) {
      newSamples[existingIndex] = {
        ...newSamples[existingIndex],
        quantity: newSamples[existingIndex].quantity + sampleQty
      };
    } else {
      newSamples.push({
        name: sampleSelection,
        quantity: sampleQty,
        valuePerUnit: item.value
      });
    }

    dispatch(updateDraftField({ field: 'samplesProvided', value: newSamples }));
    setSampleQty(1);
  };

  const handleRemoveSample = (index: number) => {
    const newSamples = draft.samplesProvided.filter((_, i) => i !== index);
    dispatch(updateDraftField({ field: 'samplesProvided', value: newSamples }));
  };

  // Sunshine Act Total Calculation
  const totalSampleValue = draft.samplesProvided.reduce((sum, item) => sum + (item.quantity * item.valuePerUnit), 0);

  const validateForm = () => {
    const errs: { [key: string]: string } = {};
    if (!draft.hcpId) errs.hcpId = 'Please select a Healthcare Professional (HCP).';
    if (!draft.notes || draft.notes.trim().length < 10) errs.notes = 'Please enter interaction notes (min 10 characters).';
    if (draft.adverseEventFlag && (!draft.adverseEventDetails || draft.adverseEventDetails.trim().length < 15)) {
      errs.adverseEventDetails = 'Under PhRMA compliance guidelines, complete Adverse Event details must be logged.';
    }
    if (draft.medicalInquiryFlag && (!draft.medicalInquiryDetails || draft.medicalInquiryDetails.trim().length < 10)) {
      errs.medicalInquiryDetails = 'Medical Information Requests (MIR) require explicit description before routing to Medical Affairs.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    dispatch(submitDraft('Structured Form'));
    setFormSubmitted(true);
    setTimeout(() => {
      setFormSubmitted(false);
    }, 4000);
  };

  return (
    <div id="structured-form-container" className="bg-white border border-slate-250/75 rounded-xl shadow-xs overflow-hidden">
      <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-150/60 flex items-center justify-between">
        <div>
          <h2 className="text-xs font-bold text-slate-800">Compliance Form Record</h2>
          <p className="text-xxs text-slate-500 mt-0.5">Interaction capture with automated regulatory gates.</p>
        </div>
        <div className="flex items-center gap-2">
          {totalSampleValue > 0 && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1 text-xxs font-extrabold text-amber-800 ring-1 ring-inset ring-amber-600/20 shadow-xxs">
              Sunshine spend: ${totalSampleValue.toFixed(2)}
            </span>
          )}
          <span className="inline-flex items-center rounded-lg bg-indigo-50 px-2.5 py-1 text-xxs font-extrabold text-indigo-800 ring-1 ring-indigo-600/20 shadow-xxs">
            Co-pilot Mode
          </span>
        </div>
      </div>

      {formSubmitted && (
        <div className="p-4 bg-emerald-50 border-b border-emerald-150 flex items-center gap-3 text-emerald-800 text-xs font-bold animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 animate-bounce" />
          <div>
            <p className="font-extrabold">Interaction Successfully Saved</p>
            <p className="text-xxs text-emerald-600 font-medium">The record has been updated and structured into the Postgres relational schema. Compliance rules cleared.</p>
          </div>
        </div>
      )}

      {/* READ ONLY INSTRUCTION BANNER */}
      <div className="px-6 pt-6">
        <div className="bg-indigo-50/50 border border-indigo-150 p-4 text-xs text-indigo-900 rounded-xl flex items-start gap-3 shadow-xxs">
          <span className="text-lg select-none">🔒</span>
          <div>
            <p className="font-bold text-indigo-950">Read-Only View Enabled</p>
            <p className="text-slate-650 text-xxs mt-0.5 leading-relaxed font-medium">To update these fields, please dictate or type your interaction report into the <strong>AI Voice Co-pilot</strong> on the right. Our AI models will parse your report, perform real-time compliance audits, and automatically map the values here.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* HCP SELECTOR */}
        <div>
          <label className="block text-xxs font-extrabold text-slate-500 uppercase tracking-widest mb-1.5" id="lbl-hcp-select">
            Healthcare Professional (HCP) <span className="text-rose-500">*</span>
          </label>
          <select
            id="hcp-selector"
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-700 focus:outline-none cursor-not-allowed opacity-85 shadow-xxs font-medium"
            value={draft.hcpId}
            disabled={true}
            onChange={(e) => {
              dispatch(updateDraftField({ field: 'hcpId', value: e.target.value }));
              if (errors.hcpId) setErrors({ ...errors, hcpId: '' });
            }}
          >
            <option value="">-- Select HCP Profile --</option>
            {hcps.map(h => (
              <option key={h.id} value={h.id}>
                {h.name} ({h.specialty}) — {h.hospital} [{h.prescribingTier}]
              </option>
            ))}
          </select>
          {errors.hcpId && <p className="text-rose-500 text-xxs mt-1 font-bold">{errors.hcpId}</p>}

          {activeHcp && (
            <div className="mt-2.5 bg-slate-50/50 border border-slate-150/70 rounded-lg p-3 grid grid-cols-2 gap-4 text-xxs font-medium">
              <div>
                <span className="text-slate-400 block font-bold uppercase tracking-wider mb-0.5">Email / Phone:</span>
                <span className="text-slate-750 font-bold">{activeHcp.email} | {activeHcp.phone}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-bold uppercase tracking-wider mb-0.5">Quarterly Target:</span>
                <span className="text-slate-750 font-bold">
                  {activeHcp.completedFrequency} / {activeHcp.targetFrequency} contacts ({Math.round((activeHcp.completedFrequency / activeHcp.targetFrequency) * 100)}% to Goal)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* METADATA row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xxs font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">Date of Contact <span className="text-rose-500">*</span></label>
            <input
              type="date"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-700 focus:outline-none cursor-not-allowed opacity-85 shadow-xxs font-medium"
              value={draft.date}
              disabled={true}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => dispatch(updateDraftField({ field: 'date', value: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-xxs font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">Channel <span className="text-rose-500">*</span></label>
            <select
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-700 focus:outline-none cursor-not-allowed opacity-85 shadow-xxs font-medium"
              value={draft.channel}
              disabled={true}
              onChange={(e) => dispatch(updateDraftField({ field: 'channel', value: e.target.value }))}
            >
              <option value="In-Person">In-Person Call</option>
              <option value="Virtual">Virtual Detailing (Zoom/Teams)</option>
              <option value="Email">Email Communication</option>
              <option value="Phone">Phone Call</option>
            </select>
          </div>
          <div>
            <label className="block text-xxs font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">Duration <span className="text-xxs text-slate-400 font-semibold">(Minutes)</span></label>
            <input
              type="number"
              min="1"
              max="180"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-700 focus:outline-none cursor-not-allowed opacity-85 shadow-xxs font-medium text-center"
              value={draft.duration}
              disabled={true}
              onChange={(e) => dispatch(updateDraftField({ field: 'duration', value: Number(e.target.value) }))}
            />
          </div>
        </div>

        {/* DISCUSSION TOPICS (Multi-select pill box) */}
        <div>
          <label className="block text-xxs font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">Medical topics discussed</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {GENERAL_TOPICS.map((topic) => {
              const selected = draft.topics.includes(topic);
              return (
                <button
                  type="button"
                  key={topic}
                  onClick={() => handleTopicToggle(topic)}
                  disabled={true}
                  className={`px-3.5 py-1.5 rounded-full text-xxs font-bold border transition cursor-not-allowed opacity-80 ${
                    selected
                      ? 'bg-indigo-50 border-indigo-250 text-indigo-700 shadow-xxs'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                >
                  {topic}
                </button>
              );
            })}
          </div>
        </div>

        {/* INTERACTION NOTES */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-xxs font-extrabold text-slate-500 uppercase tracking-widest">Detailed Contact Notes <span className="text-rose-500">*</span></label>
            <span className="text-xxs text-slate-400 font-bold font-mono">{draft.notes.length} chars</span>
          </div>
          <textarea
            rows={4}
            placeholder="No notes transcribed yet. Please record notes in the AI Voice Co-pilot."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-705 focus:outline-none cursor-not-allowed opacity-85 shadow-xxs font-medium"
            value={draft.notes}
            disabled={true}
            onChange={(e) => {
              dispatch(updateDraftField({ field: 'notes', value: e.target.value }));
              if (errors.notes) setErrors({ ...errors, notes: '' });
            }}
          />
          {errors.notes && <p className="text-rose-500 text-xxs mt-1 font-bold">{errors.notes}</p>}
        </div>

        {/* DRUG SAMPLES DISTRIBUTED (SUNSHINE ACT REGULATION INCLUDED) */}
        <div className="bg-slate-50/50 border border-slate-150/70 rounded-xl p-4 shadow-xxs">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="text-xxs font-extrabold text-slate-450 uppercase tracking-widest flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-slate-400" />
                Drug Samples & Voucher Allotment
              </h3>
              <p className="text-xxs text-slate-500 mt-0.5">Subject to PhRMA Sunshine Act limits. Practitioner signature must be obtained.</p>
            </div>
            {totalSampleValue > 150 && (
              <span className="text-xxs text-amber-800 bg-amber-50 border border-amber-150 px-2 py-0.5 rounded-md font-bold animate-pulse flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                Sunshine Warning
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mb-4">
            <select
              value={sampleSelection}
              disabled={true}
              onChange={(e) => setSampleSelection(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xxs focus:outline-none text-slate-400 cursor-not-allowed opacity-80"
            >
              <option value="">-- Choose Sample Drug Product --</option>
              {STANDARD_SAMPLES.map(s => (
                <option key={s.name} value={s.name}>{s.name} (${s.value}/unit)</option>
              ))}
            </select>
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2">
              <span className="text-xxs text-slate-400 select-none font-bold">Qty:</span>
              <input
                type="number"
                min="1"
                max="50"
                className="w-10 py-1.5 text-xxs font-semibold focus:outline-none text-center bg-transparent text-slate-400 cursor-not-allowed opacity-80"
                value={sampleQty}
                disabled={true}
                onChange={(e) => setSampleQty(Math.max(1, Number(e.target.value)))}
              />
            </div>
            <button
              type="button"
              disabled={true}
              className="bg-slate-200 text-slate-400 rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1 cursor-not-allowed opacity-80"
            >
              <Plus className="w-3.5 h-3.5" />
              Add
            </button>
          </div>

          {draft.samplesProvided.length > 0 ? (
            <div className="border border-slate-200/80 rounded-lg overflow-hidden bg-white shadow-xxs">
              <table className="w-full text-xxs text-left">
                <thead className="bg-slate-50/50 text-slate-500 uppercase text-xxs tracking-widest border-b border-slate-100">
                  <tr>
                    <th className="px-3 py-2 font-extrabold">Sample Description</th>
                    <th className="px-3 py-2 font-extrabold text-center">Qty</th>
                    <th className="px-3 py-2 font-extrabold text-right">Value</th>
                    <th className="px-3 py-2 font-extrabold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-650">
                  {draft.samplesProvided.map((sample, index) => (
                    <tr key={index} className="hover:bg-slate-50/50">
                      <td className="px-3 py-2 font-bold text-slate-800">{sample.name}</td>
                      <td className="px-3 py-2 text-center font-extrabold text-slate-700">{sample.quantity}</td>
                      <td className="px-3 py-2 text-right text-slate-700 font-bold">${(sample.quantity * sample.valuePerUnit).toFixed(2)}</td>
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          disabled={true}
                          className="text-slate-300 cursor-not-allowed p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center p-4 text-slate-400 text-xxs font-bold border border-dashed border-slate-250/60 rounded-lg bg-white">
              No drug samples allocated to this interaction record.
            </div>
          )}
        </div>

        {/* REGULATORY COMPLIANCE FLAGS (AE REPORTING & MEDICAL INQUIRY) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* ADVERSE EVENT BLOCK */}
          <div className={`border rounded-xl p-4 transition-colors shadow-xxs ${draft.adverseEventFlag ? 'bg-rose-50/20 border-rose-200' : 'bg-slate-50/40 border-slate-200'}`}>
            <div className="flex items-start gap-2.5">
              <input
                type="checkbox"
                id="ae-flag"
                className="mt-1 h-4.5 w-4.5 text-rose-600 border-slate-350 rounded cursor-not-allowed opacity-80 shadow-xxs"
                checked={draft.adverseEventFlag}
                disabled={true}
              />
              <div className="flex-1">
                <label htmlFor="ae-flag" className="block text-xs font-black text-slate-800 flex items-center gap-1.5 cursor-not-allowed opacity-85">
                  <ShieldAlert className="w-4 h-4 text-rose-600 animate-pulse" />
                  Adverse Event Reported?
                </label>
                <p className="text-xxs text-slate-450 mt-0.5 font-medium">Safety event regarding client side-effects, tolerability, or toxicity reactions.</p>
              </div>
            </div>

            {draft.adverseEventFlag && (
              <div className="mt-3.5 space-y-2 animate-slideDown">
                <div className="bg-rose-100 border border-rose-150 text-rose-800 text-xxs font-extrabold p-2.5 rounded-lg flex items-center gap-1.5 shadow-xxs">
                  <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
                  MANDATORY 24-HOUR PHRMA SAFETY DISPATCH TRIGGERED
                </div>
                <textarea
                  rows={2}
                  placeholder="Enter patient demographics, specific dosage, and clinical side-effect severity. HIPAA compliant."
                  className="w-full bg-white border border-rose-200 rounded-lg p-2.5 text-xxs text-slate-705 focus:outline-none cursor-not-allowed opacity-85 shadow-xxs font-medium"
                  value={draft.adverseEventDetails}
                  disabled={true}
                />
                {errors.adverseEventDetails && <p className="text-rose-500 text-xxs font-bold">{errors.adverseEventDetails}</p>}
              </div>
            )}
          </div>

          {/* MEDICAL INFORMATION REQUEST BLOCK */}
          <div className={`border rounded-xl p-4 transition-colors shadow-xxs ${draft.medicalInquiryFlag ? 'bg-amber-50/20 border-amber-200' : 'bg-slate-50/40 border-slate-200'}`}>
            <div className="flex items-start gap-2.5">
              <input
                type="checkbox"
                id="mir-flag"
                className="mt-1 h-4.5 w-4.5 text-amber-600 border-slate-350 rounded cursor-not-allowed opacity-80 shadow-xxs"
                checked={draft.medicalInquiryFlag}
                disabled={true}
              />
              <div className="flex-1">
                <label htmlFor="mir-flag" className="block text-xs font-black text-slate-800 flex items-center gap-1.5 cursor-not-allowed opacity-85">
                  <FileText className="w-4 h-4 text-amber-600" />
                  Medical Info Request?
                </label>
                <p className="text-xxs text-slate-450 mt-0.5 font-medium">Off-label scientific combo questions, clinical papers, or trial requests.</p>
              </div>
            </div>

            {draft.medicalInquiryFlag && (
              <div className="mt-3.5 space-y-2 animate-slideDown">
                <div className="bg-amber-100 border border-amber-150 text-amber-805 text-xxs font-extrabold p-2.5 rounded-lg shadow-xxs">
                  ROUTING SYSTEM: Dispatch request to Medical Science Liaison (MSL)
                </div>
                <textarea
                  rows={2}
                  placeholder="Precisely specify the clinical question or data requested by the practitioner."
                  className="w-full bg-white border border-amber-200 rounded-lg p-2.5 text-xxs text-slate-705 focus:outline-none cursor-not-allowed opacity-85 shadow-xxs font-medium"
                  value={draft.medicalInquiryDetails}
                  disabled={true}
                />
                {errors.medicalInquiryDetails && <p className="text-rose-500 text-xxs font-bold">{errors.medicalInquiryDetails}</p>}
              </div>
            )}
          </div>
        </div>

        {/* COMPLIANT ACTIONS & NEXT STEPS */}
        <div className="border border-slate-200/80 rounded-xl p-4 bg-slate-50/50 shadow-xxs">
          <h3 className="text-xxs font-extrabold text-slate-450 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-slate-400" />
            Next Scheduled Action Items
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xxs font-extrabold text-slate-400 uppercase tracking-widest mb-1">Follow-Up Date</label>
              <input
                type="date"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xxs text-slate-700 focus:outline-none cursor-not-allowed opacity-85 font-medium shadow-xxs"
                value={draft.followUpDate}
                disabled={true}
              />
            </div>
            <div>
              <label className="block text-xxs font-extrabold text-slate-400 uppercase tracking-widest mb-1">Task Description</label>
              <input
                type="text"
                placeholder="No follow-up scheduled yet."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xxs text-slate-700 focus:outline-none cursor-not-allowed opacity-85 font-medium shadow-xxs"
                value={draft.followUpTask}
                disabled={true}
              />
            </div>
          </div>
        </div>

        {/* SUBMISSION BUTTONS */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-150/60">
          <button
            type="button"
            onClick={() => {
              dispatch(resetDraft());
              setErrors({});
            }}
            className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-50/50 transition cursor-pointer"
          >
            Clear Draft
          </button>
          <button
            type="submit"
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm border border-indigo-700 transition cursor-pointer"
          >
            Sync to database
          </button>
        </div>
      </form>
    </div>
  );
}
