/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Code2, GitFork, Database, Terminal, CheckCircle, ChevronRight, HelpCircle, Layers } from 'lucide-react';

const LANGGRAPH_NODES = {
  input_parser: {
    title: 'Input Parser & Channel Router',
    role: 'Analyzes raw text or audio transcripts to understand rep channel intent (In-Person vs Virtual) and identify the recipient HCP.',
    code: `from typing import Dict, Any
from langgraph.graph import StateGraph, END
from pydantic import BaseModel, Field

class AgentState(BaseModel):
    raw_transcript: str
    hcp_id: str = ""
    extracted_entities: Dict[str, Any] = {}
    compliance_alerts: Dict[str, Any] = {}
    db_status: str = "pending"

def parse_input_node(state: AgentState) -> Dict[str, Any]:
    """
    State Node: Parse raw transcription notes.
    Uses Groq llama-3.3-70b-versatile model to extract structural metadata.
    """
    prompt = f"Analyze this healthcare interaction and identify channel and doctor: {state.raw_transcript}"
    # Invoke Groq model
    response = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"}
    )
    return {"extracted_entities": response.json()}
`
  },
  entity_extractor: {
    title: 'Entity Extractor (llama-3.3-70b-versatile)',
    role: 'Extracts critical clinical terms, molecules, topics discussed, sample quantities, and next-action deadlines.',
    code: `class ExtractedDetails(BaseModel):
    hcp_name: str = Field(description="Name of the doctor")
    specialty: str = Field(description="Medical specialty")
    molecules: list[str] = Field(description="Drug products mentioned")
    samples_allocated: list[Dict[str, int]] = Field(description="Sample quantity allocated")
    follow_up_date: str = Field(description="Target date in YYYY-MM-DD")
    follow_up_task: str = Field(description="Next steps task")

def entity_extractor_node(state: AgentState) -> Dict[str, Any]:
    """
    Structured Tool-calling Node.
    Parses complex medical discussions using JSON Schema.
    """
    response = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "system", "content": "Extract clinical interaction details."},
                  {"role": "user", "content": state.raw_transcript}],
        response_model=ExtractedDetails # Pydantic parser
    )
    # Merge newly extracted terms into state dictionary
    return {"extracted_entities": response.dict()}
`
  },
  compliance_check: {
    title: 'Compliance Auditor Node (llama-3.3-70b)',
    role: 'Scans notes for Adverse Events (mandatory FDA 24h escalation) and Medical Information Requests (MIR - off-label gating).',
    code: `def compliance_check_node(state: AgentState) -> Dict[str, Any]:
    """
    Scans the transcribed interaction report specifically for PhRMA,
    Sunshine Act compliance infractions, Adverse Events (AE), and MIR queries.
    Utilizes llama-3.3-70b-versatile for high-context safety evaluations.
    """
    entities = state.extracted_entities
    transcript = state.raw_transcript
    
    # Check for Adverse Events
    ae_check_prompt = f"Does this report contain details of medical side effects? Notes: {transcript}"
    ae_flag = groq_client.check_boolean(model="llama-3.3-70b-versatile", prompt=ae_check_prompt)
    
    # Check for off-label medical inquiries
    mir_check_prompt = f"Does the doctor request unapproved/off-label usage info? Notes: {transcript}"
    mir_flag = groq_client.check_boolean(model="llama-3.3-70b-versatile", prompt=mir_check_prompt)
    
    alerts = {
        "adverse_event_detected": ae_flag,
        "medical_inquiry_flagged": mir_flag,
        "escalation_route": "Pharmacovigilance" if ae_flag else ("Medical Affairs" if mir_flag else "None")
    }
    return {"compliance_alerts": alerts}
`
  },
  db_insert: {
    title: 'Relational DB Persister Node',
    role: 'Writes structured schemas, calculates final sample values for the Sunshine Act, and registers the transaction.',
    code: `from sqlalchemy import create_engine
from database import InteractionModel

def db_insert_node(state: AgentState) -> Dict[str, Any]:
    """
    Commit fully compliant interaction schema to PostgresSQL or MySQL.
    Calculates final valuation aggregate for Sunshine Act transparency logging.
    """
    db_record = InteractionModel(
        hcp_id=state.extracted_entities.get("hcp_id"),
        channel=state.extracted_entities.get("channel", "In-Person"),
        notes=state.raw_transcript,
        ae_flag=state.compliance_alerts.get("adverse_event_detected", False),
        mir_flag=state.compliance_alerts.get("medical_inquiry_flagged", False),
        total_sunshine_value=calculate_sunshine_value(state.extracted_entities.get("samples_allocated"))
    )
    session.add(db_record)
    session.commit()
    return {"db_status": "synced_and_committed"}
`
  }
};

