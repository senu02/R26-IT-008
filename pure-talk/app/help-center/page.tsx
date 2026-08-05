"use client";

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  HelpCircle, 
  Shield, 
  AlertTriangle, 
  MessageSquare, 
  FileText, 
  ChevronDown,
  Send,
  CheckCircle,
  ExternalLink,
  Home,
  BookOpen,
  Mail,
  Phone,
  Flag,
  Ban,
  UserX,
  Eye,
  Clock,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { getTheme, getWaveColors } from '@/context/theme';
import Sidebar from '@/components/User/Sidebar';
import RightSidebar from '@/components/Home/RightSidebar';

// --- TypeScript Interfaces ---
interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'general' | 'safety' | 'reporting' | 'account' | 'detection';
}

interface ReportType {
  id: string;
  label: string;
  icon: React.ReactNode;
}

// --- Sample Data ---
const faqData: FAQItem[] = [
  {
    id: '1',
    question: 'How does the toxic message detection system work?',
    answer: 'Our AI-powered system uses advanced natural language processing (NLP) to analyze messages in real-time. It scans for harmful content like hate speech, cyberbullying, harassment, and offensive language. When detected, the message is automatically flagged, hidden from public view, and sent to our moderation team for review.',
    category: 'detection'
  },
  {
    id: '2',
    question: 'What happens when a toxic message is detected?',
    answer: 'When our system detects toxic content, the message is immediately quarantined. The sender receives a warning notification explaining why their message was blocked. The recipient is informed that a message was filtered for their safety. Our moderation team reviews the flagged content within 24 hours and takes appropriate action.',
    category: 'reporting'
  },
  {
    id: '3',
    question: 'Can I appeal a detection decision?',
    answer: 'Yes! If you believe your message was incorrectly flagged as toxic, you can submit an appeal through the Report Center. Our human moderation team will manually review the content and context within 48 hours. You\'ll receive a notification with the final decision and reasoning.',
    category: 'account'
  },
  {
    id: '4',
    question: 'How do I report a user for toxic behavior?',
    answer: 'To report a user, click the three-dot menu (⋮) on any message or profile. Select "Report" and choose the appropriate reason from the options. You can also use the report form in our Help Center to provide additional context, screenshots, or details about the incident.',
    category: 'reporting'
  },
  {
    id: '5',
    question: 'Is my data secure with the toxicity detection?',
    answer: 'Absolutely! All messages are processed with end-to-end encryption. Our AI scans message content for patterns and metadata without permanently storing the actual content. We comply with international data protection regulations and never share your personal information with third parties.',
    category: 'safety'
  },
  {
    id: '6',
    question: 'What types of toxic content does the system detect?',
    answer: 'Our system detects multiple categories of harmful content including: hate speech and discrimination, cyberbullying and harassment, personal attacks and threats, explicit or inappropriate language, spam and misinformation, and content that promotes violence or self-harm. The system is continuously updated to identify new forms of toxic behavior.',
    category: 'detection'
  },
  {
    id: '7',
    question: 'How accurate is the toxicity detection?',
    answer: 'Our AI model has been trained on over 1 million messages and achieves 94% accuracy in detecting toxic content. We continuously improve the model with new data and feedback. False positives are rare, and we have an appeal process in place to handle any incorrect flags.',
    category: 'detection'
  },
  {
    id: '8',
    question: 'How do I protect myself from toxic users?',
    answer: 'You can protect yourself by using our safety features: block users who harass you, report toxic content immediately, adjust your privacy settings to limit who can contact you, and use our content filters to automatically hide potentially harmful messages.',
    category: 'safety'
  }
];

