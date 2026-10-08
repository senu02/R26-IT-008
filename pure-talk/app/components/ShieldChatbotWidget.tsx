'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  User, 
  ShieldAlert, 
  ShieldCheck, 
  Sparkles, 
  X, 
  MessageSquare, 
  Copy, 
  Check, 
  RefreshCw,
  AlertCircle,
  Mic,
  MicOff,
  Volume2,
  VolumeX
} from 'lucide-react';
import { adaptiveShieldingAPI, type ShieldChatbotResponse } from '@/lib/api';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  data?: ShieldChatbotResponse;
  timestamp: string;
}

export default function ShieldChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Voice feature states
  const [isMuted, setIsMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'bot',
      text: "👋 Hi! I am your **AI Toxicity Detection Assistant**.\n\nI analyze messages against our trained toxic word dataset, detect offensive terms (English & Singlish), and provide instant non-toxic rewrites.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // ── Voice Output (Text-to-Speech) ──────────────────────────────────────────
  const speakText = (text: string, msgId: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    
    window.speechSynthesis.cancel(); // Stop any active speech

    if (speakingMsgId === msgId) {
      setSpeakingMsgId(null);
      return;
    }

    // Clean text of markdown symbols for clear natural voice reading
    const cleanText = text
      .replace(/[*_~`>#-]/g, '')
      .replace(/🌱|🧘|💡|🛡️|👁️‍🗨️|⛔|⚠️|✅|👋/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);

    setSpeakingMsgId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  // ── Voice Input (Speech-to-Text Microphone) ────────────────────────────────
  const toggleListening = () => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Voice input is not supported in this browser. Please try Google Chrome or Microsoft Edge.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };

      recognition.onerror = (err: any) => {
        console.error('Speech recognition error:', err);
        setIsListening(false);
      };

      recognition.onend = () => setIsListening(false);

      recognition.start();
    } catch (err) {
      console.error('Speech recognition failed to initialize:', err);
      setIsListening(false);
    }
  };

  // ── Send Message Handler ───────────────────────────────────────────────────
  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputMessage;
    if (!textToSend.trim() || loading) return;

    const userMsgId = `user-${Date.now()}`;
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newUserMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: textToSend,
      timestamp,
    };

    setMessages((prev) => [...prev, newUserMsg]);
    if (!customText) setInputMessage('');
    setLoading(true);

    try {
      const response = await adaptiveShieldingAPI.askChatbot(textToSend);
      const botMsgId = `bot-${Date.now()}`;
      
      const newBotMsg: ChatMessage = {
        id: botMsgId,
        sender: 'bot',
        text: response.bot_response,
        data: response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, newBotMsg]);

      // Automatically speak out ONLY the psychological suggestion if voice is not muted
      if (!isMuted && response.psychological_suggestion) {
        const psychologicalText = `${response.psychological_suggestion.title}. ${response.psychological_suggestion.reflection}. ${response.psychological_suggestion.coping_tip}. ${response.psychological_suggestion.benefit}`;
        speakText(psychologicalText, botMsgId);
      }
    } catch (err: any) {
      const errorMsgId = `err-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: errorMsgId,
          sender: 'bot',
          text: `⚠️ **Error:** ${err?.message || 'Failed to analyze message. Please check backend connection.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyRewrite = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const samplePrompts = [
    "You are such an idiot and stupid person",
    "Aney oya puka deepan ban",
    "I really hate this useless person",
    "Oya hari lassanai suba dawasak",
  ];

  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-[#fd297b] via-[#ff655b] to-[#ff5864] text-white font-bold shadow-2xl hover:scale-105 transition-all duration-300 group border border-white/20"
        >
          <div className="relative">
            <Bot className="w-6 h-6 animate-bounce" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-400 rounded-full ring-2 ring-slate-900" />
          </div>
          <span className="text-sm font-semibold tracking-wide">AI Toxic Detector Chat</span>
        </button>
      )}

      {/* Chat Window Modal */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[92vw] sm:w-[420px] h-[590px] max-h-[85vh] rounded-3xl border border-white/15 bg-slate-950/95 backdrop-blur-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-slate-900 via-slate-900 to-[#1e1427] border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#fd297b] to-[#ff655b] p-0.5 shadow-lg flex items-center justify-center">
                <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-[#ff655b]" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">AI Shield Assistant</h3>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    Voice Active
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Toxic words detection bot</p>
              </div>
            </div>
            
            {/* Header Actions: Mute Toggle & Close */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`p-2 rounded-xl transition-colors ${
                  isMuted ? 'text-slate-500 hover:text-slate-300' : 'text-rose-400 hover:bg-rose-500/10'
                }`}
                title={isMuted ? "Unmute Voice Output" : "Mute Voice Output"}
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5 animate-pulse" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'bot' && (
                  <div className="w-7 h-7 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[82%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-[#fd297b] to-[#ff655b] text-white font-medium rounded-tr-none'
                      : 'bg-slate-900/90 border border-white/10 text-slate-200 rounded-tl-none shadow-md'
                  }`}
                >
                  {/* Strategy Badge if available */}
                  {msg.data && (
                    <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-white/10 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                            msg.data.strategy === 'Safe'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : msg.data.strategy === 'Rewriting'
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : msg.data.strategy === 'Blurring'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : msg.data.strategy === 'Warning'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {msg.data.strategy}
                        </span>

                        <span className="text-[10px] font-mono text-slate-400 font-semibold">
                          Score: {(msg.data.final_score * 100).toFixed(0)}%
                        </span>
                      </div>

                      {/* Read Aloud Button per message */}
                      <button
                        onClick={() => speakText(msg.text, msg.id)}
                        className={`p-1 rounded-md transition-colors ${
                          speakingMsgId === msg.id ? 'text-rose-400 bg-rose-500/20' : 'text-slate-400 hover:text-white'
                        }`}
                        title="Listen to Voice"
                      >
                        <Volume2 className={`w-3.5 h-3.5 ${speakingMsgId === msg.id ? 'animate-bounce' : ''}`} />
                      </button>
                    </div>
                  )}

                  {/* Text Body */}
                  <div className="whitespace-pre-wrap font-sans">
                    {msg.text}
                  </div>

                  {/* Psychological Suggestion Card for the Commenter */}
                  {msg.data?.psychological_suggestion && (
                    <div className="mt-3 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-100">
                      <div className="flex items-center gap-1.5 font-bold text-[11px] text-emerald-400 mb-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{msg.data.psychological_suggestion.title}</span>
                      </div>
                      <p className="text-[11px] text-emerald-200/90 mb-1.5 italic">
                        "{msg.data.psychological_suggestion.reflection}"
                      </p>
                      <div className="text-[11px] text-slate-200 bg-slate-950/60 p-2 rounded-lg border border-emerald-500/20 mb-1.5">
                        {msg.data.psychological_suggestion.coping_tip}
                      </div>
                      <p className="text-[10px] text-emerald-400/90 font-medium">
                        {msg.data.psychological_suggestion.benefit}
                      </p>
                    </div>
                  )}

                  {/* Detected Words list if any */}
                  {msg.data?.detected_toxic_words && msg.data.detected_toxic_words.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-800">
                      <p className="text-[10px] text-slate-400 font-semibold mb-1">Detected Toxic Terms:</p>
                      <div className="flex flex-wrap gap-1">
                        {msg.data.detected_toxic_words.map((w) => (
                          <span
                            key={w}
                            className="px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/40 text-rose-300 font-mono text-[10px]"
                          >
                            {w}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Copy Rewrite Option */}
                  {msg.data?.suggested_rewrite && (
                    <div className="mt-3 flex items-center justify-between bg-slate-950/70 p-2 rounded-xl border border-white/10">
                      <span className="text-[10px] text-slate-400 font-medium truncate max-w-[200px]">
                        Clean version available
                      </span>
                      <button
                        onClick={() => handleCopyRewrite(msg.data!.suggested_rewrite!, msg.id)}
                        className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" /> Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" /> Copy Clean Text
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  <div className={`mt-1.5 text-[9px] ${msg.sender === 'user' ? 'text-white/70' : 'text-slate-500'} text-right`}>
                    {msg.timestamp}
                  </div>
                </div>

                {msg.sender === 'user' && (
                  <div className="w-7 h-7 rounded-xl bg-white/10 border border-white/20 text-white flex items-center justify-center shrink-0 mt-1">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 items-center">
                <div className="w-7 h-7 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-slate-900 border border-white/10 rounded-2xl p-3 text-xs text-slate-400 flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-400" />
                  <span>Analyzing against toxicity dataset...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Sample Prompts */}
          <div className="px-3 py-2 bg-slate-900/60 border-t border-white/5 flex gap-1.5 overflow-x-auto">
            {samplePrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                disabled={loading}
                className="text-[10px] whitespace-nowrap px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors shrink-0 disabled:opacity-50"
              >
                ⚡ {prompt.slice(0, 22)}...
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <div className="p-3 bg-slate-900/90 border-t border-white/10 flex items-center gap-2">
            {/* Microphone Button for Voice Input */}
            <button
              onClick={toggleListening}
              className={`p-2.5 rounded-xl border transition-all shrink-0 ${
                isListening
                  ? 'bg-rose-600 text-white border-rose-500 animate-pulse'
                  : 'bg-slate-950 border-white/15 text-slate-400 hover:text-white hover:border-white/30'
              }`}
              title={isListening ? "Listening... Speak now" : "Click to Speak (Voice Input)"}
            >
              {isListening ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4" />}
            </button>

            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={isListening ? "Listening to your voice..." : "Type or speak a message..."}
              disabled={loading}
              className="flex-1 bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500 outline-none focus:border-rose-500/50 transition-colors disabled:opacity-50"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() || loading}
              className="p-2.5 rounded-xl bg-gradient-to-r from-[#fd297b] to-[#ff655b] text-white disabled:opacity-40 transition-all hover:scale-105 shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