const FASTAPI_ROUTER_CODE = `from fastapi import FastAPI, Depends, HTTPException, status
from pydantic import BaseModel
from langgraph.graph import StateGraph
from database import get_db, Session
from auth import verify_rep_token
from agent_graph import compile_workflow

app = FastAPI(title="AI-First Life Sciences CRM API", version="1.0.0")

class InteractionLogRequest(BaseModel):
    raw_transcript: str
    hcp_id: str

@app.post("/api/interactions/conversational-log", status_code=status.HTTP_201_CREATED)
async def log_conversational_interaction(
    payload: InteractionLogRequest,
    current_rep: dict = Depends(verify_rep_token),
    db: Session = Depends(get_db)
):
    """
    API endpoint that accepts voice transcript dictations from pharmaceutical reps,
    runs them through the compiled LangGraph orchestration network, and persists
    the regulatory-approved records.
    """
    try:
        # Initialize LangGraph Agentic Workflow State
        workflow = compile_workflow()
        initial_state = {
            "raw_transcript": payload.raw_transcript,
            "hcp_id": payload.hcp_id,
            "extracted_entities": {},
            "compliance_alerts": {}
        }
        
        # Execute the Graph Nodes synchronously 
        result_state = workflow.invoke(initial_state)
        
        return {
            "status": "Success",
            "message": "Interaction logged and audited successfully",
            "compliance_alerts": result_state["compliance_alerts"],
            "extracted_entities": result_state["extracted_entities"],
            "db_commit": result_state["db_status"]
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"LangGraph Agent failure: {str(e)}"
        )
`;

const SQL_SCHEMA_CODE = `-- 1. HEALTHCARE PROFESSIONAL (HCP) REGISTRY
CREATE TABLE hcp_profiles (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    specialty VARCHAR(100) NOT NULL,
    hospital VARCHAR(150) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(30),
    prescribing_tier VARCHAR(20) DEFAULT 'Low (Tier 3)', -- Tier 1/2/3
    target_frequency INT DEFAULT 4, -- Planned quarterly target contacts
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. INTERACTIONS LOG (CORE CRM)
CREATE TABLE hcp_interactions (
    id VARCHAR(50) PRIMARY KEY,
    hcp_id VARCHAR(50) REFERENCES hcp_profiles(id) ON DELETE CASCADE,
    contact_date DATE NOT NULL,
    channel VARCHAR(30) NOT NULL, -- In-Person, Virtual, Email, Phone
    duration_minutes INT NOT NULL,
    raw_notes TEXT NOT NULL,
    log_method VARCHAR(30) DEFAULT 'Structured Form', -- Form vs Conversational
    adverse_event_flag BOOLEAN DEFAULT FALSE,
    adverse_event_details TEXT,
    medical_inquiry_flag BOOLEAN DEFAULT FALSE,
    medical_inquiry_details TEXT,
    sunshine_act_value DECIMAL(10, 2) DEFAULT 0.00, -- Dollar value of samples/beverages
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. MEDICAL DRUG SAMPLES DISTRIBUTED (SUNSHINE ACT AUDITING)
CREATE TABLE interaction_samples (
    id SERIAL PRIMARY KEY,
    interaction_id VARCHAR(50) REFERENCES hcp_interactions(id) ON DELETE CASCADE,
    sample_name VARCHAR(100) NOT NULL,
    quantity INT NOT NULL,
    value_per_unit DECIMAL(10, 2) NOT NULL,
    practitioner_signature_verified BOOLEAN DEFAULT TRUE
);
`;

