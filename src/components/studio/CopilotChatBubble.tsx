'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  MessageSquare,
  X,
  Send,
  Loader2,
  ChevronDown,
  Minimize2,
  Maximize2,
  Bot,
  User,
  Zap,
  TrendingUp,
  Shield,
  Lightbulb,
  DollarSign,
  Copy,
  Check,
} from 'lucide-react';
import { WorkspaceMeta, Respondent, EvidenceQuote, CompetitorWorkaround, Hypothesis } from '@/lib/domain/empirical-types';

interface CopilotChatBubbleProps {
  meta?: WorkspaceMeta;
  respondents?: Respondent[];
  quotes?: EvidenceQuote[];
  competitors?: CompetitorWorkaround[];
  hypotheses?: Hypothesis[];
  onOpenRespondent?: (respondent: Respondent) => void;
  onShowToast?: (title: string, desc?: string, type?: 'success' | 'error' | 'info') => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  suggestedAction?: string;
}

export const CopilotChatBubble: React.FC<CopilotChatBubbleProps> = ({
  meta = {
    name: 'Validation Workspace',
    tagline: 'Continuous validation pipeline',
    overallValidationScore: 84,
    unpromptedPainMentionRate: 78,
    willingnessToPayAvg: 149,
    totalRespondents: 142,
    targetMarket: 'B2B Technical Leaders',
    validationStage: 'discovery',
    lastUpdated: 'Just now',
  },
  respondents = [],
  quotes = [],
  competitors = [],
  hypotheses = [],
  onOpenRespondent,
  onShowToast,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const workspaceName = meta?.name || 'Validation Workspace';
  const validationScore = meta?.overallValidationScore ?? 84;
  const painRate = meta?.unpromptedPainMentionRate ?? 78;
  const totalCount = respondents.length || meta?.totalRespondents || 0;

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'assistant',
      text: `Hello! I am your BRAINS Validation Copilot. I have real-time empirical context on **${workspaceName}** across ${totalCount} respondents, unprompted pain mentions (${painRate}%), and ${competitors.length} competitors. How can I assist with your customer discovery strategy today?`,
      timestamp: 'Just now',
    },
  ]);

  const quickPrompts = [
    { label: 'Audit Validation Data', prompt: 'Audit our current validation data. What are our strongest empirical signals and top risks?' },
    { label: 'Suggest Discovery Questions', prompt: 'Give me 3 Mom-Test compliant questions to ask in our next interview round.' },
    { label: 'Analyze Pricing Elasticity', prompt: 'Analyze our Van Westendorp pricing sensitivity and recommend an initial pricing tier.' },
    { label: 'Competitor Wedge Gaps', prompt: 'What are the main workaround gaps we can exploit against incumbents?' },
  ];

  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized]);

  const handleSendMessage = async (textToSend?: string) => {
    const messageText = textToSend || input;
    if (!messageText.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: messageText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/copilot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          context: {
            name: workspaceName,
            tagline: meta?.tagline || '',
            score: validationScore,
            painRate: painRate,
            avgWtp: meta?.willingnessToPayAvg ?? 149,
            totalRespondents: totalCount,
            targetMarket: meta?.targetMarket || 'B2B',
            competitors: competitors.map((c) => c.name),
            topQuotes: quotes.slice(0, 4).map((q) => q.text),
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMsg: ChatMessage = {
          id: `asst-${Date.now()}`,
          sender: 'assistant',
          text: data.reply || 'Analysis complete.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        throw new Error('Endpoint error');
      }
    } catch (err) {
      console.warn('Copilot chat fallback', err);
      // Heuristic fallback response
      let fallbackText = `Based on your empirical validation data for **${workspaceName}**: \n\n• **Problem Signal**: ${painRate}% unprompted pain mention rate indicates strong resonance.\n• **Pricing**: Mean willingness to pay is $${meta?.willingnessToPayAvg ?? 149}/month.\n• **Actionable Advice**: Focus on developer-first onboarding without requiring full database read permissions to shorten enterprise sales friction.`;
      if (messageText.toLowerCase().includes('question') || messageText.toLowerCase().includes('mom test')) {
        fallbackText = `Here are 3 Mom-Test compliant questions for your next discovery call:\n1. *"Can you walk me through the last time your team prepared compliance evidence? What took the most engineering hours?"*\n2. *"What specific tools or scripts did you try building internally to solve this, and why did they fall short?"*\n3. *"What budget line item did you pay for your last security audit or penetration test?"*`;
      }

      const assistantMsg: ChatMessage = {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        text: fallbackText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <aside aria-label="Validation Copilot Chat" className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
      {/* Floating Modal Window */}
      {isOpen && (
        <div
          id="copilot-chat-modal"
          role="dialog"
          aria-label="AI Validation Copilot Chat"
          className={`bg-slate-900 border border-slate-700/80 shadow-2xl rounded-2xl overflow-hidden transition-all duration-300 mb-3 flex flex-col text-slate-100 ${
            isMinimized
              ? 'w-80 h-14'
              : 'w-[400px] max-w-[calc(100vw-2.5rem)] h-[560px] max-h-[calc(100vh-6rem)]'
          }`}
        >
          {/* Header */}
          <header className="px-4 py-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-600/90 text-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-4 h-4 text-indigo-200" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  AI Validation Copilot
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                </h3>
                <p className="text-[10px] text-slate-400">Contextual to {meta.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title={isMinimized ? 'Expand' : 'Minimize'}
                aria-label={isMinimized ? 'Expand Copilot' : 'Minimize Copilot'}
              >
                {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title="Close"
                aria-label="Close Copilot"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </header>

          {/* Body content when not minimized */}
          {!isMinimized && (
            <>
              {/* Message History */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {m.sender === 'assistant' && (
                      <div className="w-6 h-6 rounded-full bg-indigo-950 border border-indigo-700/60 text-indigo-300 flex items-center justify-center shrink-0 mt-0.5">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed relative group ${
                        m.sender === 'user'
                          ? 'bg-indigo-600 text-white rounded-br-xs'
                          : 'bg-slate-800/90 text-slate-200 border border-slate-700/70 rounded-bl-xs'
                      }`}
                    >
                      <div className="whitespace-pre-line">{m.text}</div>
                      <div className="flex items-center justify-between mt-1 text-[9px] text-slate-400">
                        <span>{m.timestamp}</span>
                        {m.sender === 'assistant' && (
                          <button
                            onClick={() => handleCopy(m.id, m.text)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-white"
                            title="Copy response"
                          >
                            {copiedId === m.id ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                    {m.sender === 'user' && (
                      <div className="w-6 h-6 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                        <User className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-2 items-center text-slate-400 text-xs pl-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                    <span>Analyzing empirical signals...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompts Chips */}
              <div className="px-3 py-2 bg-slate-950/40 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {quickPrompts.map((qp, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(qp.prompt)}
                    disabled={isLoading}
                    className="px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors border border-slate-700/60 disabled:opacity-50 cursor-pointer"
                  >
                    {qp.label}
                  </button>
                ))}
              </div>

              {/* Input Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="p-3 bg-slate-950/90 border-t border-slate-800 flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="Ask copilot about discovery, evidence, or pricing..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isLoading}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl transition-all shrink-0 cursor-pointer shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </>
          )}
        </div>
      )}

      {/* Floating Chat Bubble Button */}
      {!isOpen && (
        <button
          id="open-copilot-chat-bubble"
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all duration-200 cursor-pointer active:scale-95"
          aria-label="Open AI Copilot Chat"
        >
          <div className="relative">
            <Sparkles className="w-5 h-5 text-indigo-200 transition-transform group-hover:scale-110" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-indigo-600 animate-pulse" />
          </div>
          <span className="text-xs font-bold tracking-wide">AI Copilot</span>
          <span className="text-[10px] bg-indigo-700/80 px-2 py-0.5 rounded-full font-medium text-indigo-100 hidden sm:inline-block">
            {validationScore}/100 Score
          </span>
        </button>
      )}
    </aside>
  );
};
