import React, { useState } from 'react';
import {
  FileText,
  Upload,
  Trash2,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  Copy,
  Check,
  AlertTriangle,
  Send,
  Eye,
  FileCheck,
  ArrowRight,
} from 'lucide-react';
import { DocumentItem } from '../types';
import { MarkdownRenderer } from '../utils/markdown';
import { NavPage } from '../components/Sidebar';

interface DocumentsPageProps {
  documents: DocumentItem[];
  onSaveDocuments: (docs: DocumentItem[]) => void;
  onSendToChat: (doc: DocumentItem) => void;
  onNavigate: (page: NavPage) => void;
  onLogActivity: (title: string, detail?: string) => void;
}

export const DocumentsPage: React.FC<DocumentsPageProps> = ({
  documents,
  onSaveDocuments,
  onSendToChat,
  onNavigate,
  onLogActivity,
}) => {
  const [selectedDocId, setSelectedDocId] = useState<string | null>(
    documents[0]?.id || null
  );
  const [analysisType, setAnalysisType] = useState<
    'summary' | 'action_items' | 'critique' | 'qa'
  >('summary');
  const [customQuery, setCustomQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const activeDoc = documents.find((d) => d.id === selectedDocId) || null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: max 10MB
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('File exceeds 10MB limit. Please upload a smaller document.');
      return;
    }

    const reader = new FileReader();

    if (file.type === 'application/pdf') {
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        const newDoc: DocumentItem = {
          id: 'doc_' + Date.now().toString(36),
          name: file.name,
          mimeType: 'application/pdf',
          size: file.size,
          base64,
          uploadedAt: new Date().toISOString(),
        };
        const updated = [newDoc, ...documents];
        onSaveDocuments(updated);
        setSelectedDocId(newDoc.id);
        setErrorMsg(null);
        onLogActivity('Uploaded Document', file.name);
      };
      reader.readAsDataURL(file);
    } else {
      reader.onload = () => {
        const text = reader.result as string;
        const newDoc: DocumentItem = {
          id: 'doc_' + Date.now().toString(36),
          name: file.name,
          mimeType: file.type || 'text/plain',
          size: file.size,
          text,
          uploadedAt: new Date().toISOString(),
        };
        const updated = [newDoc, ...documents];
        onSaveDocuments(updated);
        setSelectedDocId(newDoc.id);
        setErrorMsg(null);
        onLogActivity('Uploaded Document', file.name);
      };
      reader.readAsText(file);
    }
  };

  const handleRunAnalysis = async () => {
    if (!activeDoc) {
      setErrorMsg('Please select or upload a document first.');
      return;
    }

    if (analysisType === 'qa' && !customQuery.trim()) {
      setErrorMsg('Please enter a specific question for Document Q&A.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/analyze-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document: {
            name: activeDoc.name,
            mimeType: activeDoc.mimeType,
            text: activeDoc.text,
            base64: activeDoc.base64,
          },
          analysisType,
          query: customQuery,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Failed with status ${response.status}`);
      }

      const data = await response.json();
      setAnalysisResult(data.result);

      // Save analysis to document history
      const updatedDocs = documents.map((d) =>
        d.id === activeDoc.id
          ? { ...d, lastAnalysis: data.result, analysisType }
          : d
      );
      onSaveDocuments(updatedDocs);
      onLogActivity('Analyzed Document', `${activeDoc.name} (${analysisType})`);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'An error occurred during analysis.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDeleteDoc = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = documents.filter((d) => d.id !== id);
    onSaveDocuments(updated);
    if (selectedDocId === id) {
      setSelectedDocId(updated[0]?.id || null);
      setAnalysisResult(null);
    }
  };

  const handleCopy = () => {
    if (analysisResult) {
      navigator.clipboard.writeText(analysisResult);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#383838] pb-5">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#10A37F]" />
            Document Assistant
          </h2>
          <p className="text-xs text-[#ACACAC] mt-1">
            Analyze, summarize, and extract actionable insights from PDF, TXT, MD, and CSV files.
          </p>
        </div>

        {/* Upload Trigger Button */}
        <div>
          <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#10A37F] hover:bg-[#1A7F64] text-white text-xs font-semibold cursor-pointer shadow-sm transition-colors">
            <Upload className="w-4 h-4" />
            <span>Upload Document</span>
            <input
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              accept=".txt,.pdf,.md,.json,.csv,.js,.ts"
            />
          </label>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/60 text-red-200 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Grid: Document List & Analysis Workplace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Uploaded Documents */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#ACACAC]">
              Workspace Files ({documents.length})
            </h3>
          </div>

          {documents.length === 0 ? (
            <div className="p-8 border border-dashed border-[#424242] rounded-xl text-center space-y-3 bg-[#242424]/50">
              <Upload className="w-8 h-8 text-[#7E7E7E] mx-auto" />
              <p className="text-xs text-[#ACACAC]">No documents loaded yet.</p>
              <label className="inline-block text-xs text-[#10A37F] hover:underline cursor-pointer font-medium">
                Choose a PDF or text file
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".txt,.pdf,.md,.json,.csv"
                />
              </label>
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {documents.map((doc) => {
                const isSelected = doc.id === selectedDocId;
                return (
                  <div
                    key={doc.id}
                    onClick={() => {
                      setSelectedDocId(doc.id);
                      setAnalysisResult(doc.lastAnalysis || null);
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#10A37F] bg-[#2F2F2F] text-white shadow-sm'
                        : 'border-[#383838] bg-[#262626] text-[#ACACAC] hover:bg-[#2C2C2C] hover:text-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 truncate">
                        <FileCheck className="w-4 h-4 text-[#10A37F] shrink-0" />
                        <span className="text-xs font-medium truncate">{doc.name}</span>
                      </div>
                      <button
                        onClick={(e) => handleDeleteDoc(doc.id, e)}
                        className="p-1 text-[#7E7E7E] hover:text-red-400 transition-colors"
                        title="Delete file"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-[#7E7E7E] mt-2 pt-1.5 border-t border-[#383838]">
                      <span>{Math.round(doc.size / 1024)} KB</span>
                      <span>
                        {new Date(doc.uploadedAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeDoc && (
            <div className="pt-2">
              <button
                onClick={() => onSendToChat(activeDoc)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-[#424242] bg-[#2A2A2A] hover:bg-[#333333] hover:border-[#10A37F] text-xs font-medium text-white transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 text-[#10A37F]" />
                <span>Discuss with Chat Agent</span>
              </button>
            </div>
          )}
        </div>

        {/* Right 2 Columns: Analysis Workspace */}
        <div className="lg:col-span-2 space-y-4">
          {activeDoc ? (
            <div className="rounded-xl border border-[#424242] bg-[#2F2F2F] p-5 space-y-4">
              {/* Active Document Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#383838]">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white text-sm truncate max-w-sm">
                    {activeDoc.name}
                  </span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#10A37F]/15 text-[#10A37F] border border-[#10A37F]/30">
                    {activeDoc.mimeType.split('/')[1] || 'doc'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {activeDoc.text && (
                    <button
                      onClick={() => setShowPreview(!showPreview)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#242424] hover:bg-[#383838] text-xs text-[#ACACAC] hover:text-white border border-[#424242] transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{showPreview ? 'Hide Text' : 'Preview Text'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Text Preview Drawer if text document */}
              {showPreview && activeDoc.text && (
                <div className="p-3 rounded-lg bg-[#1F1F1F] border border-[#383838] max-h-48 overflow-y-auto text-xs font-mono text-[#CCCCCC] whitespace-pre-wrap">
                  {activeDoc.text.slice(0, 3000)}
                  {activeDoc.text.length > 3000 && '... [Preview truncated]'}
                </div>
              )}

              {/* Analysis Type Selectors */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#ACACAC] block uppercase tracking-wider">
                  Select Analysis Mode:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'summary', label: 'Executive Summary' },
                    { id: 'action_items', label: 'Action Items' },
                    { id: 'critique', label: 'Critical Review' },
                    { id: 'qa', label: 'Targeted Q&A' },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => setAnalysisType(mode.id as any)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium border text-center transition-all cursor-pointer ${
                        analysisType === mode.id
                          ? 'border-[#10A37F] bg-[#10A37F]/15 text-white font-semibold'
                          : 'border-[#3D3D3D] bg-[#262626] text-[#ACACAC] hover:bg-[#303030] hover:text-white'
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom question input for Q&A */}
              {analysisType === 'qa' && (
                <div className="space-y-1.5 animate-in fade-in">
                  <label className="text-xs font-medium text-white block">
                    What specific question do you want answered from this document?
                  </label>
                  <input
                    type="text"
                    value={customQuery}
                    onChange={(e) => setCustomQuery(e.target.value)}
                    placeholder="e.g. What are the key deliverables and SLA requirements?"
                    className="w-full bg-[#202020] border border-[#424242] focus:border-[#10A37F] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              )}

              {/* Run Button */}
              <div className="flex justify-end pt-1">
                <button
                  onClick={handleRunAnalysis}
                  disabled={isAnalyzing}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#10A37F] hover:bg-[#1A7F64] disabled:opacity-50 text-white text-xs font-semibold transition-all shadow-sm cursor-pointer"
                >
                  {isAnalyzing ? (
                    <>
                      <Sparkles className="w-3.5 h-3.5 animate-spin" />
                      <span>Analyzing with Gemini Flash-Lite...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Execute Document Analysis</span>
                    </>
                  )}
                </button>
              </div>

              {/* Output Result Container */}
              {analysisResult && (
                <div className="pt-4 border-t border-[#383838] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#10A37F] flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      Analysis Output
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
                          <span>Copy Report</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="p-4 rounded-xl bg-[#222222] border border-[#383838]">
                    <MarkdownRenderer content={analysisResult} />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-[#424242] bg-[#2F2F2F] p-12 text-center text-[#8E8E8E] space-y-2">
              <FileText className="w-8 h-8 mx-auto text-[#7E7E7E]" />
              <p className="text-sm text-white font-medium">Select a document to begin</p>
              <p className="text-xs text-[#ACACAC]">
                Upload or click a file on the left to run comprehensive summaries or Q&A.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