// --- Background Component with Fixed Stars ---
const Background = ({ isDark }: { isDark: boolean }) => {
  const [stars, setStars] = useState<Array<{ id: number; style: React.CSSProperties }>>([]);
  const [brightStars, setBrightStars] = useState<Array<{ id: number; style: React.CSSProperties }>>([]);

  useEffect(() => {
    if (isDark) {
      const newStars = Array.from({ length: 80 }, (_, i) => ({
        id: i,
        style: {
          width: `${Math.random() * 2.5 + 0.5}px`,
          height: `${Math.random() * 2.5 + 0.5}px`,
          top: `${Math.random() * 100}%`,
          left: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 5}s`,
          animationDuration: `${Math.random() * 3 + 2}s`,
          opacity: Math.random() * 0.8 + 0.2,
        }
      }));

      const newBrightStars = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        style: {
          width: `${Math.random() * 4 + 1.5}px`,
          height: `${Math.random() * 4 + 1.5}px`,
          top: `${Math.random() * 100}%`,
          left: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 8}s`,
          animationDuration: `${Math.random() * 4 + 2}s`,
          opacity: Math.random() * 0.6 + 0.3,
          boxShadow: `0 0 ${Math.random() * 8 + 3}px rgba(255,255,255,0.6)`,
        }
      }));

      setStars(newStars);
      setBrightStars(newBrightStars);
    }
  }, [isDark]);

  if (!isDark) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-[#f0f5ff] via-[#e4efff] to-[#f0f8ff]"></div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black">
      <div className="absolute inset-0 bg-gradient-to-br from-black via-[#0a0a0a] to-[#050510]"></div>
      <div className="absolute inset-0 overflow-hidden">
        {stars.map((star) => (
          <div
            key={star.id}
            className="absolute rounded-full bg-white animate-twinkle"
            style={star.style}
          />
        ))}
        {brightStars.map((star) => (
          <div
            key={`bright-${star.id}`}
            className="absolute rounded-full bg-white animate-pulse-glow"
            style={star.style}
          />
        ))}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-purple-600/5 blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-blue-600/5 blur-3xl animate-pulse-slow delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-120 h-120 rounded-full bg-indigo-500/3 blur-3xl animate-pulse-slow delay-2000"></div>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.3); }
        }
        
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.3; transform: scale(1); box-shadow: 0 0 4px rgba(255,255,255,0.4); }
          50% { opacity: 0.9; transform: scale(1.15); box-shadow: 0 0 15px rgba(255,255,255,0.9); }
        }
        
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.05); }
        }
        
        .animate-twinkle {
          animation: twinkle ease-in-out infinite;
        }
        
        .animate-pulse-glow {
          animation: pulse-glow ease-in-out infinite;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 8s ease-in-out infinite;
        }
        
        .delay-1000 {
          animation-delay: 1s;
        }
        
        .delay-2000 {
          animation-delay: 2s;
        }
      `}} />
    </div>
  );
};

// --- Main Help Center Component ---
const HelpCenterPage: React.FC = () => {
  const [isDark, setIsDark] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [reportType, setReportType] = useState<string>('toxic_message');
  const [reportDescription, setReportDescription] = useState<string>('');
  const [reportSubmitted, setReportSubmitted] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'faq' | 'report' | 'resources'>('faq');
  const [mounted, setMounted] = useState<boolean>(false);

  const theme = getTheme(isDark);

  // Report types specific to toxic content
  const reportTypes: ReportType[] = [
    { id: 'toxic_message', label: 'Toxic / Hateful Message', icon: <AlertTriangle className="h-4 w-4" /> },
    { id: 'harassment', label: 'Harassment or Bullying', icon: <UserX className="h-4 w-4" /> },
    { id: 'hate_speech', label: 'Hate Speech', icon: <Ban className="h-4 w-4" /> },
    { id: 'spam', label: 'Spam or Misinformation', icon: <MessageSquare className="h-4 w-4" /> },
    { id: 'threats', label: 'Threats or Violence', icon: <AlertTriangle className="h-4 w-4" /> },
    { id: 'other', label: 'Other', icon: <HelpCircle className="h-4 w-4" /> }
  ];

  // Load theme preference from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      setIsDark(false);
    } else if (savedTheme === 'dark') {
      setIsDark(true);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDark(prefersDark);
    }
    setMounted(true);
  }, []);

  // Filter FAQs based on search
  const filteredFaqs = faqData.filter((faq) =>
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle report submission
  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reportDescription.trim().length > 10) {
      setReportSubmitted(true);
      console.log('Report submitted:', { type: reportType, description: reportDescription });
      setTimeout(() => setReportSubmitted(false), 4000);
      setReportDescription('');
    }
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return null;
  }

  return (
    <>
      <Background isDark={isDark} />
      <div className="relative z-10 min-h-screen">
        {/* Left Sidebar - Fixed */}
        <Sidebar />

        {/* Main Content - Properly spaced between sidebars */}
        <div className="ml-[72px] lg:ml-[245px] mr-0 lg:mr-[320px] min-h-screen">
          {/* Hero Section */}
          <section className={`${theme.surface.glass} ${theme.surface.border} backdrop-blur-xl mx-4 sm:mx-6 lg:mx-8 mt-8 rounded-2xl`}>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Shield className={`h-10 w-10 ${theme.accent.primary}`} />
                <h1 className={`text-3xl md:text-4xl font-extrabold ${theme.text.primary}`}>
                  Toxic Message <span className={theme.accent.primary}>Help Center</span>
                </h1>
              </div>
              <h2 className={`text-2xl md:text-3xl font-bold ${theme.text.secondary} mb-4`}>
                Your Safety is Our Priority
              </h2>
              <p className={`text-lg ${theme.text.tertiary} max-w-2xl mx-auto`}>
                Learn how our AI-powered toxicity detection keeps your conversations safe.
                Get answers, report issues, and help us build a respectful community.
              </p>
              <div className="mt-8 max-w-xl mx-auto relative">
                <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 ${theme.text.muted} h-5 w-5`} />
                <input
                  type="text"
                  placeholder="Search for topics like 'toxicity detection', 'report', 'appeal'..."
                  className={`w-full pl-12 pr-4 py-3 ${theme.surface.glass} ${theme.surface.border} rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${theme.text.primary} placeholder:${theme.text.muted} backdrop-blur-sm transition`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm">
                <div className={`${theme.surface.glass} px-4 py-2 rounded-full flex items-center gap-2 ${theme.surface.border}`}>
                  <Zap className="h-4 w-4 text-yellow-500" />
                  <span className={theme.text.secondary}>Real-time detection</span>
                </div>
                <div className={`${theme.surface.glass} px-4 py-2 rounded-full flex items-center gap-2 ${theme.surface.border}`}>
                  <ShieldCheck className="h-4 w-4 text-green-500" />
                  <span className={theme.text.secondary}>94% accuracy</span>
                </div>
                <div className={`${theme.surface.glass} px-4 py-2 rounded-full flex items-center gap-2 ${theme.surface.border}`}>
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span className={theme.text.secondary}>24/7 monitoring</span>
                </div>
              </div>
            </div>
          </section>

          {/* Tab Navigation */}
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className={`flex flex-wrap gap-2 border-b ${isDark ? 'border-white/10' : 'border-slate-200'} pb-4`}>
              <button
                onClick={() => setActiveTab('faq')}
                className={`px-5 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  activeTab === 'faq'
                    ? `bg-blue-500/20 ${theme.text.primary} shadow-sm`
                    : `${theme.text.secondary} ${theme.surface.glassHover}`
                }`}
              >
                <HelpCircle className="h-4 w-4" /> FAQs
              </button>
              <button
                onClick={() => setActiveTab('report')}
                className={`px-5 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  activeTab === 'report'
                    ? `bg-red-500/20 ${theme.text.primary} shadow-sm`
                    : `${theme.text.secondary} ${theme.surface.glassHover}`
                }`}
              >
                <Flag className="h-4 w-4" /> Report Toxic Content
              </button>
              <button
                onClick={() => setActiveTab('resources')}
                className={`px-5 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  activeTab === 'resources'
                    ? `bg-green-500/20 ${theme.text.primary} shadow-sm`
                    : `${theme.text.secondary} ${theme.surface.glassHover}`
                }`}
              >
                <BookOpen className="h-4 w-4" /> Resources
              </button>
            </div>

            {/* Tab Content */}
            <div className="mt-8">
              {/* FAQ Tab */}
              {activeTab === 'faq' && (
                <div className="space-y-4">
                  {filteredFaqs.length === 0 ? (
                    <div className={`text-center py-10 ${theme.text.muted}`}>
                      <HelpCircle className={`h-12 w-12 mx-auto ${theme.text.muted} mb-3`} />
                      <p className="text-lg">No results found for "{searchTerm}"</p>
                      <p className="text-sm">Try different keywords or browse the categories below.</p>
                    </div>
                  ) : (
                    filteredFaqs.map((faq) => (
                      <div
                        key={faq.id}
                        className={`${theme.surface.glass} ${theme.surface.border} rounded-xl shadow-sm overflow-hidden transition-all backdrop-blur-sm`}
                      >
                        <button
                          onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                          className={`w-full px-6 py-4 text-left flex justify-between items-center ${theme.surface.glassHover} transition`}
                        >
                          <span className={`font-semibold ${theme.text.primary}`}>{faq.question}</span>
                          <ChevronDown
                            className={`h-5 w-5 ${theme.text.muted} transition-transform ${
                              expandedFaq === faq.id ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                        {expandedFaq === faq.id && (
                          <div className={`px-6 pb-5 ${theme.text.secondary} border-t ${isDark ? 'border-white/10' : 'border-slate-200'} pt-3`}>
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Report Tab */}
              {activeTab === 'report' && (
                <div className={`${theme.surface.glass} ${theme.surface.border} rounded-xl shadow-sm p-6 md:p-8 backdrop-blur-sm`}>
                  <div className="flex items-center gap-3 mb-6">
                    <Flag className="h-6 w-6 text-red-500" />
                    <h3 className={`text-xl font-bold ${theme.text.primary}`}>Report Toxic Content</h3>
                  </div>
                  <p className={`${theme.text.secondary} mb-6`}>
                    Help us keep our community safe by reporting toxic messages, harassment, or any content that violates 
                    our community guidelines. Your report is confidential and will be reviewed within 24 hours.
                  </p>

                  {reportSubmitted ? (
                    <div className={`${theme.status.error.bg} ${theme.status.error.border} rounded-lg p-4 flex items-start gap-3`}>
                      <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className={`font-semibold ${theme.text.primary}`}>Report Submitted!</h4>
                        <p className={`${theme.text.secondary} text-sm`}>
                          Thank you for helping keep our community safe from toxic content. 
                          Our moderation team will review your report and take appropriate action.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleReportSubmit} className="space-y-5">
                      <div>
                        <label className={`block text-sm font-medium ${theme.text.secondary} mb-1`}>
                          Type of Toxic Content
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {reportTypes.map((type) => (
                            <label
                              key={type.id}
                              className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition ${
                                reportType === type.id
                                  ? `bg-red-500/20 border border-red-500/50 ${theme.text.primary}`
                                  : `${theme.surface.glass} ${theme.surface.border} ${theme.text.secondary} hover:${theme.surface.glassHover}`
                              }`}
                            >
                              <input
                                type="radio"
                                name="reportType"
                                value={type.id}
                                checked={reportType === type.id}
                                onChange={(e) => setReportType(e.target.value)}
                                className="sr-only"
                              />
                              {type.icon}
                              <span className="text-sm">{type.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <label className={`block text-sm font-medium ${theme.text.secondary} mb-1`}>
                          Description of the Incident <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          rows={5}
                          value={reportDescription}
                          onChange={(e) => setReportDescription(e.target.value)}
                          placeholder="Please describe what happened in detail. Include usernames, what was said, and how it affected you..."
                          className={`w-full px-4 py-2 ${theme.surface.glass} ${theme.surface.border} rounded-lg shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 ${theme.text.primary} placeholder:${theme.text.muted} resize-none backdrop-blur-sm`}
                          required
                        />
                        <p className={`text-xs ${theme.text.muted} mt-1`}>
                          Minimum 10 characters. The more detail you provide, the better we can investigate.
                        </p>
                      </div>
                      
                      <div>
                        <label className={`block text-sm font-medium ${theme.text.secondary} mb-1`}>
                          Screenshot Evidence (Optional)
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className={`w-full text-sm ${theme.text.muted} file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-red-500/20 file:text-red-500 hover:file:bg-red-500/30`}
                        />
                        <p className={`text-xs ${theme.text.muted} mt-1`}>
                          Upload screenshots of the toxic messages (max 5 files, 5MB each)
                        </p>
                      </div>
                      
                      <button
                        type="submit"
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition shadow-sm"
                      >
                        <Send className="h-4 w-4" /> Submit Report
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* Resources Tab */}
              {activeTab === 'resources' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className={`${theme.surface.glass} ${theme.surface.border} rounded-xl shadow-sm p-6 backdrop-blur-sm`}>
                    <div className="flex items-center gap-3 mb-4">
                      <Shield className={`h-6 w-6 ${theme.accent.primary}`} />
                      <h3 className={`font-bold ${theme.text.primary}`}>Safety Guidelines</h3>
                    </div>
                    <ul className={`space-y-3 ${theme.text.secondary} text-sm`}>
                      <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" /> Treat others with respect in all conversations.</li>
                      <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" /> Think before you post - words can have a lasting impact.</li>
                      <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" /> Report toxic content immediately using the report form.</li>
                      <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" /> Block users who engage in harassment or bullying.</li>
                      <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" /> Don't engage with toxic users - let our system handle it.</li>
                    </ul>
                  </div>

                  <div className={`${theme.surface.glass} ${theme.surface.border} rounded-xl shadow-sm p-6 backdrop-blur-sm`}>
                    <div className="flex items-center gap-3 mb-4">
                      <MessageSquare className={`h-6 w-6 ${theme.accent.primary}`} />
                      <h3 className={`font-bold ${theme.text.primary}`}>Community Support</h3>
                    </div>
                    <ul className={`space-y-3 ${theme.text.secondary} text-sm`}>
                      <li className="flex items-start gap-2"><Mail className={`h-4 w-4 ${theme.text.muted} mt-0.5 flex-shrink-0`} /> support@toxicdetection.com</li>
                      <li className="flex items-start gap-2"><Phone className={`h-4 w-4 ${theme.text.muted} mt-0.5 flex-shrink-0`} /> +94 11 234 5678 (24/7 Support)</li>
                      <li className="flex items-start gap-2"><ExternalLink className={`h-4 w-4 ${theme.text.muted} mt-0.5 flex-shrink-0`} /> Community Reporting Portal</li>
                      <li className="flex items-start gap-2"><Shield className={`h-4 w-4 ${theme.text.muted} mt-0.5 flex-shrink-0`} /> Crisis Support Hotline</li>
                    </ul>
                    <button className={`mt-4 text-sm font-medium ${theme.accent.primary} hover:underline flex items-center gap-1`}>
                      <Home className="h-4 w-4" /> Return to Main Platform
                    </button>
                  </div>

                  <div className={`md:col-span-2 ${theme.surface.glass} ${theme.surface.border} rounded-xl p-6 backdrop-blur-sm`}>
                    <div className="flex items-start gap-4">
                      <Shield className={`h-8 w-8 ${theme.accent.primary} flex-shrink-0`} />
                      <div>
                        <h3 className={`font-bold ${theme.text.primary}`}>Understanding Our Toxicity Detection System</h3>
                        <p className={`text-sm ${theme.text.secondary} mt-2`}>
                          Our AI-powered toxicity detection uses cutting-edge natural language processing to identify harmful 
                          content in real-time. The system is trained on diverse datasets to ensure fair and accurate detection 
                          across different languages and contexts. We maintain transparency by providing clear feedback on why 
                          content was flagged and offering a straightforward appeal process for any false positives.
                        </p>
                        <div className="mt-4 flex flex-wrap gap-3">
                          <span className={`px-3 py-1 ${theme.surface.glass} ${theme.surface.border} rounded-full text-xs ${theme.text.secondary}`}>
                            🤖 AI-Powered Detection
                          </span>
                          <span className={`px-3 py-1 ${theme.surface.glass} ${theme.surface.border} rounded-full text-xs ${theme.text.secondary}`}>
                            🌍 Multi-Language Support
                          </span>
                          <span className={`px-3 py-1 ${theme.surface.glass} ${theme.surface.border} rounded-full text-xs ${theme.text.secondary}`}>
                            🔒 Privacy-First Approach
                          </span>
                          <span className={`px-3 py-1 ${theme.surface.glass} ${theme.surface.border} rounded-full text-xs ${theme.text.secondary}`}>
                            📊 94% Accuracy Rate
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <footer className={`${theme.surface.glass} ${theme.surface.border} backdrop-blur-xl mt-12 mx-4 sm:mx-6 lg:mx-8`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-sm ${theme.text.muted}">
              <p className={theme.text.muted}>© 2026 Toxic Message Detection System. All rights reserved.</p>
              <p className={`mt-1 ${theme.text.muted}`}>Building safer online communities through advanced AI technology.</p>
              <div className="mt-4 flex justify-center gap-6 text-xs">
                <a href="#" className={`${theme.text.muted} hover:${theme.text.primary}`}>Privacy Policy</a>
                <a href="#" className={`${theme.text.muted} hover:${theme.text.primary}`}>Terms of Service</a>
                <a href="#" className={`${theme.text.muted} hover:${theme.text.primary}`}>Cookie Policy</a>
                <a href="#" className={`${theme.text.muted} hover:${theme.text.primary}`}>Accessibility</a>
              </div>
            </div>
          </footer>
        </div>

        {/* Right Sidebar - Fixed */}
        <div className="fixed right-0 top-0 h-screen w-[320px] hidden lg:block overflow-y-auto py-8 pr-4">
          <RightSidebar />
        </div>
      </div>
    </>
  );
};

export default HelpCenterPage;