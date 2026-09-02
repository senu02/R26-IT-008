'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  Upload,
  Volume2,
  AlertTriangle,
  CheckCircle,
  FileAudio,
  Loader2,
  RefreshCw,
  Copy,
  Check,
  Tag,
  Flame,
  Shield,
  FileText,
  History,
  User,
  Clock,
  Filter
} from 'lucide-react';
import { ThemeProvider, useThemeColors } from '@/context/adminTheme';
import { toxicityAPI, AudioToxicityCheckResponse, ToxicityLog } from '@/app/services/ToxicityDetection/actions';

// List of known toxic / insult / slur words for word-level highlighting
const TOXIC_WORDS_SET = new Set([
  'hate', 'idiot', 'stupid', 'ugly', 'dumb', 'kill', 'fuck', 'fucking',
  'shit', 'bitch', 'useless', 'worst', 'asshole', 'motherfucker', 'cunt',
  'slut', 'whore', 'bastard', 'dick', 'pussy', 'huththo', 'huththa', 'huthto',
  'hutta', 'hutto', 'pakaya', 'pakayo', 'pakku', 'pako', 'ponnaya', 'ponnayo',
  'ponnayek', 'modaya', 'moda', 'wesige', 'wesiyek', 'wesi', 'kari', 'kariyo',
  'pissu', 'puka', 'maranawa', 'gahanawa', 'palayan', 'palyan', 'yako', 'yakka',
  'gon', 'gonwa', 'hora', 'durjanaya', 'narakaya', 'naraka', 'die', 'threat'
]);

// Map words to toxicity categories
const WORD_CATEGORY_MAP: Record<string, { category: string; severity: 'Critical' | 'High' | 'Medium' }> = {
  hate: { category: 'Hate Speech', severity: 'High' },
  kill: { category: 'Threat / Violence', severity: 'Critical' },
  die: { category: 'Threat / Violence', severity: 'Critical' },
  maranawa: { category: 'Threat / Violence', severity: 'Critical' },
  gahanawa: { category: 'Threat / Violence', severity: 'High' },
  fuck: { category: 'Profanity / Obscene', severity: 'High' },
  fucking: { category: 'Profanity / Obscene', severity: 'High' },
  shit: { category: 'Profanity / Obscene', severity: 'Medium' },
  bitch: { category: 'Insult / Slur', severity: 'High' },
  idiot: { category: 'Insult', severity: 'Medium' },
  stupid: { category: 'Insult', severity: 'Medium' },
  dumb: { category: 'Insult', severity: 'Medium' },
  asshole: { category: 'Insult / Obscene', severity: 'High' },
  bastard: { category: 'Insult / Slur', severity: 'High' },
  huththo: { category: 'Severe Obscene / Slur', severity: 'Critical' },
  huththa: { category: 'Severe Obscene / Slur', severity: 'Critical' },
  pakaya: { category: 'Severe Obscene / Slur', severity: 'Critical' },
  ponnaya: { category: 'Hate Speech / Slur', severity: 'Critical' },
  wesige: { category: 'Severe Obscene', severity: 'Critical' },
  kari: { category: 'Profanity / Slur', severity: 'High' },
  pissu: { category: 'Insult', severity: 'Medium' },
  yako: { category: 'Insult', severity: 'Medium' },
};

