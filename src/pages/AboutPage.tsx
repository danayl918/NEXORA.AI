import React from 'react';
import {
  Info,
  Layers,
  ShieldCheck,
  CheckCircle2,
  Code2,
  Cpu,
  Zap,
  Lock,
  Terminal,
  FileText,
  CheckSquare,
  Sparkles,
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 text-white">
      {/* Header */}
      <div className="border-b border-[#383838] pb-5 space-y-2">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#10A37F]/15 text-[#10A37F] border border-[#10A37F]/30">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Aspiring Software Engineer Portfolio Project</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight">About NEXORA AI — Intelligent AI Workspace</h2>
        <p className="text-xs text-[#ACACAC] leading-relaxed max-w-2xl">
          A production-grade, full-stack AI web application showcasing modern software engineering practices,
          server-side tool routing, strict cost & privacy controls, and a refined ChatGPT-inspired interface.
        </p>
      </div>

      {/* Architecture Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-[#424242] bg-[#2F2F2F] space-y-2">
          <div className="w-8 h-8 rounded-lg bg-[#10A37F]/15 text-[#10A37F] flex items-center justify-center">
            <Cpu className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold">Full-Stack Architecture</h3>
          <p className="text-xs text-[#ACACAC] leading-relaxed">
            Express backend with Vite middleware proxying Gemini 3.1 Flash-Lite SDK calls. Prepared for clean FastAPI migration.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-[#424242] bg-[#2F2F2F] space-y-2">
          <div className="w-8 h-8 rounded-lg bg-[#10A37F]/15 text-[#10A37F] flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold">Deterministic Tools</h3>
          <p className="text-xs text-[#ACACAC] leading-relaxed">
            Function-calling pipeline routing tasks, todo lists, and document analysis with bounded execution loops.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-[#424242] bg-[#2F2F2F] space-y-2">
          <div className="w-8 h-8 rounded-lg bg-[#10A37F]/15 text-[#10A37F] flex items-center justify-center">
            <Lock className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold">Security & Zero Leakage</h3>
          <p className="text-xs text-[#ACACAC] leading-relaxed">
            No API keys or sensitive environment variables are ever bundled or transmitted to the client browser.
          </p>
        </div>
      </div>

      {/* Feature Checklist */}
      <div className="rounded-xl border border-[#424242] bg-[#2F2F2F] p-6 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[#10A37F] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          Completed Engineering Deliverables
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#ACACAC]">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#10A37F] shrink-0 mt-0.5" />
            <span>
              <strong className="text-white">Primary Gemini AI Agent:</strong> Natural language dialogue with tool execution and Markdown rendering.
            </span>
          </div>

          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#10A37F] shrink-0 mt-0.5" />
            <span>
              <strong className="text-white">Document Assistant:</strong> Native PDF and TXT file ingestion, executive summaries, and targeted Q&A.
            </span>
          </div>

          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#10A37F] shrink-0 mt-0.5" />
            <span>
              <strong className="text-white">Coding Assistant:</strong> Explain, debug, refactor, generate, and perform static code quality reviews.
            </span>
          </div>

          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#10A37F] shrink-0 mt-0.5" />
            <span>
              <strong className="text-white">Task Planner:</strong> Interactive task CRUD with bidirectional sync from AI chat commands.
            </span>
          </div>

          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#10A37F] shrink-0 mt-0.5" />
            <span>
              <strong className="text-white">Cost & Quota Controls:</strong> Bounded conversation window, Flash Lite default, demo request counters.
            </span>
          </div>

          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#10A37F] shrink-0 mt-0.5" />
            <span>
              <strong className="text-white">ChatGPT-Inspired Dark Palette:</strong> #212121 main background, #171717 sidebar, #10A37F teal accents.
            </span>
          </div>
        </div>
      </div>

      {/* Architecture & Engineering Practices */}
      <div className="rounded-xl border border-[#424242] bg-[#2F2F2F] p-6 space-y-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[#10A37F]" />
          Software Engineering Practices
        </h3>
        <p className="text-xs text-[#ACACAC] leading-relaxed">
          1. <strong>Bounded History</strong>: Limits conversation context to the most recent 10 messages, preventing quadratic token consumption and controlling API costs.<br />
          2. <strong>Tool Routing Layer</strong>: The backend inspects Gemini function calls for <code className="text-white">createTask</code>, <code className="text-white">listTasks</code>, <code className="text-white">completeTask</code>, and feeds execution results back into the model in a strictly bounded loop (max 1 return iteration).<br />
          3. <strong>Resilient Error Handling</strong>: Dedicated detection for HTTP 429 quota exhaustion, network timeouts, invalid documents, and empty messages.<br />
          4. <strong>Honest Capabilities</strong>: Explicitly avoids claiming sandbox code execution or real-time web scraping when not performed.
        </p>
      </div>

      {/* Limitations & Roadmap */}
      <div className="rounded-xl border border-[#424242] bg-[#2F2F2F] p-6 space-y-3">
        <h3 className="text-sm font-semibold text-white">Current Limitations & Roadmap</h3>
        <ul className="text-xs text-[#ACACAC] space-y-2 list-disc pl-5 leading-relaxed">
          <li>
            <strong className="text-white">Local Persistence:</strong> Workspace data is stored securely in the browser's localStorage. A multi-user Postgres or Cloud SQL database can be provisioned for cross-device persistence.
          </li>
          <li>
            <strong className="text-white">FastAPI Migration:</strong> The API endpoints (<code className="text-white">/api/chat</code>, <code className="text-white">/api/analyze-document</code>, <code className="text-white">/api/code-assist</code>) are fully decoupled from frontend state, allowing a Python FastAPI backend to be dropped in without changing UI code.
          </li>
        </ul>
      </div>
    </div>
  );
};
