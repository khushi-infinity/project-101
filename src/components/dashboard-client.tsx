"use client";

import { useState } from "react";
import { Menu, Search, ChevronDown, ChevronRight, X } from "lucide-react";
import Link from "next/link";
import { SignOut } from "@/components/sign-out";
import { ChatBot } from "@/components/chat-bot";

interface ClassItem {
  date: string;
  time: string;
  title: string;
  lecture: string;
  assignment?: string;
  additionalProblem?: string;
  isActive: boolean;
}

interface Subject {
  tag: string;
  title: string;
  classes: ClassItem[];
}

export function DashboardClient({ initialActiveSubjectId }: { initialActiveSubjectId: string }) {
  const [activeSubjectId, setActiveSubjectId] = useState(initialActiveSubjectId);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const toTopicSlug = (title: string) =>
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const subjectsData: Record<string, Subject> = {
    "1": {
      tag: "SUBJECT - 1",
      title: "SST Advanced Database Management Systems",
      classes: [
        { date: "27 APR", time: "10:00 AM", title: "DBMS Architecture", lecture: "0.0%", assignment: "-", additionalProblem: "-", isActive: false },
        { date: "30 APR", time: "10:00 AM", title: "Storage Engine", lecture: "0.0%", assignment: "-", additionalProblem: "-", isActive: false },
        { date: "4 MAY", time: "10:00 AM", title: "Storage Engine_2", lecture: "0.0%", assignment: "-", additionalProblem: "-", isActive: false },
        { date: "7 MAY", time: "10:00 AM", title: "Buffer Pool", lecture: "0.0%", assignment: "-", additionalProblem: "-", isActive: false },
        { date: "11 MAY", time: "10:00 AM", title: "Buffer Pool_2", lecture: "0.0%", assignment: "-", additionalProblem: "-", isActive: false },
        { date: "14 MAY", time: "10:00 AM", title: "Index Structures", lecture: "0.0%", assignment: "-", additionalProblem: "-", isActive: false },
        { date: "TODAY", time: "10:00 AM", title: "Index Structures_2", lecture: "0.0%", assignment: "-", additionalProblem: "-", isActive: true },
        { date: "21 MAY", time: "10:00 AM", title: "Query Parsing", lecture: "0.0%", assignment: "-", additionalProblem: "-", isActive: false },
        { date: "25 MAY", time: "10:00 AM", title: "Query Execution", lecture: "0.0%", assignment: "-", additionalProblem: "-", isActive: false },
        { date: "27 MAY", time: "10:00 AM", title: "Query Execution_2", lecture: "0.0%", assignment: "-", additionalProblem: "-", isActive: false },
        { date: "1 JUN", time: "10:00 AM", title: "Query Optimization", lecture: "0.0%", assignment: "-", additionalProblem: "-", isActive: false },
        { date: "3 JUN", time: "10:00 AM", title: "Transactions", lecture: "0.0%", assignment: "-", additionalProblem: "-", isActive: false },
        { date: "8 JUN", time: "10:00 AM", title: "Concurrency", lecture: "0.0%", assignment: "-", additionalProblem: "-", isActive: false },
        { date: "10 JUN", time: "10:00 AM", title: "Logging & Recovery", lecture: "0.0%", assignment: "-", additionalProblem: "-", isActive: false },
        { date: "15 JUN", time: "10:00 AM", title: "Modern Architectures", lecture: "0.0%", assignment: "-", additionalProblem: "-", isActive: false },
        { date: "17 JUN", time: "10:00 AM", title: "Distributed DBs + Final", lecture: "0.0%", assignment: "-", additionalProblem: "-", isActive: false },
      ]
    },
    "2": {
      tag: "SUBJECT - 2",
      title: "SST GenAI Engineering",
      classes: [
        { date: "24 APR", time: "02:30 PM", title: "Introduction to GenAI", lecture: "95.5%", assignment: "-", additionalProblem: "-", isActive: false },
        { date: "28 APR", time: "02:30 PM", title: "Prompt Engineering", lecture: "88.2%", assignment: "-", additionalProblem: "-", isActive: false },
        { date: "5 MAY", time: "02:30 PM", title: "Introduction to AI Agents", lecture: "72.4%", assignment: "-", additionalProblem: "-", isActive: false },
        { date: "7 MAY", time: "02:30 PM", title: "RAG 1 – Introduction To Retrieval-Augmented Generation", lecture: "90.0%", assignment: "-", additionalProblem: "-", isActive: false },
        { date: "12 MAY", time: "02:30 PM", title: "RAG 2 – Advanced Retrieval Strategies", lecture: "0.0%", assignment: "-", additionalProblem: "-", isActive: false },
        { date: "14 MAY", time: "02:30 PM", title: "LangChain Fundamentals & LangGraph — Orchestration & Stateful Agents", lecture: "0.0%", assignment: "-", additionalProblem: "-", isActive: false },
        { date: "19 MAY", time: "02:30 PM", title: "Agent SDK — Fundamentals", lecture: "0.0%", assignment: "-", additionalProblem: "-", isActive: true },
        { date: "21 MAY", time: "02:30 PM", title: "Threads & Tracing in Agent SDK", lecture: "0.0%", assignment: "-", additionalProblem: "-", isActive: false },
        { date: "26 MAY", time: "02:30 PM", title: "Memory Systems in AI Agents", lecture: "0.0%", assignment: "-", additionalProblem: "-", isActive: false },
        { date: "28 MAY", time: "02:30 PM", title: "Graph Databases & Relational Memory", lecture: "0.0%", assignment: "-", additionalProblem: "-", isActive: false },
        { date: "2 JUN", time: "02:30 PM", title: "Conversational & Voice-Based AI Agents", lecture: "0.0%", assignment: "-", additionalProblem: "-", isActive: false },
        { date: "4 JUN", time: "02:30 PM", title: "Model Context Protocol (MCP) & Agent Communication", lecture: "0.0%", assignment: "-", additionalProblem: "-", isActive: false },
        { date: "9 JUN", time: "02:30 PM", title: "Security, Guardrails & Safety in GenAI", lecture: "0.0%", assignment: "-", additionalProblem: "-", isActive: false },
        { date: "11 JUN", time: "02:30 PM", title: "Deployment, Scaling & Final Demos", lecture: "0.0%", assignment: "-", additionalProblem: "-", isActive: false },
      ]
    },
    "3": {
      tag: "SUBJECT - 3",
      title: "SST High Level Design 101",
      classes: [
        { date: "27 APR", time: "02:30 PM", title: "System Design 101", lecture: "100.0%", assignment: "-", additionalProblem: "-", isActive: false },
        { date: "29 APR", time: "02:30 PM", title: "Load Balancing and Consistent Hashing", lecture: "100.0%", assignment: "4/4", additionalProblem: "-", isActive: false },
        { date: "4 MAY", time: "02:30 PM", title: "Caching - 1", lecture: "45.1%", assignment: "0/6", additionalProblem: "-", isActive: false },
        { date: "6 MAY", time: "02:30 PM", title: "Caching - 2", lecture: "68.6%", assignment: "0/9", additionalProblem: "-", isActive: false },
        { date: "11 MAY", time: "02:30 PM", title: "Caching: Case Studies", lecture: "100.0%", assignment: "0/6", additionalProblem: "-", isActive: false },
        { date: "13 MAY", time: "02:30 PM", title: "Case Study: Facebook Newsfeed", lecture: "82.8%", assignment: "0/8", additionalProblem: "-", isActive: false },
        { date: "TODAY", time: "02:30 PM", title: "Storage layer - CAP dilemma, Replication, Master Slave", lecture: "78.9%", assignment: "0/12", additionalProblem: "-", isActive: true },
        { date: "20 MAY", time: "02:30 PM", title: "SQL vs NoSQL Database", lecture: "0.0%", assignment: "-", additionalProblem: "-", isActive: false },
        { date: "25 MAY", time: "02:30 PM", title: "NoSQL Internals - Storage", lecture: "0.0%", assignment: "-", additionalProblem: "-", isActive: false },
        { date: "27 MAY", time: "02:30 PM", title: "NoSQL - Multi-master", lecture: "0.0%", assignment: "-", additionalProblem: "-", isActive: false },
        { date: "1 JUN", time: "02:30 PM", title: "Case Study 1 - Search Typeahead", lecture: "0.0%", assignment: "-", additionalProblem: "-", isActive: false },
        { date: "3 JUN", time: "02:30 PM", title: "Case Study 2 - Messaging System", lecture: "0.0%", assignment: "-", additionalProblem: "-", isActive: false },
        { date: "8 JUN", time: "02:30 PM", title: "Case Study 3 - Design IRCTC", lecture: "0.0%", assignment: "-", additionalProblem: "-", isActive: false },
        { date: "10 JUN", time: "02:30 PM", title: "Case Study 4 - Design Netflix", lecture: "0.0%", assignment: "-", additionalProblem: "-", isActive: false },
        { date: "15 JUN", time: "02:30 PM", title: "Case Study 5 - Design Uber", lecture: "0.0%", assignment: "-", additionalProblem: "-", isActive: false },
      ]
    },
    "4": {
      tag: "SUBJECT - 4",
      title: "SST Neural Network & Intro to Computer Vision (ML III)",
      classes: [
        { date: "29 APR", time: "11:30 AM", title: "Why Deep Learning?", lecture: "0.0%", assignment: "-", additionalProblem: "-", isActive: false },
        { date: "6 MAY", time: "11:30 AM", title: "Why Deep Learning? - Revisited", lecture: "0.0%", assignment: "-", additionalProblem: "-", isActive: false },
        { date: "8 MAY", time: "09:00 AM", title: "Perceptron to MLP", lecture: "0.0%", assignment: "-", additionalProblem: "-", isActive: false },
        { date: "13 MAY", time: "11:30 AM", title: "Backpropagation & Computational Graphs", lecture: "0.0%", assignment: "-", additionalProblem: "-", isActive: false },
        { date: "19 MAY", time: "11:30 AM", title: "Loss Functions & Optimization", lecture: "0.0%", assignment: "-", additionalProblem: "-", isActive: true },
        { date: "20 MAY", time: "11:30 AM", title: "Regularization", lecture: "0.0%", assignment: "-", additionalProblem: "-", isActive: false },
        { date: "22 MAY", time: "09:00 AM", title: "Initialization, Normalization & Debugging", lecture: "0.0%", assignment: "-", additionalProblem: "-", isActive: false },
        { date: "23 MAY", time: "09:00 AM", title: "Convolutions", lecture: "0.0%", assignment: "-", additionalProblem: "-", isActive: false },
        { date: "27 MAY", time: "11:30 AM", title: "CNN Architectures", lecture: "0.0%", assignment: "-", additionalProblem: "-", isActive: false },
        { date: "29 MAY", time: "09:00 AM", title: "Transfer Learning & CNN Applications", lecture: "0.0%", assignment: "-", additionalProblem: "-", isActive: false },
        { date: "30 MAY", time: "09:00 AM", title: "Sequence Modeling: RNNs", lecture: "0.0%", assignment: "-", additionalProblem: "-", isActive: false },
        { date: "3 JUN", time: "11:30 AM", title: "LSTMs, GRUs & Gating", lecture: "0.0%", assignment: "-", additionalProblem: "-", isActive: false },
        { date: "5 JUN", time: "09:00 AM", title: "Seq2Seq & Attention", lecture: "0.0%", assignment: "-", additionalProblem: "-", isActive: false },
        { date: "10 JUN", time: "11:30 AM", title: "The Transformer", lecture: "0.0%", assignment: "-", additionalProblem: "-", isActive: false },
        { date: "12 JUN", time: "09:00 AM", title: "Transformers in Practice", lecture: "0.0%", assignment: "-", additionalProblem: "-", isActive: false },
      ]
    }
  };

  const activeSubject = subjectsData[activeSubjectId] || subjectsData["1"];

  const filteredClasses = activeSubject.classes.filter((cls) =>
    cls.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-screen bg-[#ffffff] text-slate-800 font-sans relative">
      
      {/* Search Backdrop Overlay */}
      {searchOpen && (
        <div 
          className="fixed inset-0 z-40 bg-transparent"
          onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
        />
      )}

      {/* Top Navbar */}
      <header className="h-[60px] flex items-center px-6 bg-[#f2f8fe] shrink-0 border-b border-slate-100 relative">
        <button className="text-slate-600 hover:text-slate-900 transition-colors mr-6">
          <Menu size={20} strokeWidth={2.5} />
        </button>
        
        {/* Search Activation Trigger */}
        <button 
          onClick={() => setSearchOpen(true)}
          className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-[0_1px_3px_rgba(0,0,0,0.1)] text-slate-600 hover:text-blue-500 cursor-pointer transition-colors mr-6"
        >
          <Search size={16} strokeWidth={2.5} />
        </button>

        {/* Search Popover Dropdown */}
        {searchOpen && (
          <div className="absolute top-[52px] left-[55px] w-[450px] bg-white rounded-xl shadow-[0_10px_35px_rgba(0,0,0,0.12)] border border-slate-100 p-5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Search by action, classroom, problems, topic, events."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs font-semibold text-slate-800 bg-[#f8fbff] border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent placeholder:text-slate-400"
                  autoFocus
                />
              </div>
              <button 
                onClick={() => { setSearchOpen(false); setSearchQuery(""); }} 
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>

            {/* Suggestions */}
            <div className="mt-4">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">Most Common</h4>
              <div className="flex flex-col gap-0.5">
                {["rag", "agent", "prompt", "dbms"].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setSearchQuery(suggestion)}
                    className="text-left text-xs font-bold text-slate-600 hover:text-blue-500 hover:bg-slate-50 transition-colors py-2 px-3 rounded-lg"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 cursor-pointer group h-full relative">
          <span className="text-sm font-semibold text-blue-500 group-hover:text-blue-600">SEM 4 (Term 2)</span>
          <ChevronDown size={16} className="text-blue-500 group-hover:text-blue-600" strokeWidth={2.5} />
          {/* Active Tab indicator underneath */}
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 -mb-[1px]"></div>
        </div>
        
        <div className="flex-1" />
        
        {/* Sign Out Button */}
        <div className="scale-75 origin-right opacity-50 hover:opacity-100 transition-opacity">
          <SignOut />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-80 bg-white flex flex-col z-10 border-r border-slate-100 shrink-0">
          <div className="flex-1 py-8 px-6 overflow-y-auto space-y-4">
            
            {Object.entries(subjectsData).map(([id, subject]) => {
              const isActive = id === activeSubjectId;
              
              return (
                <button 
                  onClick={() => {
                    setActiveSubjectId(id);
                    setSearchQuery("");
                  }} 
                  key={id} 
                  className="block w-full text-left"
                >
                  <div className={`rounded-xl p-4 border relative cursor-pointer transition-all ${
                    isActive 
                      ? "bg-white border-[#3b82f6]" 
                      : "bg-white border-slate-200 hover:border-slate-300 opacity-80 hover:opacity-100"
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs font-semibold tracking-wider ${isActive ? "text-[#3b82f6]" : "text-slate-500"}`}>
                        {subject.tag}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                        isActive ? "bg-blue-100 text-[#3b82f6]" : "bg-blue-50 text-blue-400"
                      }`}>
                        CORE
                      </span>
                    </div>
                    <h3 className={`font-semibold text-[13px] leading-snug ${isActive ? "text-[#3b82f6]" : "text-slate-500"}`}>
                      {subject.title}
                    </h3>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto px-12 py-8 bg-white">
          
          {/* Subject Header */}
          <div className="flex justify-between items-start mb-12">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs font-bold text-slate-400 tracking-widest">{activeSubject.tag}</span>
                <span className="text-[10px] font-bold text-[#f59e0b] border border-[#f59e0b] px-1.5 py-0.5 rounded-full">4 weeks</span>
              </div>
              <h1 className="text-[22px] font-bold text-slate-800">
                {activeSubject.title}
              </h1>
            </div>

            {/* Progress Ring */}
            <div className="flex flex-col items-center">
              <div className="text-[10px] text-slate-400 font-medium mb-1">Classes</div>
              <div className="relative w-11 h-11">
                <svg className="w-11 h-11 transform -rotate-90">
                  <circle className="text-slate-100" strokeWidth="2" stroke="currentColor" fill="transparent" r="20" cx="22" cy="22" />
                  <circle className="text-blue-500" strokeWidth="2" strokeDasharray="125" strokeDashoffset="15" strokeLinecap="round" stroke="currentColor" fill="transparent" r="20" cx="22" cy="22" />
                </svg>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[10px] font-bold text-blue-500">
                  {activeSubject.classes.length > 0 ? `${Math.min(14, activeSubject.classes.length)}/${Math.max(16, activeSubject.classes.length)}` : "0/0"}
                </div>
              </div>
            </div>
          </div>

          {/* Classes List */}
          <div className="space-y-0 relative ml-1">
            
            {filteredClasses.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-slate-200 rounded-xl bg-[#f8fbff]/50 px-6">
                <Search className="mx-auto text-slate-300 mb-3" size={28} />
                <p className="text-sm font-bold text-slate-500">No classes match &quot;{searchQuery}&quot;</p>
                <button 
                  onClick={() => setSearchQuery("")} 
                  className="mt-2 text-xs font-bold text-blue-500 hover:text-blue-600 underline"
                >
                  Clear search query
                </button>
              </div>
            ) : (
              filteredClasses.map((cls, index) => (
                <Link
                  key={index}
                  href={`/topic/${activeSubjectId}/${toTopicSlug(cls.title)}`}
                  className="flex items-center relative pl-16 pr-4 border-b border-slate-100 hover:bg-slate-50/50 group transition-colors cursor-pointer last:border-0 min-h-[72px]"
                >
                  
                  {/* Timeline vertical line segment */}
                  <div className="absolute left-[36px] top-0 bottom-0 w-[1px] bg-slate-200"></div>

                  {/* Timeline Dot */}
                  <div className={`absolute left-[32px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ring-4 ring-white z-10 ${cls.isActive ? 'bg-blue-500 font-bold' : 'bg-slate-300'}`}></div>

                  <div className="flex-1 flex gap-8 items-center py-4">
                    {/* Date & Time */}
                    <div className="w-40 shrink-0">
                      <span className={`text-[13px] font-bold tracking-wide ${cls.isActive ? 'text-blue-500' : 'text-slate-400'}`}>
                        {cls.date} | {cls.time}
                      </span>
                    </div>
                    
                    {/* Title */}
                    <div className={`flex-1 text-[13px] font-bold ${cls.isActive ? 'text-blue-500' : 'text-slate-700'}`}>
                      {cls.title}
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="flex items-center gap-12 text-center mr-8">
                    <div className="w-16">
                      <div className="text-[9px] text-slate-400 font-bold mb-1">Lecture</div>
                      <div className="text-xs font-bold text-slate-700">0.0%</div>
                    </div>
                    <div className="w-20">
                      <div className="text-[9px] text-slate-400 font-bold mb-1">Assignment</div>
                      <div className="text-xs font-bold text-slate-400">-</div>
                    </div>
                    <div className="w-24">
                      <div className="text-[9px] text-slate-400 font-bold mb-1">Additional Problem</div>
                      <div className="text-xs font-bold text-slate-400">-</div>
                    </div>
                  </div>

                  <ChevronRight size={16} className="text-blue-400 group-hover:text-blue-600 transition-colors" />
                </Link>
              ))
            )}
            
          </div>
          
          <div className="h-20"></div>

      </main>
      </div>

      {/* Premium Companion Chat Bot */}
      <ChatBot />
    </div>
  );
}