export default function TechnicalExplorer() {
  const reduxState = useSelector((state: RootState) => state);
  const [activeCodeTab, setActiveCodeTab] = useState<'langgraph' | 'fastapi' | 'postgres' | 'redux'>('langgraph');
  const [selectedGraphNode, setSelectedGraphNode] = useState<keyof typeof LANGGRAPH_NODES>('input_parser');

  return (
    <div id="technical-explorer-container" className="space-y-6">
      {/* EXPLANATORY HEADER CARD */}
      <div className="bg-slate-900 border border-slate-800 text-white p-6 rounded-xl shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-5 pointer-events-none transform translate-x-4 -translate-y-4">
          <Terminal className="w-48 h-48 text-indigo-400" />
        </div>
        <div className="flex items-center gap-3 mb-2">
          <Terminal className="w-5.5 h-5.5 text-indigo-400" />
          <h2 className="text-sm font-bold tracking-tight uppercase">Technical Architecture Gateway</h2>
        </div>
        <p className="text-xxs text-slate-350 max-w-3xl leading-relaxed font-medium">
          Underneath the BioAgent portal is a secure clinical pipeline. We leverage <strong>LangGraph state workflows</strong> for agent routing, <strong>FastAPI</strong> for an API gateway, and <strong>PostgreSQL</strong> relational storage to maintain strict safety and compliance records.
        </p>
      </div>

      {/* CORE NAVIGATION */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200/80 pb-3">
        <button
          onClick={() => setActiveCodeTab('langgraph')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition duration-150 cursor-pointer ${
            activeCodeTab === 'langgraph'
              ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
              : 'bg-white border-slate-205 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <GitFork className="w-4 h-4" />
          LangGraph Workflow
        </button>
        <button
          onClick={() => setActiveCodeTab('fastapi')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition duration-150 cursor-pointer ${
            activeCodeTab === 'fastapi'
              ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
              : 'bg-white border-slate-205 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Code2 className="w-4 h-4" />
          FastAPI Server
        </button>
        <button
          onClick={() => setActiveCodeTab('postgres')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition duration-150 cursor-pointer ${
            activeCodeTab === 'postgres'
              ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
              : 'bg-white border-slate-205 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Database className="w-4 h-4" />
          PostgreSQL Schemas
        </button>
        <button
          onClick={() => setActiveCodeTab('redux')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition duration-150 cursor-pointer ${
            activeCodeTab === 'redux'
              ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
              : 'bg-white border-slate-205 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Layers className="w-4 h-4" />
          Redux Store State
        </button>
      </div>

      {/* TAB CONTENT PANEL */}
      <div className="bg-white border border-slate-250/75 rounded-xl overflow-hidden shadow-xs min-h-[500px]">
        {/* TAB 1: LANGGRAPH WORKFLOW VISUALIZER */}
        {activeCodeTab === 'langgraph' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
            {/* GRAPH VIEW */}
            <div className="lg:col-span-5 p-6 bg-slate-50/50 flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <h3 className="text-xxs font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Interactive State Graph</h3>
                  <p className="text-xxs text-slate-500 font-semibold leading-relaxed">Click any graph node block to load its associated Python source code and execution instructions.</p>
                </div>

                {/* VISUAL CHART */}
                <div className="space-y-3 pt-2">
                  {/* INPUT */}
                  <div className="flex items-center gap-2">
                    <span className="text-xxs font-extrabold bg-slate-200 text-slate-600 px-2 py-0.5 rounded uppercase">START</span>
                    <ChevronRight className="w-4 h-4 text-slate-405" />
                    <span className="text-xxs text-slate-450 italic font-bold">Raw representative audio/transcript input</span>
                  </div>

                  {/* NODE: Input Router */}
                  <button
                    onClick={() => setSelectedGraphNode('input_parser')}
                    className={`w-full p-3 rounded-xl border text-left transition duration-150 flex items-center justify-between cursor-pointer ${
                      selectedGraphNode === 'input_parser'
                        ? 'bg-indigo-50/70 border-indigo-305 text-indigo-950 shadow-xxs ring-1 ring-indigo-500/20'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-350'
                    }`}
                  >
                    <div>
                      <span className="text-xxs font-extrabold text-slate-400 block uppercase font-mono tracking-wider">NODE 1</span>
                      <span className="text-xs font-extrabold font-mono text-slate-800">input_parser_node</span>
                    </div>
                    {selectedGraphNode === 'input_parser' && <CheckCircle className="w-4.5 h-4.5 text-indigo-600" />}
                  </button>

                  <div className="w-full flex justify-center py-0.5">
                    <div className="h-4 w-0.5 bg-slate-300 border-dashed border-l"></div>
                  </div>

                  {/* NODE: Entity Extractor */}
                  <button
                    onClick={() => setSelectedGraphNode('entity_extractor')}
                    className={`w-full p-3 rounded-xl border text-left transition duration-150 flex items-center justify-between cursor-pointer ${
                      selectedGraphNode === 'entity_extractor'
                        ? 'bg-indigo-50/70 border-indigo-350 text-indigo-950 shadow-xxs ring-1 ring-indigo-500/20'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-350'
                    }`}
                  >
                    <div>
                      <span className="text-xxs font-extrabold text-slate-400 block uppercase font-mono tracking-wider">NODE 2</span>
                      <span className="text-xs font-extrabold font-mono text-slate-800">entity_extractor (llama3)</span>
                    </div>
                    {selectedGraphNode === 'entity_extractor' && <CheckCircle className="w-4.5 h-4.5 text-indigo-600" />}
                  </button>

                  <div className="w-full flex justify-center py-0.5">
                    <div className="h-4 w-0.5 bg-slate-300 border-dashed border-l"></div>
                  </div>

                  {/* NODE: Compliance Auditor */}
                  <button
                    onClick={() => setSelectedGraphNode('compliance_check')}
                    className={`w-full p-3 rounded-xl border text-left transition duration-150 flex items-center justify-between cursor-pointer ${
                      selectedGraphNode === 'compliance_check'
                        ? 'bg-indigo-50/70 border-indigo-350 text-indigo-950 shadow-xxs ring-1 ring-indigo-500/20'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-350'
                    }`}
                  >
                    <div>
                      <span className="text-xxs font-extrabold text-slate-400 block uppercase font-mono tracking-wider">NODE 3</span>
                      <span className="text-xs font-extrabold font-mono text-slate-800">compliance_check_node</span>
                    </div>
                    {selectedGraphNode === 'compliance_check' && <CheckCircle className="w-4.5 h-4.5 text-indigo-600" />}
                  </button>

                  <div className="w-full flex justify-center py-0.5">
                    <div className="h-4 w-0.5 bg-slate-300 border-dashed border-l"></div>
                  </div>

                  {/* NODE: DB SQL Insert */}
                  <button
                    onClick={() => setSelectedGraphNode('db_insert')}
                    className={`w-full p-3 rounded-xl border text-left transition duration-150 flex items-center justify-between cursor-pointer ${
                      selectedGraphNode === 'db_insert'
                        ? 'bg-indigo-50/70 border-indigo-350 text-indigo-950 shadow-xxs ring-1 ring-indigo-500/20'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-350'
                    }`}
                  >
                    <div>
                      <span className="text-xxs font-extrabold text-slate-400 block uppercase font-mono tracking-wider">NODE 4</span>
                      <span className="text-xs font-extrabold font-mono text-slate-800">postgres_db_insert_node</span>
                    </div>
                    {selectedGraphNode === 'db_insert' && <CheckCircle className="w-4.5 h-4.5 text-indigo-600" />}
                  </button>

                  {/* END STATE */}
                  <div className="pt-3 flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-slate-405" />
                    <span className="text-xxs font-extrabold bg-emerald-100 text-emerald-805 px-2.5 py-0.5 rounded uppercase">COMPLETED & SYNCED</span>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-200 mt-6 font-medium">
                <h4 className="text-xxs font-extrabold text-slate-800 mb-1 flex items-center gap-1.5 uppercase tracking-wider text-indigo-950">
                  <HelpCircle className="w-4 h-4 text-indigo-500" />
                  Model Selection: llama3
                </h4>
                <p className="text-xxs text-slate-450 leading-relaxed">
                  We leverage Meta's <strong>llama-3.3-70b-versatile</strong> for primary extraction nodes due to its rigid adherence to structured output schemas (JSON Mode) and fast inference.
                </p>
              </div>
            </div>

            {/* CODE OUTPUT VIEW */}
            <div className="lg:col-span-7 flex flex-col h-[550px]">
              <div className="px-6 py-4 bg-slate-900 text-slate-400 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xxs font-extrabold text-indigo-400 uppercase font-mono tracking-wider">Python Source Code View</span>
                  <h4 className="text-xs font-bold text-white mt-0.5 font-mono">{LANGGRAPH_NODES[selectedGraphNode].title}</h4>
                </div>
                <span className="text-xxs font-mono bg-slate-800 text-slate-300 px-2 py-1 rounded">compiled_agent.py</span>
              </div>
              <div className="p-6 bg-slate-950 flex-1 overflow-auto font-mono text-xxs text-slate-300 leading-normal scrollbar-thin">
                <p className="text-xxs text-slate-400 mb-4 font-sans italic border-l-2 border-indigo-500 pl-2">
                  {LANGGRAPH_NODES[selectedGraphNode].role}
                </p>
                <pre className="leading-relaxed whitespace-pre font-medium">{LANGGRAPH_NODES[selectedGraphNode].code}</pre>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: FASTAPI ROUTER SOURCE */}
        {activeCodeTab === 'fastapi' && (
          <div className="flex flex-col h-[550px]">
            <div className="px-6 py-4 bg-slate-900 text-slate-400 border-b border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xxs font-extrabold text-emerald-405 uppercase font-mono tracking-wider">FastAPI Controller Gateway</span>
                <h4 className="text-xs font-bold text-white mt-0.5 font-mono">routers/interactions.py</h4>
              </div>
              <span className="text-xxs font-mono bg-slate-800 text-slate-300 px-2 py-1 rounded">FastAPI Server v1.0</span>
            </div>
            <div className="p-6 bg-slate-950 flex-1 overflow-auto font-mono text-xxs text-slate-300 leading-normal">
              <pre className="leading-relaxed whitespace-pre font-medium">{FASTAPI_ROUTER_CODE}</pre>
            </div>
          </div>
        )}

        {/* TAB 3: POSTGRES DDL DATABASE SCHEMAS */}
        {activeCodeTab === 'postgres' && (
          <div className="flex flex-col h-[550px]">
            <div className="px-6 py-4 bg-slate-900 text-slate-400 border-b border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xxs font-extrabold text-amber-500 uppercase font-mono tracking-wider">SQL Relational DDL Script</span>
                <h4 className="text-xs font-bold text-white mt-0.5 font-mono">database/schema.sql</h4>
              </div>
              <span className="text-xxs font-mono bg-slate-800 text-slate-300 px-2 py-1 rounded">PostgreSQL v16</span>
            </div>
            <div className="p-6 bg-slate-950 flex-1 overflow-auto font-mono text-xxs text-slate-300 leading-normal">
              <pre className="leading-relaxed whitespace-pre font-medium">{SQL_SCHEMA_CODE}</pre>
            </div>
          </div>
        )}

        {/* TAB 4: REDUX STATE INSPECTOR */}
        {activeCodeTab === 'redux' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
            {/* EXPLAINER PANEL */}
            <div className="lg:col-span-4 p-6 bg-slate-50/50 flex flex-col justify-between font-medium">
              <div className="space-y-4">
                <h3 className="text-xxs font-extrabold text-slate-400 uppercase tracking-widest">Client Redux Slices</h3>
                <p className="text-xxs text-slate-600 leading-relaxed">
                  We synchronize the manual entry form inputs and LLM entities on the client-side state store using **Redux Toolkit (RTK)** to achieve zero-latency UI updates.
                </p>
                <div className="space-y-2">
                  <div className="p-2.5 bg-white border border-slate-200/80 rounded-lg text-xxs font-medium text-slate-700 shadow-xxs">
                    <span className="font-extrabold text-indigo-755 block mb-0.5">app/draft Slice</span>
                    Interaction draft object mapped by form entries and llama3 entities.
                  </div>
                  <div className="p-2.5 bg-white border border-slate-200/80 rounded-lg text-xxs font-medium text-slate-700 shadow-xxs">
                    <span className="font-extrabold text-indigo-755 block mb-0.5">app/hcps Slice</span>
                    Physician registry list including quarterly quotas.
                  </div>
                </div>
              </div>
              <p className="text-xxs text-slate-400 italic">Store state is stored locally for persistent rep sessions.</p>
            </div>

            {/* LIVE DATA INSPECTION */}
            <div className="lg:col-span-8 flex flex-col h-[550px] bg-slate-950">
              <div className="px-6 py-4 bg-slate-900 text-slate-400 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xxs font-extrabold text-indigo-400 uppercase font-mono tracking-wider">Live store.getState() Object</span>
                <span className="text-xxs text-emerald-400 font-mono flex items-center gap-1.5 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-450 animate-ping"></span> Sync Active
                </span>
              </div>
              <div className="p-6 flex-1 overflow-auto font-mono text-xxs text-slate-350 leading-relaxed scrollbar-thin">
                <pre className="font-medium">{JSON.stringify(reduxState, null, 2)}</pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
