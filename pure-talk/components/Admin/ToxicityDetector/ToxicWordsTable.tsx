'use client';

import { useState } from 'react';
import { Search, X, Filter, BookOpen, AlertOctagon, ShieldAlert, Sparkles, Tag } from 'lucide-react';
import { useThemeColors } from '@/context/adminTheme';

export interface CategorizedToxicWord {
  id: string;
  word: string;
  category: 'Singlish Slurs & Insults' | 'English Profanity' | 'Threats & Violence' | 'Personal Insults' | 'Obscene & Explicit';
  language: 'Singlish' | 'English';
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  replacement: string;
  description: string;
}

export const TOXIC_WORDS_DATABASE: CategorizedToxicWord[] = [
  // ── 1. Singlish Slurs & Insults ──────────────────────────────────────
  { id: '1', word: 'huththo / huththa', category: 'Singlish Slurs & Insults', language: 'Singlish', severity: 'Critical', replacement: 'friend', description: 'Highly offensive Sinhala vulgar slur' },
  { id: '2', word: 'huthto / hutta / hutto', category: 'Singlish Slurs & Insults', language: 'Singlish', severity: 'Critical', replacement: 'friend', description: 'Offensive Singlish slur spelling variations' },
  { id: '3', word: 'pakaya / pako', category: 'Singlish Slurs & Insults', language: 'Singlish', severity: 'High', replacement: 'person / friend', description: 'Vulgar Sinhala personal insult' },
  { id: '4', word: 'pakayo / pakku', category: 'Singlish Slurs & Insults', language: 'Singlish', severity: 'High', replacement: 'friends', description: 'Plural form of Sinhala vulgar insult' },
  { id: '5', word: 'ponnaya / ponnayek', category: 'Singlish Slurs & Insults', language: 'Singlish', severity: 'Critical', replacement: 'person', description: 'Highly offensive derogatory slur' },
  { id: '6', word: 'ponnayo', category: 'Singlish Slurs & Insults', language: 'Singlish', severity: 'Critical', replacement: 'people', description: 'Plural offensive derogatory slur' },
  { id: '7', word: 'wesige / wesi / wesiyek', category: 'Singlish Slurs & Insults', language: 'Singlish', severity: 'Critical', replacement: "person's / person", description: 'Highly offensive misogynistic slur' },
  { id: '8', word: 'balla / balli', category: 'Singlish Slurs & Insults', language: 'Singlish', severity: 'Medium', replacement: 'person', description: 'Derogatory animal insult (singular)' },
  { id: '9', word: 'ballo', category: 'Singlish Slurs & Insults', language: 'Singlish', severity: 'Medium', replacement: 'people', description: 'Derogatory animal insult (plural)' },
  { id: '10', word: 'kari / kariyo', category: 'Singlish Slurs & Insults', language: 'Singlish', severity: 'High', replacement: 'not the best / not great people', description: 'Vulgar offensive Sinhala slur' },
  { id: '11', word: 'modaya / moda', category: 'Singlish Slurs & Insults', language: 'Singlish', severity: 'Low', replacement: 'silly person / silly', description: 'Mild Sinhala insult meaning foolish' },
  { id: '12', word: 'pissu', category: 'Singlish Slurs & Insults', language: 'Singlish', severity: 'Low', replacement: 'silly', description: 'Derogatory term meaning crazy' },
  { id: '13', word: 'gon / gonwa', category: 'Singlish Slurs & Insults', language: 'Singlish', severity: 'Low', replacement: 'less thoughtful / person', description: 'Mild insult meaning stupid' },
  { id: '14', word: 'hora', category: 'Singlish Slurs & Insults', language: 'Singlish', severity: 'Low', replacement: 'person who made a mistake', description: 'Derogatory label meaning thief' },
  { id: '15', word: 'durjanaya / narakaya / naraka', category: 'Singlish Slurs & Insults', language: 'Singlish', severity: 'Low', replacement: 'person / not good', description: 'Label meaning evil or bad person' },
  { id: '16', word: 'yako / yakka', category: 'Singlish Slurs & Insults', language: 'Singlish', severity: 'Low', replacement: 'person', description: 'Mild offensive exclamation or insult' },

  // ── 2. Threats & Violence ─────────────────────────────────────────────
  { id: '17', word: 'maranawa', category: 'Threats & Violence', language: 'Singlish', severity: 'Critical', replacement: 'talk to', description: 'Violent threat meaning to kill' },
  { id: '18', word: 'gahanawa', category: 'Threats & Violence', language: 'Singlish', severity: 'High', replacement: 'talk to', description: 'Physical threat meaning to hit or beat' },
  { id: '19', word: 'kill', category: 'Threats & Violence', language: 'English', severity: 'Critical', replacement: 'concern about', description: 'Direct violent threat in English' },
  { id: '20', word: 'palayan / palyan', category: 'Threats & Violence', language: 'Singlish', severity: 'Medium', replacement: 'please step back', description: 'Aggressive command meaning get lost' },

  // ── 3. English Profanity ──────────────────────────────────────────────
  { id: '21', word: 'fuck / fucking', category: 'English Profanity', language: 'English', severity: 'Critical', replacement: 'mess / [deleted]', description: 'Severe explicit English profanity' },
  { id: '22', word: 'shit', category: 'English Profanity', language: 'English', severity: 'High', replacement: 'rubbish', description: 'Vulgar expletive' },
  { id: '23', word: 'bitch', category: 'English Profanity', language: 'English', severity: 'Critical', replacement: 'person', description: 'Offensive gendered slur' },
  { id: '24', word: 'asshole', category: 'English Profanity', language: 'English', severity: 'High', replacement: 'person', description: 'Vulgar personal insult' },
  { id: '25', word: 'motherfucker', category: 'English Profanity', language: 'English', severity: 'Critical', replacement: 'person', description: 'Severe explicit profanity' },
  { id: '26', word: 'cunt', category: 'English Profanity', language: 'English', severity: 'Critical', replacement: 'person', description: 'Extremely explicit vulgar slur' },
  { id: '27', word: 'slut / whore', category: 'English Profanity', language: 'English', severity: 'Critical', replacement: 'person', description: 'Highly offensive misogynistic slur' },
  { id: '28', word: 'bastard', category: 'English Profanity', language: 'English', severity: 'High', replacement: 'person', description: 'Offensive derogatory insult' },
  { id: '29', word: 'dick / pussy', category: 'English Profanity', language: 'English', severity: 'High', replacement: 'unkind / hesitant', description: 'Vulgar anatomical slurs' },

  // ── 4. Personal Insults ──────────────────────────────────────────────
  { id: '30', word: 'hate', category: 'Personal Insults', language: 'English', severity: 'Medium', replacement: 'dislike', description: 'Hostile negative expression' },
  { id: '31', word: 'idiot', category: 'Personal Insults', language: 'English', severity: 'Medium', replacement: 'person', description: 'Direct personal insult' },
  { id: '32', word: 'stupid', category: 'Personal Insults', language: 'English', severity: 'Low', replacement: 'not very smart', description: 'Mild intellectual insult' },
  { id: '33', word: 'ugly', category: 'Personal Insults', language: 'English', severity: 'Medium', replacement: 'not very attractive', description: 'Personal appearance insult' },
  { id: '34', word: 'dumb', category: 'Personal Insults', language: 'English', severity: 'Low', replacement: 'less informed', description: 'Mild intelligence put-down' },
  { id: '35', word: 'useless', category: 'Personal Insults', language: 'English', severity: 'Medium', replacement: 'not very helpful', description: 'Derogatory put-down' },
  { id: '36', word: 'worst', category: 'Personal Insults', language: 'English', severity: 'Low', replacement: 'least impressive', description: 'Hyperbolic negative judgment' },

  // ── 5. Obscene & Explicit ─────────────────────────────────────────────
  { id: '37', word: 'puka', category: 'Obscene & Explicit', language: 'Singlish', severity: 'High', replacement: 'lower back', description: 'Obscene Sinhala body part reference' },
];

