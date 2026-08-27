"use client";
import React, { useState } from 'react';
import { AiChatMessage, Respondent } from '../types';
import { Sparkles, Send, Bot, User, Quote, ArrowRight, ShieldCheck } from 'lucide-react';

interface AiAssistantTabProps {
  respondents: Respondent[];
  onOpenRespondent: (respondent: Respondent) => void;
  onShowToast: (title: string, desc?: string) => void;
}

export const AiAssistantTab: React.FC<AiAssistantTabProps> = ({
  respondents,
  onOpenRespondent,
  onShowToast,
}) => {
  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'assistant',
      content:
        'Hello! I am your NexaBrains Evidence Copilot. I have indexed this workspace\'s respondent transcripts, extracted quotes, hypotheses and research.\n\nAsk me anything about objections, willingness to pay, current workarounds, or what the evidence supports.',
      timestamp: 'Just now',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const suggestedPrompts = [
    'What are the top pricing objections raised by technical buyers?',
    'Why do engineering teams refuse legacy enterprise tools?',
    'What features are non-negotiable for Series A startups?',
    'Draft an executive validation summary for investors.',
  ];

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || inputText;
    if (!textToSend.trim()) return;

    const userMsg: AiChatMessage = {
      id: `usr-${crypto.randomUUID()}`,
      sender: 'user',
      content: textToSend,
      timestamp: 'Just now',
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInputText('');
    setIsTyping(true);

    try {
      // Streamlined context payload of respondents
      const respondentsContext = respondents.slice(0, 8).map((r) => ({
        id: r.id,
        name: r.name,
        role: r.role,
        company: r.company,
        willingnessToPay: r.willingnessToPay,
        keyQuote: r.keyQuote,
        painSeverity: r.painSeverity,
        tools: r.currentTools,
        fullTranscript: r.fullTranscript,
      }));

      const res = await fetch('/api/copilot/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: textToSend,
          respondentsContext,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const assistantMsg: AiChatMessage = {
          id: `ai-${crypto.randomUUID()}`,
          sender: 'assistant',
          content: data.content || 'Evidence synthesis completed.',
          timestamp: 'Just now',
          citations: data.citations || [],
        };
        setMessages((prev) => [...prev, assistantMsg]);
        setIsTyping(false);
        return;
      }
    } catch (err) {
      console.warn('Backend copilot query failed', err);
    }

    // The copilot only answers from real workspace evidence; if the backend
    // cannot run we say so instead of synthesizing a plausible answer.
    const assistantMsg: AiChatMessage = {
      id: `ai-${Date.now()}`,
      sender: 'assistant',
      content:
        'I could not reach the evidence synthesis service just now, so I would rather not guess. Please try the question again in a moment.',
      timestamp: 'Just now',
    };
    setMessages((prev) => [...prev, assistantMsg]);
    setIsTyping(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              NexaBrains AI Evidence Copilot
            </h2>
            <p className="text-xs text-slate-500">
              Conversational queries across this workspace&apos;s {respondents.length} respondent
              transcript{respondents.length === 1 ? '' : 's'}, answered with citations.
            </p>
          </div>
        </div>

        {/* Suggested prompts */}
        <div className="pt-4 mt-4 border-t border-slate-200 flex flex-wrap gap-2">
          {suggestedPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(prompt)}
              className="px-3 py-1.5 bg-slate-50 hover:bg-indigo-600-subtle hover:text-indigo-700 hover:border-indigo-200 border border-slate-200 rounded-xl text-xs font-semibold text-slate-500 transition-all text-left cursor-pointer"
            >
              &ldquo;{prompt}&rdquo;
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 flex flex-col h-[520px]">
        <div className="flex-1 overflow-y-auto space-y-5 pr-2 no-scrollbar">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 text-xs ${
                msg.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.sender === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-2xl rounded-2xl p-4 space-y-3 ${
                  msg.sender === 'user'
                    ? 'bg-white text-white rounded-tr-xs'
                    : 'bg-slate-50 text-slate-900 border border-slate-200 rounded-tl-xs'
                }`}
              >
                <div className="whitespace-pre-wrap leading-relaxed font-medium">
                  {msg.content}
                </div>

                {/* Citations block */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="pt-3 border-t border-slate-200 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Grounding Citations:
                    </span>
                    {msg.citations.map((c, i) => {
                      const resp = respondents.find((r) => r.id === c.sourceId);
                      return (
                        <div
                          key={i}
                          onClick={() => resp && onOpenRespondent(resp)}
                          className="p-2.5 bg-white rounded-lg border border-slate-200 hover:border-indigo-500/50 transition-all cursor-pointer group"
                        >
                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-900 group-hover:text-indigo-600 mb-1">
                            <span>{c.sourceName}</span>
                            <span className="text-[10px] text-indigo-600 flex items-center gap-0.5">
                              View full transcript →
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 italic">
                            &ldquo;{c.quote}&rdquo;
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-500 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3 text-xs justify-start">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-slate-50 text-slate-500 border border-slate-200 rounded-2xl p-4 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.4s]" />
                <span className="text-[11px] ml-1 font-medium">Scanning transcripts & citations...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="pt-4 mt-2 border-t border-slate-200 flex gap-2"
        >
          <input
            type="text"
            placeholder="Ask anything about founder quotes, pricing elasticity, or security objections..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-900 placeholder:text-slate-400"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-600-hover disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
