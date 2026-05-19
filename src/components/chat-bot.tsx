"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, X, Sparkles, Bot, User } from "lucide-react";

interface Message {
  id: string;
  sender: "bot" | "user";
  text: string;
  timestamp: Date;
}

const SUGGESTIONS = [
  "Explain the CAP Theorem",
  "When is the next ML class?",
  "What is the HLD curriculum?",
  "Tell me about Transformers"
];

// Extensive high-fidelity knowledge training base for SST Sem 4 Students
const KNOWLEDGE_BASE = {
  cap: "📖 **CAP Dilemma & Distributed Storage**:\n\n" +
       "In a distributed system, you can only guarantee 2 out of 3 properties:\n" +
       "• **Consistency (C)**: Every read receives the most recent write or an error.\n" +
       "• **Availability (A)**: Every non-failing node returns a non-error response (without guarantee of containing the latest write).\n" +
       "• **Partition Tolerance (P)**: The system continues to operate despite network partition/messages being dropped.\n\n" +
       "Since physical networks will always drop packets, **P is mandatory**. You must choose between **CP** (e.g., HBase, MongoDB) or **AP** (e.g., Cassandra, DynamoDB).",

  caching: "⚡ **Caching & Eviction Strategies (HLD)**:\n\n" +
           "Caching improves latency by keeping hot data in fast memory. Key concepts:\n" +
           "• **Eviction policies**: **LRU** (Least Recently Used) discards the least recently accessed item; **LFU** (Least Frequently Used) discards items with the lowest hit frequency.\n" +
           "• **Write Policies**: **Write-Through** updates cache and DB simultaneously (high consistency, slow writes); **Write-Back** updates cache first, flushing to DB asynchronously (fast writes, risk of data loss).",

  load_balancing: "⚖️ **Load Balancing & Consistent Hashing**:\n\n" +
                  "• **Load Balancers** distribute incoming network traffic across multiple servers (e.g., using Round Robin, Least Connections).\n" +
                  "• **Consistent Hashing** is a technique used in distributed systems where nodes and keys are mapped onto a circular hash ring. It ensures that when a server node is added or removed, only a minimal fraction of keys (`K/N`) are rehashed or moved, preventing cache stampedes!",

  indexing: "🗂️ **Database Indexing (B+ Trees)**:\n\n" +
             "Modern relational databases use **B+ Trees** for indexes because:\n" +
             "• All data is stored in leaf nodes, keeping non-leaf nodes highly compact to fit entirely in memory.\n" +
             "• Leaf nodes are linked together, enabling extremely fast sequential range scans.\n" +
             "• Provides balanced `O(log N)` search, insert, and delete operations.",

  transactions: "💾 **Transactions, ACID & Concurrency**:\n\n" +
                "A database transaction must uphold **ACID** properties:\n" +
                "• **Atomicity**: All operations succeed or all fail.\n" +
                "• **Consistency**: Database state moves only between valid states.\n" +
                "• **Isolation**: Concurrent transactions do not interfere.\n" +
                "• **Durability**: Committed changes survive system failures (guaranteed using **WAL - Write-Ahead Logging**).",

  rag: "🔍 **Retrieval-Augmented Generation (RAG)**:\n\n" +
       "RAG connects LLMs to external, private datasets by:\n" +
       "1. **Chunking**: Splitting documents into smaller, meaningful texts.\n" +
       "2. **Embedding**: Converting text chunks into high-dimensional vectors.\n" +
       "3. **Vector Database**: Storing embeddings for fast retrieval.\n" +
       "4. **Retrieval**: Finding the top-k most semantically similar chunks based on user query and injecting them into the LLM prompt.",

  agent: "🤖 **AI Agents & Orchestration (LangGraph & SDK)**:\n\n" +
         "• **AI Agents** can reason, plan, and call tools autonomously using feedback loops.\n" +
         "• **LangGraph** introduces stateful, multi-agent orchestration by defining agents as nodes and transitions as edges on a cyclic graph, allowing complex stateful loops.\n" +
         "• **Agent SDK** standardizes agent creation, thread tracing, and memory management.",

  backprop: "📐 **Backpropagation & Computational Graphs**:\n\n" +
            "Backpropagation is the backbone of neural network training. It uses the **Chain Rule of Calculus** to calculate the partial derivatives of the loss function with respect to every weight in the network, moving backward from the final output layer to the input. This gradient is then used by optimizers (like SGD or Adam) to update weights and minimize loss.",

  cnn: "👁️ **Convolutions & CNNs (ML III)**:\n\n" +
       "Convolutional Neural Networks extract features from grid-structured data (like images) using:\n" +
       "• **Kernels/Filters**: Slide across the image to detect edges, shapes, and textures.\n" +
       "• **Stride**: The step size the filter moves.\n" +
       "• **Pooling**: Reduces spatial dimensions (e.g., Max Pooling selects the most active feature), offering translation invariance.",

  transformer: "🧠 **Transformers & Self-Attention**:\n\n" +
               "Transformers replaced traditional RNNs/LSTMs in sequence modeling by processing sequences in parallel. Key engine:\n" +
               "• **Self-Attention**: Computes dynamic scores between all tokens using **Query (Q), Key (K), and Value (V)** vectors.\n" +
               "• **Multi-Head Attention**: Runs multiple attention heads in parallel to capture various semantic relationships.\n" +
               "• **Positional Encodings**: Injects order information since there are no recurrence steps.",

  syllabus: "📅 **Active Sem 4 Syllabuses**:\n\n" +
             "• **Subject 1 (DBMS)**: Advanced DBMS (Architecture, Buffer Pools, Indexing, Transactions, distributed DBs).\n" +
             "• **Subject 2 (GenAI)**: GenAI Engineering (Prompting, RAG, LangGraph, Agent SDK, Memory, MCP, Scaling).\n" +
             "• **Subject 3 (HLD)**: System Design (Hashing, Caching, CAP, SQL vs NoSQL, Netflix/Uber Case Studies).\n" +
             "• **Subject 4 (ML III)**: Neural Networks (Perceptron, Backprop, Regularization, CNNs, Transformers).",

  case_study: "🏗️ **High-Scale Case Studies (HLD)**:\n\n" +
              "• **Netflix**: Relies on hybrid cloud (AWS + Open Connect CDN), microservices, active-active multi-region replication, and heavy edge-caching.\n" +
              "• **Uber**: Uses geospatial indexing (H3 hexagon grid), consistent hashing for rider-driver matching, dynamic surge pricing algorithms, and distributed message queues.\n" +
              "• **Facebook Newsfeed**: Employs fan-out-on-write or fan-out-on-read hybrid patterns, heavy memcached clusters, and graph databases."
};

