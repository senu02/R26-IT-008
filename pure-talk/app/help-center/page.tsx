"use client";

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Shield, 
  AlertTriangle, 
  MessageSquare, 
  FileText, 
  ChevronDown,
  Send,
  CheckCircle2,
  ExternalLink,
  BookOpen,
  Mail,
  Phone,
  Flag,
  Ban,
  UserX,
  Clock,
  ShieldCheck,
  Zap,
  LifeBuoy,
  Sparkles,
  MessageCircle,
  ArrowRight,
  Lock,
  ThumbsUp,
  HelpCircle,
  UploadCloud,
  Check
} from 'lucide-react';
import Sidebar from '@/components/User/Sidebar';
import RightSidebar from '@/components/Home/RightSidebar';

// TypeScript Interfaces
interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'detection' | 'safety' | 'reporting' | 'account';
  tags: string[];
}

interface CategoryCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  count: number;
  gradient: string;
}

// Sample Data
const categories: CategoryCard[] = [
  {
    id: 'detection',
    title: 'AI Shield & Toxicity',
    description: 'How real-time NLP analysis, blurring & auto-rewriting work',
    icon: <Zap className="h-6 w-6 text-amber-400" />,
    count: 3,
    gradient: 'from-amber-500/20 via-rose-500/10 to-transparent border-amber-500/30'
  },
  {
    id: 'safety',
    title: 'Safety & Privacy',
    description: 'Encryption, user blocking & data protection guidelines',
    icon: <ShieldCheck className="h-6 w-6 text-emerald-400" />,
    count: 2,
    gradient: 'from-emerald-500/20 via-teal-500/10 to-transparent border-emerald-500/30'
  },
  {
    id: 'reporting',
    title: 'Reports & Appeals',
    description: 'Filing toxic content reports and tracking appeal status',
    icon: <Flag className="h-6 w-6 text-rose-400" />,
    count: 2,
    gradient: 'from-rose-500/20 via-red-500/10 to-transparent border-rose-500/30'
  },
  {
    id: 'account',
    title: 'Account & Settings',
    description: 'Role permissions, suspensions & profile security',
    icon: <Lock className="h-6 w-6 text-indigo-400" />,
    count: 1,
    gradient: 'from-indigo-500/20 via-purple-500/10 to-transparent border-indigo-500/30'
  }
];

const faqData: FAQItem[] = [
  {
    id: '1',
    question: 'How does the PureTalk AI Toxicity Shield analyze messages?',
    answer: 'Our AI-powered system uses advanced real-time Natural Language Processing (NLP) models. When you send a post or message, it evaluates toxicity levels instantaneously. Depending on severity, content is either automatically filtered, rewritten to stay respectful, or blurred to protect community safety.',
    category: 'detection',
    tags: ['AI Detection', 'NLP', 'Real-time']
  },
  {
    id: '2',
    question: 'What happens when a message is flagged or blocked?',
    answer: 'When a message triggers high toxicity thresholds, it is immediately quarantined. The sender receives an inline notification explaining the policy. The recipient is notified that a message was filtered. All flagged instances undergo secondary audit by our moderation team within 24 hours.',
    category: 'reporting',
    tags: ['Quarantine', 'Moderation', 'Safety']
  },
  {
    id: '3',
    question: 'How can I appeal if my post or comment was incorrectly flagged?',
    answer: 'If you believe your message was incorrectly flagged, click "Appeal Decision" in the notification or submit an appeal form under the Reports tab. Our human moderation team re-examines context and responds with an update within 48 hours.',
    category: 'account',
    tags: ['Appeal', 'Review', 'Support']
  },
  {
    id: '4',
    question: 'How do I report a toxic user or harassment?',
    answer: 'You can click the action menu on any post, comment, or user profile and select "Report User". Alternatively, use the "Report Toxic Content" tab on this Help Center page to upload screenshots and detail the incident directly.',
    category: 'reporting',
    tags: ['Report', 'User Blocking', 'Harassment']
  },
  {
    id: '5',
    question: 'Is my personal data encrypted during AI scanning?',
    answer: 'Yes! All message analysis happens in encrypted memory pipelines. We do not permanently store clean private messages, and all data processing strictly adheres to international data protection and privacy standards.',
    category: 'safety',
    tags: ['Encryption', 'Privacy', 'Security']
  },
  {
    id: '6',
    question: 'What categories of toxic speech are automatically detected?',
    answer: 'Our system identifies hate speech, targeted harassment, explicit insults, violent threats, spam, and severe profanity. The AI model is regularly retrained to adapt to modern online vernacular.',
    category: 'detection',
    tags: ['Hate Speech', 'Harassment', 'Profanity']
  },
  {
    id: '7',
    question: 'How accurate is the toxicity model?',
    answer: 'Our state-of-the-art model maintains a 94%+ precision rating across multiple languages. Continuous fine-tuning prevents false positives while keeping conversations clean.',
    category: 'detection',
    tags: ['Accuracy', 'AI Model', 'Metrics']
  },
  {
    id: '8',
    question: 'How can I block or restrict toxic users directly?',
    answer: 'Visit any user profile, click the settings menu (⋮), and choose "Block User". Blocked users will not be able to view your posts, send you direct messages, or interact with your comments.',
    category: 'safety',
    tags: ['Block', 'Privacy Settings', 'Control']
  }
];

