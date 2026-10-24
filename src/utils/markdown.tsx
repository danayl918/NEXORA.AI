import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface MarkdownProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownProps> = ({ content }) => {
  if (!content) return null;

  // Split by code blocks
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-3 leading-relaxed text-[15px] break-words">
      {parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          // Code block
          const lines = part.slice(3, -3).trim().split('\n');
          let language = 'code';
          let code = '';
          if (lines[0] && !lines[0].includes(' ') && lines[0].length < 20) {
            language = lines[0].trim();
            code = lines.slice(1).join('\n');
          } else {
            code = lines.join('\n');
          }
          return <CodeBlock key={index} code={code} language={language} />;
        } else {
          // Regular text block
          return <TextBlock key={index} text={part} />;
        }
      })}
    </div>
  );
};

const CodeBlock: React.FC<{ code: string; language: string }> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-lg overflow-hidden border border-[#424242] bg-[#1E1E1E]">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#2A2A2A] text-xs text-[#ACACAC] border-b border-[#383838]">
        <span className="font-mono lowercase text-[#10A37F] font-medium">{language || 'text'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer text-xs"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-[#10A37F]" />
              <span className="text-[#10A37F]">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>
      <div className="p-3.5 overflow-x-auto text-[13.5px] font-mono leading-relaxed text-[#E6E6E6]">
        <pre className="m-0 whitespace-pre">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};

const TextBlock: React.FC<{ text: string }> = ({ text }) => {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let inList = false;
  let listItems: string[] = [];
  let isNumbered = false;

  const flushList = (keyPrefix: number) => {
    if (listItems.length > 0) {
      if (isNumbered) {
        elements.push(
          <ol key={`ol-${keyPrefix}`} className="list-decimal pl-6 space-y-1.5 my-2 text-inherit">
            {listItems.map((item, i) => (
              <li key={i}>{formatInline(item)}</li>
            ))}
          </ol>
        );
      } else {
        elements.push(
          <ul key={`ul-${keyPrefix}`} className="list-disc pl-5 space-y-1.5 my-2 text-inherit">
            {listItems.map((item, i) => (
              <li key={i}>{formatInline(item)}</li>
            ))}
          </ul>
        );
      }
      listItems = [];
      inList = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Headers
    if (trimmed.startsWith('### ')) {
      flushList(i);
      elements.push(
        <h3 key={i} className="text-base font-semibold text-white mt-3 mb-1">
          {formatInline(trimmed.slice(4))}
        </h3>
      );
      continue;
    }
    if (trimmed.startsWith('## ')) {
      flushList(i);
      elements.push(
        <h2 key={i} className="text-lg font-semibold text-white mt-4 mb-2">
          {formatInline(trimmed.slice(3))}
        </h2>
      );
      continue;
    }
    if (trimmed.startsWith('# ')) {
      flushList(i);
      elements.push(
        <h1 key={i} className="text-xl font-bold text-white mt-4 mb-2">
          {formatInline(trimmed.slice(2))}
        </h1>
      );
      continue;
    }

    // Unordered List
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (!inList) {
        inList = true;
        isNumbered = false;
      } else if (isNumbered) {
        flushList(i);
        inList = true;
        isNumbered = false;
      }
      listItems.push(trimmed.slice(2));
      continue;
    }

    // Numbered List (e.g. "1. ")
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      if (!inList) {
        inList = true;
        isNumbered = true;
      } else if (!isNumbered) {
        flushList(i);
        inList = true;
        isNumbered = true;
      }
      listItems.push(numMatch[2]);
      continue;
    }

    // Table row detection
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      flushList(i);
      // Collect table rows
      const tableRows = [trimmed];
      while (i + 1 < lines.length && lines[i + 1].trim().startsWith('|') && lines[i + 1].trim().endsWith('|')) {
        i++;
        tableRows.push(lines[i].trim());
      }
      elements.push(renderTable(tableRows, i));
      continue;
    }

    // Regular line
    flushList(i);

    if (trimmed === '') {
      // Empty line spacer
      elements.push(<div key={`sp-${i}`} className="h-1.5" />);
    } else {
      elements.push(
        <p key={i} className="my-1">
          {formatInline(trimmed)}
        </p>
      );
    }
  }

  flushList(lines.length);

  return <>{elements}</>;
};

function renderTable(rows: string[], key: number) {
  if (rows.length < 2) return null;
  const headerCols = rows[0]
    .split('|')
    .slice(1, -1)
    .map((c) => c.trim());
  const bodyRows = rows.slice(rows[1].includes('---') ? 2 : 1);

  return (
    <div key={key} className="overflow-x-auto my-3 border border-[#424242] rounded-lg">
      <table className="min-w-full text-xs text-left divide-y divide-[#424242]">
        <thead className="bg-[#2A2A2A] text-white">
          <tr>
            {headerCols.map((col, idx) => (
              <th key={idx} className="px-3.5 py-2 font-semibold">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#383838] bg-[#222222]">
          {bodyRows.map((r, rIdx) => {
            const cols = r
              .split('|')
              .slice(1, -1)
              .map((c) => c.trim());
            return (
              <tr key={rIdx} className="hover:bg-[#2A2A2A]/50">
                {cols.map((col, cIdx) => (
                  <td key={cIdx} className="px-3.5 py-2 text-[#ACACAC]">
                    {col}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function formatInline(text: string): React.ReactNode[] {
  // Regex parsing for bold (**text**), code (`code`), and link ([label](url))
  const tokens: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Bold
    const boldMatch = remaining.match(/^([\s\S]*?)\*\*(.+?)\*\*([\s\S]*)$/);
    // Inline code
    const codeMatch = remaining.match(/^([\s\S]*?)`([^`]+)`([\s\S]*)$/);

    if (boldMatch && (!codeMatch || boldMatch[1].length <= codeMatch[1].length)) {
      if (boldMatch[1]) {
        tokens.push(boldMatch[1]);
      }
      tokens.push(
        <strong key={key++} className="font-semibold text-white">
          {boldMatch[2]}
        </strong>
      );
      remaining = boldMatch[3];
    } else if (codeMatch) {
      if (codeMatch[1]) {
        tokens.push(codeMatch[1]);
      }
      tokens.push(
        <code
          key={key++}
          className="px-1.5 py-0.5 rounded text-[13px] font-mono bg-[#383838] text-[#10A37F] border border-[#4A4A4A]"
        >
          {codeMatch[2]}
        </code>
      );
      remaining = codeMatch[3];
    } else {
      tokens.push(remaining);
      break;
    }
  }

  return tokens;
}
