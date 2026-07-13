/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, updateDraftField, setTab } from '../store';
import { Search, UserPlus, Phone, Mail, Award, CheckCircle, ArrowRight, Hospital } from 'lucide-react';

export default function HcpDirectory() {
  const dispatch = useDispatch();
  const hcps = useSelector((state: RootState) => state.app.hcps);

  const [search, setSearch] = useState('');
  const [filterSpecialty, setFilterSpecialty] = useState('');
  const [filterTier, setFilterTier] = useState('');

  // Extract unique specialties for filtering
  const specialties = Array.from(new Set(hcps.map(h => h.specialty)));

  const filteredHcps = hcps.filter(h => {
    const matchesSearch = h.name.toLowerCase().includes(search.toLowerCase()) || 
                          h.hospital.toLowerCase().includes(search.toLowerCase());
    const matchesSpecialty = filterSpecialty ? h.specialty === filterSpecialty : true;
    const matchesTier = filterTier ? h.prescribingTier.includes(filterTier) : true;
    return matchesSearch && matchesSpecialty && matchesTier;
  });

  const handleQuickLog = (hcpId: string) => {
    dispatch(updateDraftField({ field: 'hcpId', value: hcpId }));
    dispatch(setTab('logger'));
  };

  return (
    <div id="hcp-directory-container" className="space-y-6">
      {/* SEARCH AND FILTERS ROW */}
      <div className="bg-white border border-slate-250/75 rounded-xl shadow-xs p-4 flex flex-col md:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search doctors, clinical teams, or medical institutions..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:ring-4 focus:ring-indigo-50 transition font-medium"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 w-full md:w-auto shrink-0">
          <select
            value={filterSpecialty}
            onChange={(e) => setFilterSpecialty(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-650 focus:outline-none font-bold"
          >
            <option value="">All Specialties</option>
            {specialties.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            value={filterTier}
            onChange={(e) => setFilterTier(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-650 focus:outline-none font-bold"
          >
            <option value="">All Tiers</option>
            <option value="Tier 1">High (Tier 1)</option>
            <option value="Tier 2">Medium (Tier 2)</option>
            <option value="Tier 3">Low (Tier 3)</option>
          </select>
        </div>
      </div>

      {/* DOCTORS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredHcps.length > 0 ? (
          filteredHcps.map((hcp) => {
            const completionRate = Math.min(1, hcp.completedFrequency / hcp.targetFrequency);
            const isCompleted = hcp.completedFrequency >= hcp.targetFrequency;

            return (
              <div key={hcp.id} className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs transition duration-200 clinical-hover-card flex flex-col justify-between">
                <div className="p-6">
                  {/* TITLE ROW */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className={`inline-flex items-center gap-1 text-xxs font-extrabold px-2.5 py-0.5 rounded-full border ${
                        hcp.prescribingTier.includes('Tier 1')
                          ? 'bg-rose-50 border-rose-150 text-rose-800 shadow-xxs'
                          : hcp.prescribingTier.includes('Tier 2')
                          ? 'bg-amber-50 border-amber-150 text-amber-800 shadow-xxs'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}>
                        <Award className="w-3.5 h-3.5" />
                        {hcp.prescribingTier}
                      </span>
                      <h3 className="text-sm font-bold text-slate-800 mt-2">{hcp.name}</h3>
                      <p className="text-xxs font-extrabold text-indigo-700 uppercase tracking-widest mt-0.5">{hcp.specialty}</p>
                    </div>
                    {isCompleted && (
                      <span className="text-emerald-800 bg-emerald-50 border border-emerald-150 p-1 px-2.5 rounded-full text-xxs font-extrabold flex items-center gap-0.5 shadow-xxs">
                        <CheckCircle className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                        Target Met
                      </span>
                    )}
                  </div>

                  {/* INFO ROW */}
                  <div className="space-y-2.5 text-xs text-slate-600 mb-6 font-medium">
                    <div className="flex items-center gap-2">
                      <Hospital className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="truncate text-slate-700">{hcp.hospital}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="truncate text-slate-750 font-semibold">{hcp.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="text-slate-700 font-semibold">{hcp.phone}</span>
                    </div>
                  </div>

                  {/* GOAL COMPLETION METER */}
                  <div className="space-y-1.5 border-t border-slate-100 pt-4">
                    <div className="flex justify-between items-center text-xxs">
                      <span className="font-extrabold text-slate-450 uppercase tracking-widest">Quarterly Frequency Progress</span>
                      <span className="font-extrabold text-slate-805">{hcp.completedFrequency} / {hcp.targetFrequency} contacts</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-emerald-500' : 'bg-indigo-600'}`} 
                        style={{ width: `${completionRate * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* BOTTOM BUTTON */}
                <div className="bg-slate-50/50 border-t border-slate-150/60 px-6 py-3 flex items-center justify-between">
                  <span className="text-xxs text-slate-400 font-extrabold">Last Contact: {hcp.lastContacted}</span>
                  <button
                    onClick={() => handleQuickLog(hcp.id)}
                    className="text-xxs font-extrabold text-indigo-700 hover:text-indigo-900 hover:translate-x-0.5 transition flex items-center gap-1 cursor-pointer"
                  >
                    Quick Log Call
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-16 text-center text-slate-450 font-bold bg-white border border-slate-200/80 rounded-xl shadow-xs">
            No Healthcare Professionals found matching the filter criteria.
          </div>
        )}
      </div>
    </div>
  );
}