export default function HelpCenterPage() {
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<string | null>('1');
  const [activeTab, setActiveTab] = useState<'faq' | 'report' | 'resources'>('faq');
  const [helpfulVotes, setHelpfulVotes] = useState<Record<string, boolean>>({});

  // Form states
  const [reportType, setReportType] = useState('toxic_message');
  const [reportDescription, setReportDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleVote = (id: string, isHelpful: boolean) => {
    setHelpfulVotes(prev => ({ ...prev, [id]: isHelpful }));
  };

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportDescription.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setReportSubmitted(true);
      setReportDescription('');
      setAttachedFiles([]);
      setTimeout(() => setReportSubmitted(false), 5000);
    }, 1200);
  };

  const handleFileDrop = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachedFiles(Array.from(e.target.files));
    }
  };

  const filteredFaqs = faqData.filter((faq) => {
    const matchesSearch = 
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory ? faq.category === selectedCategory : true;

    return matchesSearch && matchesCategory;
  });

  if (!mounted) return null;

  return (
    <div className="flex bg-[#090d16] min-h-screen font-sans text-slate-100 selection:bg-rose-500 selection:text-white">
      {/* Left Navigation Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-[245px] xl:mr-[320px] min-h-screen pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          
          {/* Hero Banner with Modern Dark Mesh & Pattern */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1c0812] via-[#0d1424] to-[#070b14] border border-rose-500/20 p-8 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.7)] sidebar-card-pattern mb-8">
            {/* Ambient Background Spotlights */}
            <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-rose-600/20 blur-3xl pointer-events-none animate-pulse-slow" />
            <div className="absolute top-1/2 -right-24 h-72 w-72 rounded-full bg-purple-600/20 blur-3xl pointer-events-none animate-pulse-slow delay-1000" />
            <div className="absolute -bottom-24 left-1/3 h-60 w-60 rounded-full bg-red-900/25 blur-3xl pointer-events-none" />

            <div className="relative z-10 text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold uppercase tracking-wider mb-4 shadow-[0_0_15px_rgba(244,63,94,0.2)]">
                <Sparkles className="h-3.5 w-3.5 text-rose-400 animate-pulse" />
                PureTalk Support Hub
              </div>

              <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-4 drop-shadow-md">
                How can we <span className="bg-gradient-to-r from-rose-400 via-red-400 to-amber-300 bg-clip-text text-transparent">help you</span> today?
              </h1>
              
              <p className="text-sm md:text-base text-slate-300 max-w-xl mx-auto mb-8 font-medium leading-relaxed">
                Explore real-time AI toxicity shield guides, search FAQs, or submit a confidential report to our moderation team.
              </p>

              {/* Glassmorphic Search Bar */}
              <div className="relative max-w-xl mx-auto">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-rose-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search toxicity detection, appeals, blocking users..."
                  className="w-full pl-12 pr-10 py-4 rounded-2xl bg-slate-900/90 border border-rose-500/30 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-400 backdrop-blur-xl shadow-2xl text-sm transition-all"
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs font-bold text-slate-400 hover:text-white"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Status Badges */}
              <div className="mt-6 flex flex-wrap justify-center gap-3 text-xs font-semibold">
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 backdrop-blur-md">
                  <Zap className="h-3.5 w-3.5 text-amber-400" /> Real-time AI Shield
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 backdrop-blur-md">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> 94%+ Model Precision
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 backdrop-blur-md">
                  <Clock className="h-3.5 w-3.5 text-rose-400" /> 24/7 Moderation Audit
                </span>
              </div>
            </div>
          </div>

          {/* Quick Access Categories Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(isSelected ? null : cat.id)}
                  className={`text-left p-5 rounded-2xl bg-gradient-to-b ${cat.gradient} backdrop-blur-xl border transition-all duration-300 hover:scale-[1.03] shadow-lg group relative overflow-hidden ${
                    isSelected ? 'ring-2 ring-rose-500 border-rose-400' : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-xl bg-slate-900/80 border border-white/10 group-hover:scale-110 transition-transform">
                      {cat.icon}
                    </div>
                    <span className="text-xs font-extrabold px-2 py-0.5 rounded-md bg-slate-900/60 text-slate-400 border border-slate-800">
                      {cat.count} articles
                    </span>
                  </div>
                  <h3 className="font-bold text-white text-base mb-1 group-hover:text-rose-300 transition-colors">
                    {cat.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {cat.description}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Main Tabs Navigation */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-4 mb-8">
            <button
              onClick={() => setActiveTab('faq')}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'faq'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <HelpCircle className="h-4 w-4 text-rose-400" />
              Frequently Asked Questions
            </button>
            <button
              onClick={() => setActiveTab('report')}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'report'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <Flag className="h-4 w-4 text-rose-400" />
              Report Toxic Content
            </button>
            <button
              onClick={() => setActiveTab('resources')}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'resources'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <BookOpen className="h-4 w-4 text-rose-400" />
              Safety & Resources
            </button>
          </div>

          {/* TAB 1: FAQ Accordions */}
          {activeTab === 'faq' && (
            <div className="space-y-4">
              {selectedCategory && (
                <div className="flex items-center justify-between px-2 py-1 mb-2">
                  <span className="text-xs font-semibold text-slate-400">
                    Showing category: <span className="text-rose-400 capitalize">{selectedCategory}</span>
                  </span>
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className="text-xs font-bold text-rose-400 hover:underline"
                  >
                    View All Categories
                  </button>
                </div>
              )}

              {filteredFaqs.length === 0 ? (
                <div className="rounded-3xl bg-slate-900/60 border border-slate-800/80 p-12 text-center">
                  <HelpCircle className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-white mb-1">No matching articles found</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
                    Try searching with different keywords like 'AI', 'report', or 'block'.
                  </p>
                  <button
                    onClick={() => { setSearchTerm(''); setSelectedCategory(null); }}
                    className="px-4 py-2 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                filteredFaqs.map((faq) => {
                  const isOpen = expandedFaq === faq.id;
                  return (
                    <div
                      key={faq.id}
                      className="rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-slate-800/90 overflow-hidden shadow-lg transition-all duration-200 hover:border-slate-700"
                    >
                      <button
                        onClick={() => setExpandedFaq(isOpen ? null : faq.id)}
                        className="w-full p-5 text-left flex justify-between items-center gap-4 hover:bg-slate-800/40 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl border ${isOpen ? 'bg-rose-500/20 border-rose-500/40 text-rose-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                            <FileText className="h-4 w-4" />
                          </div>
                          <span className="font-bold text-white text-base">{faq.question}</span>
                        </div>
                        <ChevronDown className={`h-5 w-5 text-slate-400 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-rose-400' : ''}`} />
                      </button>

                      {isOpen && (
                        <div className="px-6 pb-6 pt-2 border-t border-slate-800/80 text-slate-300 text-sm leading-relaxed">
                          <p className="mb-4">{faq.answer}</p>
                          
                          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-800/60">
                            {/* Tags */}
                            <div className="flex flex-wrap gap-1.5">
                              {faq.tags.map(t => (
                                <span key={t} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700">
                                  #{t}
                                </span>
                              ))}
                            </div>

                            {/* Vote Buttons */}
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-slate-500">Was this helpful?</span>
                              <button
                                onClick={() => handleVote(faq.id, true)}
                                className={`p-1.5 rounded-lg border transition-all ${helpfulVotes[faq.id] === true ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'}`}
                              >
                                <ThumbsUp className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 2: Report Form */}
          {activeTab === 'report' && (
            <div className="rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-slate-800/90 p-6 md:p-8 shadow-2xl relative overflow-hidden sidebar-card-pattern">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-400">
                  <Flag className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white tracking-wide">Report Toxic Content</h2>
                  <p className="text-xs text-slate-400">Confidential submission analyzed by AI & reviewed by staff</p>
                </div>
              </div>

              {reportSubmitted ? (
                <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-4 animate-fade-in">
                  <CheckCircle2 className="h-7 w-7 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-emerald-300 text-base mb-1">Report Submitted Successfully</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Thank you for keeping PureTalk safe. Your ticket has been logged and forwarded to our moderation team. You can track the status under your notification inbox.
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleReportSubmit} className="space-y-6">
                  {/* Select Report Type */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
                      Select Issue Type
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {[
                        { id: 'toxic_message', label: 'Toxic / Hateful Post', icon: <AlertTriangle className="h-4 w-4 text-rose-400" /> },
                        { id: 'harassment', label: 'Bullying & Harassment', icon: <UserX className="h-4 w-4 text-purple-400" /> },
                        { id: 'hate_speech', label: 'Hate Speech & Racism', icon: <Ban className="h-4 w-4 text-red-500" /> },
                        { id: 'threats', label: 'Violence or Threats', icon: <Shield className="h-4 w-4 text-amber-400" /> },
                        { id: 'spam', label: 'Spam / Misinformation', icon: <MessageSquare className="h-4 w-4 text-blue-400" /> },
                        { id: 'other', label: 'Other Guidelines Breach', icon: <HelpCircle className="h-4 w-4 text-slate-400" /> }
                      ].map((item) => {
                        const selected = reportType === item.id;
                        return (
                          <button
                            type="button"
                            key={item.id}
                            onClick={() => setReportType(item.id)}
                            className={`flex items-center gap-3 p-3.5 rounded-xl text-xs font-bold border transition-all text-left ${
                              selected
                                ? 'bg-rose-500/20 border-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            {item.icon}
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Incident Description */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                      Description & Details <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={5}
                      value={reportDescription}
                      onChange={(e) => setReportDescription(e.target.value)}
                      placeholder="Please describe what happened, including usernames, context, or links..."
                      className="w-full p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 text-sm transition-all"
                      required
                    />
                    <div className="flex justify-between items-center mt-1 text-[11px] text-slate-500">
                      <span>Minimum 10 characters required</span>
                      <span>{reportDescription.length} chars</span>
                    </div>
                  </div>

                  {/* Evidence Upload */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                      Attach Screenshot Evidence (Optional)
                    </label>
                    <div className="relative border-2 border-dashed border-slate-800 rounded-2xl p-6 text-center hover:border-rose-500/40 transition-colors bg-slate-900/40">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileDrop}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <UploadCloud className="h-8 w-8 text-rose-400 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-slate-300">Click or drag images to upload screenshot</p>
                      <p className="text-[10px] text-slate-500 mt-1">PNG, JPG up to 5MB each</p>
                      {attachedFiles.length > 0 && (
                        <div className="mt-3 flex flex-wrap justify-center gap-2">
                          {attachedFiles.map((f, idx) => (
                            <span key={idx} className="text-[10px] font-bold px-2 py-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              {f.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting || !reportDescription.trim()}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-rose-500 hover:from-red-500 hover:to-rose-400 text-white font-bold text-sm shadow-[0_0_20px_rgba(244,63,94,0.4)] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="h-4 w-4" /> Submit Report Confidentiality
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 3: Resources & Community */}
          {activeTab === 'resources' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 1: Community Guidelines */}
              <div className="rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-slate-800/90 p-6 shadow-xl relative overflow-hidden">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Community Guidelines</h3>
                </div>
                <ul className="space-y-3 text-xs text-slate-300">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Engage in constructive discussions without personal attacks or hate speech.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Respect privacy — do not post personal contact information (doxxing).</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Report toxic content immediately to help keep PureTalk safe for all users.</span>
                  </li>
                </ul>
              </div>

              {/* Card 2: Support Channels */}
              <div className="rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-slate-800/90 p-6 shadow-xl relative overflow-hidden">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    <LifeBuoy className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Direct Support Hub</h3>
                </div>
                <div className="space-y-3 text-xs text-slate-300">
                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                    <Mail className="h-4 w-4 text-rose-400" />
                    <span>support@puretalk.com (24h response time)</span>
                  </div>
                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                    <Phone className="h-4 w-4 text-emerald-400" />
                    <span>+94 11 234 5678 (24/7 Hotline)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Right Pinned Sidebar Container */}
      <div className="fixed right-0 top-0 h-screen w-[320px] hidden xl:block overflow-y-auto py-6 pr-6 scrollbar-none" style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
        <RightSidebar />
      </div>
    </div>
  );
}