const SeverityBadge = ({ severity }: { severity: string }) => {
  const COLORS: Record<string, { bg: string; text: string; border: string }> = {
    Critical: { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30' },
    High: { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/30' },
    Medium: { bg: 'bg-yellow-500/15', text: 'text-yellow-400', border: 'border-yellow-500/30' },
    Low: { bg: 'bg-green-500/15', text: 'text-green-400', border: 'border-green-500/30' },
  };
  const c = COLORS[severity] ?? COLORS['Low'];
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${c.bg} ${c.text} ${c.border}`}>
      {severity}
    </span>
  );
};

const LanguageBadge = ({ language }: { language: 'Singlish' | 'English' }) => {
  const isSinglish = language === 'Singlish';
  return (
    <span
      className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
        isSinglish
          ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
          : 'bg-blue-500/15 text-blue-400 border-blue-500/30'
      }`}
    >
      {isSinglish ? '🇱🇰 Singlish' : '🌐 English'}
    </span>
  );
};

const CategoryBadge = ({ category }: { category: string }) => {
  const CAT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    'Singlish Slurs & Insults': { bg: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-rose-500/30' },
    'English Profanity': { bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/30' },
    'Threats & Violence': { bg: 'bg-red-600/20', text: 'text-red-400', border: 'border-red-500/40' },
    'Personal Insults': { bg: 'bg-sky-500/15', text: 'text-sky-400', border: 'border-sky-500/30' },
    'Obscene & Explicit': { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' },
  };
  const c = CAT_COLORS[category] ?? { bg: 'bg-slate-500/15', text: 'text-slate-400', border: 'border-slate-500/30' };
  return (
    <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${c.bg} ${c.text} ${c.border}`}>
      {category}
    </span>
  );
};

export function ToxicWordsTable() {
  const { colors } = useThemeColors();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');

  const categories = [
    'all',
    'Singlish Slurs & Insults',
    'English Profanity',
    'Threats & Violence',
    'Personal Insults',
    'Obscene & Explicit',
  ];

  const filteredWords = TOXIC_WORDS_DATABASE.filter((item) => {
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    if (selectedLanguage !== 'all' && item.language !== selectedLanguage) return false;
    if (selectedSeverity !== 'all' && item.severity !== selectedSeverity) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchWord = item.word.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      const matchRepl = item.replacement.toLowerCase().includes(q);
      if (!matchWord && !matchDesc && !matchRepl) return false;
    }
    return true;
  });

  // Calculate category metrics
  const totalCount = TOXIC_WORDS_DATABASE.length;
  const singlishCount = TOXIC_WORDS_DATABASE.filter((w) => w.language === 'Singlish').length;
  const englishCount = TOXIC_WORDS_DATABASE.filter((w) => w.language === 'English').length;

  return (
    <div className="space-y-4">
      {/* Category Summary Header Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          className="p-4 rounded-xl border flex flex-col justify-between"
          style={{ backgroundColor: colors.surface.primary, borderColor: colors.border.primary }}
        >
          <div className="flex items-center justify-between text-xs" style={{ color: colors.text.tertiary }}>
            <span>Total Monitored Words</span>
            <BookOpen size={16} className="text-indigo-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold" style={{ color: colors.text.primary }}>
              {totalCount}
            </span>
            <span className="text-xs" style={{ color: colors.text.tertiary }}>
              Keywords
            </span>
          </div>
        </div>

        <div
          className="p-4 rounded-xl border flex flex-col justify-between"
          style={{ backgroundColor: colors.surface.primary, borderColor: colors.border.primary }}
        >
          <div className="flex items-center justify-between text-xs" style={{ color: colors.text.tertiary }}>
            <span>Singlish Dictionary</span>
            <Tag size={16} className="text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-400">{singlishCount}</span>
            <span className="text-xs" style={{ color: colors.text.tertiary }}>
              Words
            </span>
          </div>
        </div>

        <div
          className="p-4 rounded-xl border flex flex-col justify-between"
          style={{ backgroundColor: colors.surface.primary, borderColor: colors.border.primary }}
        >
          <div className="flex items-center justify-between text-xs" style={{ color: colors.text.tertiary }}>
            <span>English Dictionary</span>
            <ShieldAlert size={16} className="text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-blue-400">{englishCount}</span>
            <span className="text-xs" style={{ color: colors.text.tertiary }}>
              Words
            </span>
          </div>
        </div>

        <div
          className="p-4 rounded-xl border flex flex-col justify-between"
          style={{ backgroundColor: colors.surface.primary, borderColor: colors.border.primary }}
        >
          <div className="flex items-center justify-between text-xs" style={{ color: colors.text.tertiary }}>
            <span>Categories</span>
            <Sparkles size={16} className="text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-400">5</span>
            <span className="text-xs" style={{ color: colors.text.tertiary }}>
              Active Groups
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-48">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: colors.text.tertiary }}
          />
          <input
            type="text"
            placeholder="Search toxic word, replacement, or category…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border focus:outline-none focus:ring-1"
            style={{
              backgroundColor: colors.surface.primary,
              borderColor: colors.border.primary,
              color: colors.text.primary,
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2"
            >
              <X size={12} style={{ color: colors.text.tertiary }} />
            </button>
          )}
        </div>

        <Filter size={13} style={{ color: colors.text.tertiary }} />

        {/* Category Filters */}
        <div className="flex flex-wrap gap-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className="px-2.5 py-1 rounded-full text-xs border transition-all"
              style={{
                backgroundColor: selectedCategory === cat ? colors.primary.main : 'transparent',
                color: selectedCategory === cat ? colors.primary.contrast : colors.text.secondary,
                borderColor: selectedCategory === cat ? colors.primary.main : colors.border.primary,
              }}
            >
              {cat === 'all' ? 'All Categories' : cat}
            </button>
          ))}
        </div>

        {/* Language Filter */}
        <div className="flex gap-1">
          {['all', 'Singlish', 'English'].map((lang) => (
            <button
              key={lang}
              onClick={() => setSelectedLanguage(lang)}
              className="px-2.5 py-1 rounded-full text-xs border transition-all"
              style={{
                backgroundColor: selectedLanguage === lang ? colors.primary.main : 'transparent',
                color: selectedLanguage === lang ? colors.primary.contrast : colors.text.secondary,
                borderColor: selectedLanguage === lang ? colors.primary.main : colors.border.primary,
              }}
            >
              {lang === 'all' ? 'All Languages' : lang}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ backgroundColor: colors.surface.primary, borderColor: colors.border.primary }}
      >
        <div
          className="flex items-center justify-between px-4 py-3 border-b"
          style={{ borderColor: colors.border.primary }}
        >
          <div className="flex items-center gap-2">
            <AlertOctagon size={16} className="text-red-400" />
            <h3 className="font-semibold text-sm" style={{ color: colors.text.primary }}>
              Categorized Toxic Words Dictionary
            </h3>
          </div>
          <span className="text-xs" style={{ color: colors.text.tertiary }}>
            {filteredWords.length} words listed
          </span>
        </div>

        <div className="overflow-x-auto">
          {filteredWords.length === 0 ? (
            <div className="py-12 text-center">
              <BookOpen size={32} className="mx-auto mb-3 opacity-20" style={{ color: colors.text.secondary }} />
              <p className="text-sm" style={{ color: colors.text.secondary }}>
                No toxic words found for the selected filters
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead style={{ backgroundColor: colors.background.secondary }}>
                <tr>
                  {['Toxic Word / Phrase', 'Category', 'Language', 'Severity', 'AI Neutral Replacement', 'Description'].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-3 text-xs font-medium whitespace-nowrap"
                        style={{ color: colors.text.tertiary }}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredWords.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t transition-colors hover:bg-white/5"
                    style={{ borderColor: colors.border.light }}
                  >
                    <td className="px-4 py-3 font-mono font-semibold text-red-400 whitespace-nowrap">
                      {item.word}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <CategoryBadge category={item.category} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <LanguageBadge language={item.language} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <SeverityBadge severity={item.severity} />
                    </td>
                    <td className="px-4 py-3 font-mono text-emerald-400 font-medium whitespace-nowrap">
                      &quot;{item.replacement}&quot;
                    </td>
                    <td className="px-4 py-3 max-w-xs text-xs" style={{ color: colors.text.secondary }}>
                      {item.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