function AudioToxicityContent() {
  const { colors } = useThemeColors();

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Audio File State
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Analysis State
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AudioToxicityCheckResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Logs Table State
  const [logs, setLogs] = useState<ToxicityLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [filterToxic, setFilterToxic] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    fetchLogs();
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [audioUrl, filterToxic]);

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await toxicityAPI.getLogs({
        content_type: 'audio',
        is_toxic: filterToxic,
      });
      setLogs(res.results || []);
    } catch {
      // Ignore staff auth errors gracefully in UI preview
    } finally {
      setLoadingLogs(false);
    }
  };

  const startTimer = () => {
    setRecordingTime(0);
    timerIntervalRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  // Web Audio API PCM WAV Encoder
  const createWavBlob = async (audioChunksOrBlob: Blob[] | Blob): Promise<Blob> => {
    const rawBlob = Array.isArray(audioChunksOrBlob)
      ? new Blob(audioChunksOrBlob, { type: audioChunksOrBlob[0]?.type || 'audio/webm' })
      : audioChunksOrBlob;

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const arrayBuffer = await rawBlob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      const numOfChan = audioBuffer.numberOfChannels;
      const length = audioBuffer.length * numOfChan * 2 + 44;
      const buffer = new ArrayBuffer(length);
      const view = new DataView(buffer);
      const channels: Float32Array[] = [];
      let sampleRate = audioBuffer.sampleRate;
      let offset = 0;
      let pos = 0;

      function setUint16(data: number) {
        view.setUint16(pos, data, true);
        pos += 2;
      }
      function setUint32(data: number) {
        view.setUint32(pos, data, true);
        pos += 4;
      }

      setUint32(0x46464952); // "RIFF"
      setUint32(length - 8);
      setUint32(0x45564157); // "WAVE"
      setUint32(0x20746d66); // "fmt "
      setUint32(16);
      setUint16(1); // PCM
      setUint16(numOfChan);
      setUint32(sampleRate);
      setUint32(sampleRate * 2 * numOfChan);
      setUint16(numOfChan * 2);
      setUint16(16);
      setUint32(0x61746164); // "data"
      setUint32(length - pos - 4);

      for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
        channels.push(audioBuffer.getChannelData(i));
      }

      while (pos < length) {
        for (let i = 0; i < numOfChan; i++) {
          let sample = Math.max(-1, Math.min(1, channels[i][offset]));
          sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
          view.setInt16(pos, sample, true);
          pos += 2;
        }
        offset++;
      }

      return new Blob([buffer], { type: 'audio/wav' });
    } catch {
      return rawBlob;
    }
  };

  const startRecording = async () => {
    setError(null);
    setResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const wavBlob = await createWavBlob(audioChunksRef.current);
        const url = URL.createObjectURL(wavBlob);
        setAudioBlob(wavBlob);
        setAudioUrl(url);
        setFileName(`mic_audio_${new Date().toISOString().slice(11, 19).replace(/:/g, '-')}.wav`);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      startTimer();
    } catch {
      setError('Microphone access denied or not supported in browser.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      stopTimer();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setResult(null);
    try {
      const wavBlob = await createWavBlob(file);
      const url = URL.createObjectURL(wavBlob);
      const cleanName = file.name.endsWith('.wav') ? file.name : `${file.name.replace(/\.[^/.]+$/, '')}.wav`;
      setAudioBlob(wavBlob);
      setAudioUrl(url);
      setFileName(cleanName);
    } catch {
      const url = URL.createObjectURL(file);
      setAudioBlob(file);
      setAudioUrl(url);
      setFileName(file.name);
    }
  };

  const handleAnalyze = async () => {
    if (!audioBlob) return;

    setAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const res = await toxicityAPI.checkAudio(audioBlob);
      setResult(res);
      if (res.error && !res.transcribed_text) {
        setError(res.error);
      } else {
        fetchLogs(); // refresh backend logs table
      }
    } catch (err: any) {
      setError(err.message || 'Failed to analyze audio toxicity');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleReset = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setFileName(null);
    setResult(null);
    setError(null);
    setRecordingTime(0);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Render text with highlighted toxic words
  const renderHighlightedText = (text: string) => {
    if (!text) return null;
    const words = text.split(/\s+/);
    return (
      <div className="flex flex-wrap gap-1 items-center">
        {words.map((w, idx) => {
          const clean = w.toLowerCase().replace(/[^a-z0-9]/g, '');
          const isToxic = TOXIC_WORDS_SET.has(clean);
          if (isToxic) {
            return (
              <span
                key={idx}
                className="px-1.5 py-0.5 rounded font-bold text-red-300 bg-red-500/20 border border-red-500/40 text-xs"
              >
                {w}
              </span>
            );
          }
          return (
            <span key={idx} className="text-xs" style={{ color: colors.text.primary }}>
              {w}
            </span>
          );
        })}
      </div>
    );
  };

  const extractIdentifiedToxicWords = (text: string) => {
    if (!text) return [];
    const words = text.split(/\s+/);
    const identified: { word: string; cleanWord: string; info: { category: string; severity: 'Critical' | 'High' | 'Medium' } }[] = [];
    const seen = new Set<string>();

    words.forEach((w) => {
      const clean = w.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (TOXIC_WORDS_SET.has(clean) && !seen.has(clean)) {
        seen.add(clean);
        const info = WORD_CATEGORY_MAP[clean] || { category: 'Toxic Keyword', severity: 'High' };
        identified.push({ word: w, cleanWord: clean, info });
      }
    });

    return identified;
  };

  const identifiedToxicWords = result?.transcribed_text ? extractIdentifiedToxicWords(result.transcribed_text) : [];

  return (
    <div className="space-y-6 pb-12" style={{ backgroundColor: colors.background.primary }}>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold" style={{ color: colors.text.primary }}>
              Audio Toxicity & Word Identifier
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500/15 text-red-400 border border-red-500/30">
              AI Powered
            </span>
          </div>
          <p className="mt-1 text-sm" style={{ color: colors.text.secondary }}>
            Transcribe speech from audio files or voice recordings, detect toxicity scores, and pinpoint specific toxic words.
          </p>
        </div>

        {audioBlob && (
          <button
            onClick={handleReset}
            className="px-3.5 py-2 rounded-xl text-xs font-medium border flex items-center gap-2 transition-all hover:opacity-75 self-start sm:self-auto"
            style={{ borderColor: colors.border.primary, color: colors.text.secondary }}
          >
            <RefreshCw size={14} /> Reset Scanner
          </button>
        )}
      </div>

      {/* Main Scanner Section */}
      <div
        className="p-6 rounded-2xl border shadow-xl space-y-6"
        style={{ backgroundColor: colors.surface.primary, borderColor: colors.border.primary }}
      >
        {/* Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Record Voice Button */}
          <div
            className="p-6 rounded-2xl border flex flex-col items-center justify-center text-center gap-4 transition-all"
            style={{
              backgroundColor: isRecording ? 'rgba(239, 68, 68, 0.05)' : colors.background.primary,
              borderColor: isRecording ? colors.primary.main : colors.border.primary,
            }}
          >
            {isRecording ? (
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-red-500/20 animate-ping absolute inset-0" />
                  <button
                    onClick={stopRecording}
                    className="relative z-10 w-16 h-16 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xl hover:bg-red-700 transition-all active:scale-95"
                  >
                    <Square size={24} />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-sm font-mono font-bold" style={{ color: colors.text.primary }}>
                    {formatTime(recordingTime)}
                  </span>
                </div>
                <p className="text-xs text-red-400 font-medium">Recording in progress… Click to finish</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2.5">
                <button
                  onClick={startRecording}
                  disabled={!!audioBlob}
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
                  style={{ backgroundColor: colors.primary.main, color: colors.primary.contrast }}
                >
                  <Mic size={26} />
                </button>
                <p className="text-sm font-bold" style={{ color: colors.text.primary }}>
                  Record Voice Speech
                </p>
                <p className="text-xs" style={{ color: colors.text.secondary }}>
                  Speak English or Singlish phrases into microphone
                </p>
              </div>
            )}
          </div>

          {/* Upload Audio File Button */}
          <div
            onClick={() => !audioBlob && fileInputRef.current?.click()}
            className={`p-6 rounded-2xl border border-dashed flex flex-col items-center justify-center text-center gap-2.5 transition-all ${
              !audioBlob ? 'cursor-pointer hover:border-primary' : 'opacity-50 cursor-not-allowed'
            }`}
            style={{ backgroundColor: colors.background.primary, borderColor: colors.border.primary }}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="audio/*,.wav,.mp3,.ogg,.m4a,.webm"
              className="hidden"
            />
            <div className="p-3.5 rounded-2xl" style={{ backgroundColor: `${colors.primary.main}15`, color: colors.primary.main }}>
              <Upload size={26} />
            </div>
            <p className="text-sm font-bold" style={{ color: colors.text.primary }}>
              Upload Audio File
            </p>
            <p className="text-xs" style={{ color: colors.text.secondary }}>
              Supports WAV, MP3, OGG, WEBM, M4A
            </p>
          </div>
        </div>

        {/* Selected Audio Preview Player & Analyze Button */}
        {audioUrl && (
          <div
            className="p-4 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-4"
            style={{ backgroundColor: colors.background.primary, borderColor: colors.border.primary }}
          >
            <div className="flex items-center gap-3.5 w-full sm:w-auto">
              <div className="p-3 rounded-xl" style={{ backgroundColor: `${colors.primary.main}20`, color: colors.primary.main }}>
                <FileAudio size={22} />
              </div>
              <div className="truncate max-w-xs">
                <p className="text-xs font-bold truncate" style={{ color: colors.text.primary }}>
                  {fileName || 'Selected Audio File'}
                </p>
                <p className="text-[11px]" style={{ color: colors.text.secondary }}>
                  Ready for AI speech-to-text & toxicity scan
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <audio controls src={audioUrl} className="h-9 max-w-[220px]" />
              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: colors.primary.main, color: colors.primary.contrast }}
              >
                {analyzing ? (
                  <>
                    <Loader2 size={15} className="animate-spin" /> Analyzing Speech…
                  </>
                ) : (
                  <>
                    <Volume2 size={15} /> Analyze Audio
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-red-400 text-xs font-medium">
            <AlertTriangle size={20} className="shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Analysis Results Display */}
        {result && (
          <div className="space-y-6 pt-2">
            {/* Header Verdict Badge */}
            <div
              className="p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              style={{
                backgroundColor: result.is_toxic ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                borderColor: result.is_toxic ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)',
              }}
            >
              <div className="flex items-center gap-3">
                {result.is_toxic ? (
                  <div className="p-2.5 rounded-xl bg-red-500 text-white shadow-md">
                    <AlertTriangle size={22} />
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-emerald-500 text-white shadow-md">
                    <CheckCircle size={22} />
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-bold" style={{ color: result.is_toxic ? '#ef4444' : '#10b981' }}>
                    {result.is_toxic ? 'Toxic Content Identified in Audio' : 'Speech Verified Safe / Non-Toxic'}
                  </h3>
                  <p className="text-xs text-gray-400">
                    {result.is_toxic
                      ? `Highest Confidence Toxicity Score: ${Math.round(result.max_score * 100)}%`
                      : 'No toxic speech patterns or prohibited slurs detected.'}
                  </p>
                </div>
              </div>

              {result.flagged_labels?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {result.flagged_labels.map((lbl) => (
                    <span key={lbl} className="px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase bg-red-500/20 text-red-400 border border-red-500/30">
                      {lbl}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Transcribed Speech Box with Highlighted Words */}
            <div className="p-5 rounded-2xl border space-y-3" style={{ backgroundColor: colors.background.primary, borderColor: colors.border.primary }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: colors.text.secondary }}>
                  <FileText size={14} /> Converted Speech-to-Text:
                </span>
                {result.transcribed_text && (
                  <button
                    onClick={() => copyToClipboard(result.transcribed_text)}
                    className="text-xs flex items-center gap-1 font-semibold hover:opacity-75"
                    style={{ color: colors.primary.main }}
                  >
                    {copied ? <Check size={13} /> : <Copy size={13} />}
                    {copied ? 'Copied' : 'Copy Text'}
                  </button>
                )}
              </div>

              <div className="p-4 rounded-xl text-base leading-relaxed border bg-black/20" style={{ borderColor: colors.border.primary }}>
                {result.transcribed_text ? (
                  <div className="flex flex-wrap gap-1.5 items-center">
                    {result.transcribed_text.split(/\s+/).map((w, idx) => {
                      const clean = w.toLowerCase().replace(/[^a-z0-9]/g, '');
                      const isToxic = TOXIC_WORDS_SET.has(clean);

                      if (isToxic) {
                        return (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md font-bold text-red-300 bg-red-500/25 border border-red-500/50 shadow-sm animate-pulse"
                            title="Toxic Word Identified"
                          >
                            {w}
                          </span>
                        );
                      }
                      return (
                        <span key={idx} style={{ color: colors.text.primary }}>
                          {w}
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <span className="italic text-xs text-gray-500">No speech could be recognized from the audio.</span>
                )}
              </div>
            </div>

            {/* Identified Toxic Words Table */}
            {identifiedToxicWords.length > 0 && (
              <div className="p-5 rounded-2xl border space-y-3" style={{ backgroundColor: colors.background.primary, borderColor: colors.border.primary }}>
                <div className="flex items-center gap-2">
                  <Flame size={16} className="text-red-500" />
                  <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: colors.text.primary }}>
                    Identified Toxic Words Breakdown ({identifiedToxicWords.length})
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {identifiedToxicWords.map(({ word, cleanWord, info }) => (
                    <div
                      key={cleanWord}
                      className="p-3 rounded-xl border bg-red-500/05 border-red-500/20 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <Tag size={15} className="text-red-400" />
                        <div>
                          <span className="text-sm font-bold text-red-400 block">{word}</span>
                          <span className="text-[11px] text-gray-400">{info.category}</span>
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          info.severity === 'Critical'
                            ? 'bg-red-600 text-white'
                            : info.severity === 'High'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-yellow-500/20 text-yellow-300'
                        }`}
                      >
                        {info.severity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Frontend Users Flagged Audio & Speech Logs Table */}
      <div
        className="p-6 rounded-2xl border shadow-xl space-y-4"
        style={{ backgroundColor: colors.surface.primary, borderColor: colors.border.primary }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <History size={18} style={{ color: colors.primary.main }} />
            <div>
              <h2 className="text-base font-bold" style={{ color: colors.text.primary }}>
                Frontend Users Flagged Speech & Audio Logs
              </h2>
              <p className="text-xs" style={{ color: colors.text.secondary }}>
                Real-time speech transcriptions automatically audited when users post audio
              </p>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            <button
              onClick={() => setFilterToxic(undefined)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterToxic === undefined ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
              }`}
            >
              All Logs
            </button>
            <button
              onClick={() => setFilterToxic(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterToxic === true ? 'bg-red-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
              }`}
            >
              Toxic Flags Only
            </button>
          </div>
        </div>

        {loadingLogs ? (
          <div className="p-8 text-center text-xs flex items-center justify-center gap-2" style={{ color: colors.text.secondary }}>
            <Loader2 size={16} className="animate-spin" /> Loading audio audit logs…
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-xs border border-dashed rounded-xl" style={{ borderColor: colors.border.primary, color: colors.text.secondary }}>
            No speech toxicity logs recorded yet. Upload or record audio above to generate logs.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b" style={{ borderColor: colors.border.primary, color: colors.text.secondary }}>
                  <th className="py-3 px-3 font-semibold">User</th>
                  <th className="py-3 px-3 font-semibold">Transcribed Speech Text</th>
                  <th className="py-3 px-3 font-semibold">Verdict</th>
                  <th className="py-3 px-3 font-semibold">Max Score</th>
                  <th className="py-3 px-3 font-semibold">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: colors.border.primary }}>
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/05 transition-colors">
                    <td className="py-3 px-3 font-medium" style={{ color: colors.text.primary }}>
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-gray-400 shrink-0" />
                        <span className="truncate max-w-[120px]">{log.author_email || log.author || 'Anonymous'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 max-w-sm">
                      {renderHighlightedText(log.analysed_text)}
                    </td>
                    <td className="py-3 px-3">
                      {log.is_toxic ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                          Toxic Speech
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Clean
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold" style={{ color: log.is_toxic ? '#ef4444' : colors.text.primary }}>
                      {Math.round(log.max_score * 100)}%
                    </td>
                    <td className="py-3 px-3 text-gray-400">
                      <div className="flex items-center gap-1">
                        <Clock size={12} />
                        {new Date(log.created_at).toLocaleString()}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminAudioToxicityPage() {
  return (
    <ThemeProvider>
      <AudioToxicityContent />
    </ThemeProvider>
  );
}
