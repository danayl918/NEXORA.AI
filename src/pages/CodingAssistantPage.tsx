import React, { useState } from 'react';
import {
  Code,
  Bug,
  BookOpen,
  Wand2,
  ShieldAlert,
  Copy,
  Check,
  Play,
  RotateCcw,
  Sparkles,
  Terminal,
  AlertCircle,
} from 'lucide-react';
import { MarkdownRenderer } from '../utils/markdown';

interface CodingAssistantPageProps {
  onLogActivity: (title: string, detail?: string) => void;
}

const PRESET_SNIPPETS = [
  {
    title: 'React Async Cleanup Bug',
    language: 'typescript',
    mode: 'debug',
    prompt: 'Check for memory leak and race condition on component unmount.',
    code: `import { useEffect, useState } from "react";

export function UserProfile({ userId }: { userId: string }) {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch(\`/api/users/\${userId}\`)
      .then((res) => res.json())
      .then((json) => {
        setData(json);
      });
  }, [userId]);

  return <div>{data?.name || "Loading..."}</div>;
}`,
  },
  {
    title: 'Binary Search Off-by-One',
    language: 'python',
    mode: 'explain',
    prompt: 'Explain how binary search works on a sorted array.',
    code: `def binary_search(arr, target):
    low = 0
    high = len(arr) - 1
    
    while low <= high:
        mid = (low + high) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
            
    return -1`,
  },
  {
    title: 'SQL Injection Vulnerability',
    language: 'javascript',
    mode: 'review',
    prompt: 'Review for security vulnerabilities and injection risks.',
    code: `async function findUser(req, res) {
  const { username, password } = req.body;
  const query = "SELECT * FROM users WHERE username = '" + username + "' AND password = '" + password + "'";
  const results = await db.raw(query);
  return res.json(results);
}`,
  },
];