export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "initial",
      sender: "bot",
      text: "Hi! I am your SST Sem 4 Study Companion. 🚀 Ask me about deep learning models, distributed architectures, databases, or your class schedule!",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = (text: string) => {
    if (!text.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Math.random().toString(),
      sender: "user",
      text,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      let replyText = "I'm looking into that for you! That topic is covered in your Sem 4 curriculum. Let me know if you want me to summarize your active syllabus or provide tips on distributed systems!";
      
      const normalizedText = text.toLowerCase();
      
      if (normalizedText.includes("cap") || normalizedText.includes("consistency") || normalizedText.includes("partition")) {
        replyText = KNOWLEDGE_BASE.cap;
      } else if (normalizedText.includes("cache") || normalizedText.includes("caching") || normalizedText.includes("lru") || normalizedText.includes("lfu")) {
        replyText = KNOWLEDGE_BASE.caching;
      } else if (normalizedText.includes("load balance") || normalizedText.includes("load balancing") || normalizedText.includes("hash") || normalizedText.includes("hashing")) {
        replyText = KNOWLEDGE_BASE.load_balancing;
      } else if (normalizedText.includes("index") || normalizedText.includes("indexing") || normalizedText.includes("b+") || normalizedText.includes("tree")) {
        replyText = KNOWLEDGE_BASE.indexing;
      } else if (normalizedText.includes("transaction") || normalizedText.includes("acid") || normalizedText.includes("concurrency") || normalizedText.includes("wal")) {
        replyText = KNOWLEDGE_BASE.transactions;
      } else if (normalizedText.includes("rag") || normalizedText.includes("retrieval") || normalizedText.includes("embedding") || normalizedText.includes("chunk")) {
        replyText = KNOWLEDGE_BASE.rag;
      } else if (normalizedText.includes("agent") || normalizedText.includes("langgraph") || normalizedText.includes("sdk")) {
        replyText = KNOWLEDGE_BASE.agent;
      } else if (normalizedText.includes("backprop") || normalizedText.includes("backpropagation") || normalizedText.includes("derivative") || normalizedText.includes("chain rule")) {
        replyText = KNOWLEDGE_BASE.backprop;
      } else if (normalizedText.includes("cnn") || normalizedText.includes("convolution") || normalizedText.includes("filter") || normalizedText.includes("pooling")) {
        replyText = KNOWLEDGE_BASE.cnn;
      } else if (normalizedText.includes("transformer") || normalizedText.includes("attention") || normalizedText.includes("self-attention")) {
        replyText = KNOWLEDGE_BASE.transformer;
      } else if (normalizedText.includes("syllabus") || normalizedText.includes("curriculum") || normalizedText.includes("class") || normalizedText.includes("subject") || normalizedText.includes("schedule")) {
        replyText = KNOWLEDGE_BASE.syllabus;
      } else if (normalizedText.includes("case study") || normalizedText.includes("netflix") || normalizedText.includes("uber") || normalizedText.includes("facebook") || normalizedText.includes("design")) {
        replyText = KNOWLEDGE_BASE.case_study;
      } else if (normalizedText.includes("hi") || normalizedText.includes("hello") || normalizedText.includes("hey") || normalizedText.includes("online")) {
        replyText = "Hello! 👋 Ready to smash your SST Sem 4 preparation? Choose one of the quick suggestions below or ask me any question about your curriculum!";
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          sender: "bot",
          text: replyText,
          timestamp: new Date()
        }
      ]);
      setIsTyping(false);
    }, 900);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-xl hover:scale-105 transition-all duration-300 relative group"
        >
          <MessageSquare size={24} />
          <span className="absolute right-16 top-1/2 -translate-y-1/2 bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap shadow-md">
            SST Companion AI ✨
          </span>
        </button>
      )}

      {/* Collapsible Chat Window */}
      {isOpen && (
        <div className="w-[360px] h-[500px] bg-white rounded-2xl border border-slate-100 shadow-2xl flex flex-col overflow-hidden transition-all duration-300 animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center">
                <Bot size={20} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight flex items-center gap-1.5">
                  SST Study Companion
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-ping"></span>
                </h3>
                <p className="text-[10px] text-blue-100">Powered by SST AI</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 max-w-[85%] ${
                  msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                    msg.sender === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-white border border-slate-100 text-slate-700 shadow-sm"
                  }`}
                >
                  {msg.sender === "user" ? <User size={14} /> : <Bot size={14} className="text-blue-600" />}
                </div>
                <div className="space-y-1">
                  <div
                    className={`text-[12px] leading-relaxed p-3 rounded-2xl ${
                      msg.sender === "user"
                        ? "bg-blue-600 text-white rounded-tr-none shadow-md shadow-blue-500/10"
                        : "bg-white border border-slate-100 text-slate-700 rounded-tl-none shadow-sm"
                    }`}
                  >
                    {msg.text}
                  </div>
                  <p className="text-[9px] text-slate-400 px-1">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}

            {/* Bouncing Dots Loader */}
            {isTyping && (
              <div className="flex gap-2.5 mr-auto max-w-[80%]">
                <div className="w-7 h-7 bg-white border border-slate-100 rounded-lg flex items-center justify-center shadow-sm">
                  <Bot size={14} className="text-blue-600" />
                </div>
                <div className="bg-white border border-slate-100 p-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions Chips */}
          <div className="p-3 bg-white border-t border-slate-100 flex gap-2 overflow-x-auto shrink-0 scrollbar-none">
            {SUGGESTIONS.map((sug, i) => (
              <button
                key={i}
                onClick={() => handleSend(sug)}
                className="text-[10px] font-bold text-blue-600 bg-blue-50/50 hover:bg-blue-50 border border-blue-100/50 rounded-full px-3 py-1.5 whitespace-nowrap transition-colors flex items-center gap-1 shrink-0"
              >
                <Sparkles size={8} />
                {sug}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(inputValue);
            }}
            className="p-3 border-t border-slate-100 bg-white flex gap-2 items-center shrink-0"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask your companion..."
              className="flex-1 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-xs text-slate-800 placeholder-slate-400 border border-transparent focus:border-blue-500/30 rounded-xl px-3.5 py-2.5 focus:outline-none transition-all"
            />
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="h-9 w-9 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 text-white disabled:text-slate-400 rounded-xl flex items-center justify-center transition-all shadow-md shadow-blue-500/10 active:scale-95"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
