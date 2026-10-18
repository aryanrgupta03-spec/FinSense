import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  Database,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  Layers,
  ArrowRight,
  User,
  ShieldCheck
} from 'lucide-react';

import { api } from '../services/api';
import { formatINR } from '../utils/formatters';
import { Badge } from '../components/Badge';

interface MessageItem {
  id?: number;
  sender: 'user' | 'copilot';
  content: string;
  tools_executed?: string[];
  citations?: Array<{ label: string; value: string; source: string }>;
  created_at?: string;
}

const QUICK_PROMPTS = [
  'Where did I overspend this month?',
  'What bills are due in the next 7 days?',
  'Can I reach my savings goal by December?',
  'Forecast my month-end closing balance',
  'What is my total consolidated liquid balance?'
];

export const FinancialCopilot: React.FC = () => {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);
  const [conversationId, setConversationId] = useState<number | undefined>(undefined);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial welcome message
    setMessages([
      {
        sender: 'copilot',
        content:
          "Hello Aryan! I am your **FinSense Financial Copilot**.\n\n" +
          "Unlike generic chat systems, I do **not** guess account figures or simulate balances. " +
          "Every numerical response is computed directly via safe backend tools querying your live financial ledger, Prolog rules, and ANFIS models.\n\n" +
          "Select a query below or ask anything about your finances!",
        tools_executed: ['system_boot'],
        citations: []
      }
    ]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || sending) return;

    const userMsg: MessageItem = { sender: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setSending(true);

    try {
      const res = await api.chatCopilot(text, conversationId);
      if (res.conversation_id) {
        setConversationId(res.conversation_id);
      }

      const copilotMsg: MessageItem = {
        sender: 'copilot',
        content: res.response,
        tools_executed: res.tools_executed,
        citations: res.citations
      };
      setMessages((prev) => [...prev, copilotMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'copilot',
          content: `Unable to process query: ${err.message || 'Network error'}`
        }
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-white flex items-center justify-center shadow-xs">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900">FinSense Grounded Assistant</span>
              <Badge variant="purple" size="sm">
                Safe Tool Routing
              </Badge>
            </div>
            <p className="text-[11px] text-slate-500">
              Zero numerical hallucination • Grounded on database ledger & AI engines
            </p>
          </div>
        </div>
      </div>

      {/* Message Thread */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((msg, idx) => {
          const isUser = msg.sender === 'user';

          return (
            <div
              key={idx}
              className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-semibold ${
                  isUser
                    ? 'bg-blue-600 text-white'
                    : 'bg-indigo-100 text-indigo-700'
                }`}
              >
                {isUser ? 'AG' : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`rounded-2xl p-4 text-xs space-y-2.5 ${
                  isUser
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-50 border border-slate-200/80 text-slate-800'
                }`}
              >
                {/* Text Content */}
                <div className="leading-relaxed whitespace-pre-wrap">
                  {msg.content}
                </div>

                {/* Grounding Metadata (Only on Copilot responses) */}
                {!isUser && msg.tools_executed && msg.tools_executed.length > 0 && (
                  <div className="pt-2 border-t border-slate-200/60 space-y-1.5 text-[11px]">
                    {/* Tools executed pill */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-slate-400 font-medium">Tools Verified:</span>
                      {msg.tools_executed.map((tool) => (
                        <span
                          key={tool}
                          className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-indigo-600 font-mono text-[10px]"
                        >
                          {tool}()
                        </span>
                      ))}
                    </div>

                    {/* Citations */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        <span className="text-slate-400 font-medium">Ledger Citations:</span>
                        {msg.citations.map((c, cIdx) => (
                          <span
                            key={cIdx}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold text-[10px]"
                          >
                            <Database className="w-3 h-3 text-emerald-600" />
                            {c.label}: {c.value}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {sending && (
          <div className="flex gap-3 max-w-xl">
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 shrink-0 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="rounded-2xl p-4 bg-slate-50 border border-slate-200/80 text-xs flex items-center gap-2 text-slate-500">
              <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <span>Routing intent and executing database tools...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Chips */}
      <div className="px-4 py-2 border-t border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar bg-slate-50/40">
        <span className="text-[11px] font-semibold text-slate-400 shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-indigo-500" />
          Suggested:
        </span>
        {QUICK_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => handleSendMessage(prompt)}
            disabled={sending}
            className="px-2.5 py-1 text-xs bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg whitespace-nowrap shrink-0 transition-colors disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-4 border-t border-slate-200 bg-white flex items-center gap-2"
      >
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Ask Copilot about overspending, upcoming bills, balance forecast, or goal advice..."
          disabled={sending}
          className="flex-1 text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        />

        <button
          type="submit"
          disabled={!inputMessage.trim() || sending}
          className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors disabled:opacity-40 shadow-xs shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