export const CodingAssistantPage: React.FC<CodingAssistantPageProps> = ({ onLogActivity }) => {
  const [language, setLanguage] = useState('typescript');
  const [mode, setMode] = useState<'explain' | 'debug' | 'refactor' | 'generate' | 'review'>('debug');
  const [code, setCode] = useState(PRESET_SNIPPETS[0].code);
  const [prompt, setPrompt] = useState(PRESET_SNIPPETS[0].prompt);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const languages = [
    'typescript',
    'javascript',
    'python',
    'go',
    'rust',
    'sql',
    'java',
    'cpp',
    'html',
    'bash',
  ];

  const modes = [
    { id: 'explain', label: 'Explain Code', icon: BookOpen, desc: 'Step-by-step beginner breakdown' },
    { id: 'debug', label: 'Debug & Fix', icon: Bug, desc: 'Identify flaws and suggested fixes' },
    { id: 'refactor', label: 'Refactor Code', icon: RotateCcw, desc: 'Modernize and improve structure' },
    { id: 'generate', label: 'Generate Code', icon: Wand2, desc: 'Generate solution from prompt' },
    { id: 'review', label: 'Code Review', icon: ShieldAlert, desc: 'Security, complexity & best practices' },
  ];

  const handleRun = async () => {
    if (!code.trim() && mode !== 'generate') {
      setErrorMsg('Please paste or type a code snippet to analyze.');
      return;
    }
    if (mode === 'generate' && !prompt.trim()) {
      setErrorMsg('Please enter a description of the code you want to generate.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/code-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language,
          mode,
          prompt,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      setResult(data.result);
      onLogActivity('Coding Assistant', `${mode.toUpperCase()} on ${language}`);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to process code request.');
    } finally {
      setIsProcessing(false);
    }
  };

  const loadPreset = (preset: typeof PRESET_SNIPPETS[0]) => {
    setCode(preset.code);
    setLanguage(preset.language);
    setMode(preset.mode as any);
    setPrompt(preset.prompt);
    setResult(null);
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="border-b border-[#383838] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Code className="w-5 h-5 text-[#10A37F]" />
            Coding Assistant & Code Review
          </h2>
          <p className="text-xs text-[#ACACAC] mt-1">
            Explain, debug, modernize, and review code with Gemini Flash Lite.
          </p>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[#8E8E8E] hidden md:inline">Sample Presets:</span>
          {PRESET_SNIPPETS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => loadPreset(p)}
              className="text-[11px] px-2.5 py-1 rounded bg-[#2A2A2A] hover:bg-[#353535] border border-[#424242] text-[#ACACAC] hover:text-white transition-colors cursor-pointer"
            >
              {p.title}
            </button>
          ))}
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/60 text-red-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Mode Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {modes.map((m) => {
          const Icon = m.icon;
          const isActive = mode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setMode(m.id as any)}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                isActive
                  ? 'border-[#10A37F] bg-[#10A37F]/10 text-white shadow-sm'
                  : 'border-[#383838] bg-[#262626] text-[#ACACAC] hover:bg-[#2E2E2E] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#10A37F]' : 'text-[#8E8E8E]'}`} />
                <span className="text-xs font-semibold">{m.label}</span>
              </div>
              <p className="text-[10px] text-[#7E7E7E] mt-1 line-clamp-1">{m.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Editor & Controls */}
      <div className="rounded-xl border border-[#424242] bg-[#2F2F2F] p-4 sm:p-5 space-y-4">
        {/* Language & Instructions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#ACACAC] font-medium">Language:</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-[#242424] border border-[#424242] text-xs text-white rounded-lg px-2.5 py-1.5 focus:border-[#10A37F] focus:outline-none"
            >
              {languages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div className="text-xs text-[#8E8E8E] flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-[#10A37F]" />
            <span>Static Code Analysis • No execution sandbox claims</span>
          </div>
        </div>

        {/* Code Input */}
        {mode !== 'generate' && (
          <div className="space-y-1">
            <label className="text-xs text-[#ACACAC] font-medium block">
              Source Code ({language}):
            </label>
            <div className="relative rounded-lg overflow-hidden border border-[#424242] bg-[#1E1E1E]">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                rows={12}
                placeholder={`// Paste your ${language} code here...`}
                className="w-full p-3.5 bg-transparent text-white font-mono text-[13px] leading-relaxed resize-y focus:outline-none placeholder-[#6E6E6E]"
                spellCheck={false}
              />
            </div>
          </div>
        )}

        {/* Optional or Required Prompt Notes */}
        <div className="space-y-1">
          <label className="text-xs text-[#ACACAC] font-medium block">
            {mode === 'generate' ? 'What code would you like to generate?' : 'Specific instructions or context (optional):'}
          </label>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={
              mode === 'generate'
                ? 'e.g. A TypeScript utility function to debounce async functions with cancellation token'
                : 'e.g. Focus on concurrency safety and edge cases'
            }
            className="w-full bg-[#202020] border border-[#424242] focus:border-[#10A37F] text-xs text-white rounded-lg px-3 py-2.5 focus:outline-none"
          />
        </div>

        {/* Run Button */}
        <div className="flex justify-end pt-1">
          <button
            onClick={handleRun}
            disabled={isProcessing}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#10A37F] hover:bg-[#1A7F64] disabled:opacity-50 text-white text-xs font-semibold transition-all shadow-sm cursor-pointer"
          >
            {isProcessing ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Processing Code...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Run {modes.find((m) => m.id === mode)?.label}</span>
              </>
            )}
          </button>
        </div>

        {/* Result Area */}
        {result && (
          <div className="pt-4 border-t border-[#383838] space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#10A37F] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Assistant Output
              </span>

              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-xs text-[#ACACAC] hover:text-white transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#10A37F]" />
                    <span className="text-[#10A37F]">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Response</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-4 rounded-xl bg-[#222222] border border-[#383838]">
              <MarkdownRenderer content={result} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
