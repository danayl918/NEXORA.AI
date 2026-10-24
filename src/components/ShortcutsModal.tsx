import React from 'react';
import { Keyboard, X } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcutGroups = [
    {
      group: 'General & Actions',
      items: [
        { label: 'Open Command Palette & Search', key: 'Ctrl + K' },
        { label: 'Start New Conversation', key: 'Ctrl + N' },
        { label: 'Toggle Sidebar Collapse', key: 'Ctrl + B' },
        { label: 'Toggle Dark / Light Theme', key: 'Ctrl + Shift + L' },
        { label: 'Open Shortcuts Cheat Sheet', key: 'Ctrl + / or ?' },
        { label: 'Close Active Modal / Palette', key: 'Escape' },
      ],
    },
    {
      group: 'Direct Navigation',
      items: [
        { label: 'Workspace Dashboard', key: 'Ctrl + 1' },
        { label: 'AI Chat Agent', key: 'Ctrl + 2' },
        { label: 'Document Assistant', key: 'Ctrl + 3' },
        { label: 'Coding Assistant', key: 'Ctrl + 4' },
        { label: 'Task Planner', key: 'Ctrl + 5' },
        { label: 'Conversation Archive', key: 'Ctrl + 6' },
        { label: 'Settings & Quota', key: 'Ctrl + 7' },
        { label: 'About NEXORA AI', key: 'Ctrl + 8' },
      ],
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-[#424242] bg-[#242424] p-6 shadow-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#383838] pb-3">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-[#10A37F]" />
            <h3 className="text-base font-bold text-white">Keyboard Shortcuts</h3>
          </div>
          <button onClick={onClose} className="text-[#8E8E8E] hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
          {shortcutGroups.map((grp, gIdx) => (
            <div key={gIdx} className="space-y-2">
              <h4 className="text-[11px] font-semibold text-[#10A37F] uppercase tracking-wider">
                {grp.group}
              </h4>
              <div className="rounded-xl border border-[#3A3A3A] bg-[#2A2A2A] divide-y divide-[#353535]">
                {grp.items.map((item, iIdx) => (
                  <div key={iIdx} className="flex items-center justify-between px-3.5 py-2.5 text-xs">
                    <span className="text-[#CCCCCC]">{item.label}</span>
                    <kbd className="px-2 py-0.5 rounded font-mono text-[11px] bg-[#1E1E1E] text-white border border-[#444] shadow-xs">
                      {item.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-2 text-center text-[11px] text-[#7E7E7E]">
          <span>Tip: On macOS, substitute <kbd className="font-mono text-white">Cmd</kbd> for <kbd className="font-mono text-white">Ctrl</kbd>.</span>
        </div>
      </div>
    </div>
  );
};
