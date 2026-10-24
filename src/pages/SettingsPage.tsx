import React, { useState } from 'react';
import {
  Settings,
  Zap,
  ShieldCheck,
  Database,
  Trash2,
  Download,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Sun,
  Moon,
  Info,
} from 'lucide-react';
import { ServerUsage } from '../types';

interface SettingsPageProps {
  usage: ServerUsage;
  onRefreshUsage: () => void;
  activeModel: string;
  onChangeModel: (model: string) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onClearAllWorkspaceData: () => void;
  onExportAllWorkspaceData: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  usage,
  onRefreshUsage,
  activeModel,
  onChangeModel,
  theme,
  onToggleTheme,
  onClearAllWorkspaceData,
  onExportAllWorkspaceData,
}) => {
  const [resettingUsage, setResettingUsage] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleResetUsage = async () => {
    setResettingUsage(true);
    try {
      const res = await fetch('/api/usage/reset', { method: 'POST' });
      if (res.ok) {
        onRefreshUsage();
        setFeedback('Demo request counter reset successfully.');
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setResettingUsage(false);
    }
  };

  const remaining = Math.max(0, usage.demoLimit - usage.totalRequests);
  const percentUsed = Math.min(100, Math.round((usage.totalRequests / usage.demoLimit) * 100));

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="border-b border-[#383838] pb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#10A37F]" />
          Settings & Cost Optimization Controls
        </h2>
        <p className="text-xs text-[#ACACAC] mt-1">
          Monitor real API consumption, configure AI models, and manage local data privacy.
        </p>
      </div>

      {feedback && (
        <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#10A37F]" />
          <span>{feedback}</span>
        </div>
      )}

      {/* 1. Cost & Usage Section */}
      <div className="rounded-xl border border-[#424242] bg-[#2F2F2F] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#10A37F]" />
            <h3 className="text-sm font-semibold text-white">Cost & API Usage Controls</h3>
          </div>
          <span className="text-xs font-mono text-[#10A37F] bg-[#10A37F]/10 px-2 py-0.5 rounded border border-[#10A37F]/30">
            {remaining} requests remaining
          </span>
        </div>

        <p className="text-xs text-[#ACACAC] leading-relaxed">
          NEXORA AI is engineered for low operating costs. It utilizes a bounded conversation window
          (10 messages max) to prevent quadratic prompt token growth, uses deterministic tools instead of
          excessive LLM steps, and limits demo session quotas.
        </p>

        {/* Progress Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-xs text-[#ACACAC]">
            <span>
              Demo Quota Consumed: <strong className="text-white">{usage.totalRequests}</strong> / {usage.demoLimit}
            </span>
            <span>{percentUsed}%</span>
          </div>
          <div className="w-full bg-[#202020] h-2.5 rounded-full overflow-hidden border border-[#3A3A3A]">
            <div
              className={`h-full transition-all duration-500 ${
                percentUsed > 80 ? 'bg-amber-500' : 'bg-[#10A37F]'
              }`}
              style={{ width: `${percentUsed}%` }}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 rounded-lg bg-[#242424] border border-[#3A3A3A]">
            <p className="text-[10px] text-[#8E8E8E] uppercase font-semibold">Chat Calls</p>
            <p className="text-base font-bold text-white mt-0.5">{usage.chatRequests}</p>
          </div>
          <div className="p-3 rounded-lg bg-[#242424] border border-[#3A3A3A]">
            <p className="text-[10px] text-[#8E8E8E] uppercase font-semibold">Document Calls</p>
            <p className="text-base font-bold text-white mt-0.5">{usage.docRequests}</p>
          </div>
          <div className="p-3 rounded-lg bg-[#242424] border border-[#3A3A3A]">
            <p className="text-[10px] text-[#8E8E8E] uppercase font-semibold">Code Calls</p>
            <p className="text-base font-bold text-white mt-0.5">{usage.codeRequests}</p>
          </div>
          <div className="p-3 rounded-lg bg-[#242424] border border-[#3A3A3A]">
            <p className="text-[10px] text-[#8E8E8E] uppercase font-semibold">Approx. Tokens</p>
            <p className="text-base font-bold text-white mt-0.5">~{usage.approxTokens.toLocaleString()}</p>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={handleResetUsage}
            disabled={resettingUsage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#424242] bg-[#242424] hover:bg-[#353535] text-xs font-medium text-white transition-colors cursor-pointer"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${resettingUsage ? 'animate-spin' : ''}`} />
            <span>Reset Demo Usage Counter</span>
          </button>
        </div>
      </div>

      {/* 2. Model Configuration */}
      <div className="rounded-xl border border-[#424242] bg-[#2F2F2F] p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#10A37F]" />
          <h3 className="text-sm font-semibold text-white">Gemini Model Configuration</h3>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div
              onClick={() => onChangeModel('gemini-3.1-flash-lite')}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                activeModel === 'gemini-3.1-flash-lite'
                  ? 'border-[#10A37F] bg-[#10A37F]/10'
                  : 'border-[#3A3A3A] bg-[#242424] hover:bg-[#2C2C2C]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Gemini 3.1 Flash-Lite</span>
                <span className="text-[10px] bg-[#10A37F]/20 text-[#10A37F] px-1.5 py-0.5 rounded font-semibold">
                  Default (Recommended)
                </span>
              </div>
              <p className="text-[11px] text-[#ACACAC] mt-1.5 leading-relaxed">
                Lowest operating cost, near-instant sub-second responses, ideal for high throughput and daily workspace tasks.
              </p>
            </div>

            <div
              onClick={() => onChangeModel('gemini-3.8-flash')}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                activeModel === 'gemini-3.8-flash'
                  ? 'border-[#10A37F] bg-[#10A37F]/10'
                  : 'border-[#3A3A3A] bg-[#242424] hover:bg-[#2C2C2C]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Gemini 3.8 Flash</span>
                <span className="text-[10px] bg-sky-500/20 text-sky-400 px-1.5 py-0.5 rounded font-semibold">
                  Extended Reasoning
                </span>
              </div>
              <p className="text-[11px] text-[#ACACAC] mt-1.5 leading-relaxed">
                Stronger multi-modal synthesis and deep code review, slightly higher token consumption.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Theme & Appearance */}
      <div className="rounded-xl border border-[#424242] bg-[#2F2F2F] p-5 space-y-4">
        <h3 className="text-sm font-semibold text-white">Appearance & Interface Theme</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-white">Current Interface Palette</p>
            <p className="text-[11px] text-[#ACACAC]">
              ChatGPT-inspired dark aesthetic with teal-green accent (#10A37F).
            </p>
          </div>
          <button
            onClick={onToggleTheme}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#424242] bg-[#242424] hover:bg-[#353535] text-xs font-medium text-white transition-colors cursor-pointer"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            <span>{theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}</span>
          </button>
        </div>
      </div>

      {/* 4. Privacy & Local Data */}
      <div className="rounded-xl border border-[#424242] bg-[#2F2F2F] p-5 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#10A37F]" />
          <h3 className="text-sm font-semibold text-white">Storage Transparency & Privacy</h3>
        </div>

        <p className="text-xs text-[#ACACAC] leading-relaxed">
          NEXORA AI stores tasks and chat transcripts locally in your browser's <code className="text-white">localStorage</code>.
          Server-side API calls are strictly stateless: no conversations or document contents are saved to external databases
          without your command. API keys are completely shielded on the server and never exposed in client bundles.
        </p>

        <div className="pt-2 flex flex-wrap gap-2.5">
          <button
            onClick={onExportAllWorkspaceData}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#242424] hover:bg-[#353535] border border-[#424242] text-xs font-medium text-white transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#10A37F]" />
            <span>Export Full Workspace Backup (JSON)</span>
          </button>

          <button
            onClick={onClearAllWorkspaceData}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-500/40 text-red-400 hover:bg-red-950/40 text-xs font-medium transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Local Workspace Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};
