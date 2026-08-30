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
  Sparkles,
  Copy,
  Check
} from 'lucide-react';
import { useThemeColors } from '@/context/adminTheme';
import { toxicityAPI, AudioToxicityCheckResponse } from '@/app/services/ToxicityDetection/actions';

export function AudioToxicityTester() {
  const { colors } = useThemeColors();

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Audio State
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Analysis State
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AudioToxicityCheckResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Clean up object URLs
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [audioUrl]);

  // Handle Recording Timer
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

  // Convert WebM/Audio Buffer to WAV format for maximum compatibility
  const createWavBlob = async (audioChunks: Blob[]): Promise<Blob> => {
    const rawBlob = new Blob(audioChunks, { type: audioChunks[0]?.type || 'audio/webm' });
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

      // WAV Header
      setUint32(0x46464952); // "RIFF"
      setUint32(length - 8); // file length - 8
      setUint32(0x45564157); // "WAVE"
      setUint32(0x20746d66); // "fmt " chunk
      setUint32(16); // length = 16
      setUint16(1); // PCM (uncompressed)
      setUint16(numOfChan);
      setUint32(sampleRate);
      setUint32(sampleRate * 2 * numOfChan); // avg. bytes/sec
      setUint16(numOfChan * 2); // block-align
      setUint16(16); // 16-bit
      setUint32(0x61746164); // "data" chunk
      setUint32(length - pos - 4); // chunk length

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
      // Fallback to raw recorded blob
      return rawBlob;
    }
  };

  // Start Mic Recording
  const startRecording = async () => {
    setError(null);
    setResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const wavBlob = await createWavBlob(audioChunksRef.current);
        const url = URL.createObjectURL(wavBlob);
        setAudioBlob(wavBlob);
        setAudioUrl(url);
        setFileName(`voice_record_${new Date().toISOString().slice(11, 19).replace(/:/g, '-')}.wav`);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      startTimer();
    } catch (err: any) {
      setError('Microphone access denied or not available in your browser.');
    }
  };

  // Stop Mic Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      stopTimer();
    }
  };

  // Handle File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setResult(null);

    try {
      const wavBlob = await createWavBlob([file]);
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

  // Run Analysis
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
      }
    } catch (err: any) {
      setError(err.message || 'Failed to analyze audio');
    } finally {
      setAnalyzing(false);
    }
  };

  // Reset Form
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className="p-6 rounded-2xl border shadow-lg space-y-6"
      style={{
        backgroundColor: colors.surface.primary,
        borderColor: colors.border.primary,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: colors.border.primary }}>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${colors.primary.main}15`, color: colors.primary.main }}>
            <Sparkles size={22} />
          </div>
          <div>
            <h2 className="text-lg font-bold" style={{ color: colors.text.primary }}>
              Audio Speech-to-Text Toxicity Scanner
            </h2>
            <p className="text-xs" style={{ color: colors.text.secondary }}>
              Record voice or upload audio to transcribe speech and check for toxicity.
            </p>
          </div>
        </div>

        {audioBlob && (
          <button
            onClick={handleReset}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-opacity hover:opacity-70"
            style={{ borderColor: colors.border.primary, color: colors.text.secondary }}
          >
            <RefreshCw size={13} /> Reset
          </button>
        )}
      </div>

      {/* Recording & Upload Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Record Option */}
        <div
          className="p-5 rounded-xl border flex flex-col items-center justify-center text-center gap-3 transition-all"
          style={{
            backgroundColor: isRecording ? `${colors.primary.main}08` : colors.background.primary,
            borderColor: isRecording ? colors.primary.main : colors.border.primary,
          }}
        >
          {isRecording ? (
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-red-500/20 animate-ping absolute inset-0" />
                <button
                  onClick={stopRecording}
                  className="relative z-10 w-16 h-16 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg hover:bg-red-700 transition-transform active:scale-95"
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
              <p className="text-xs text-red-400 font-medium">Recording in progress… Click to stop</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={startRecording}
                disabled={!!audioBlob}
                className="w-14 h-14 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-md disabled:opacity-40 disabled:hover:scale-100"
                style={{
                  backgroundColor: colors.primary.main,
                  color: colors.primary.contrast,
                }}
              >
                <Mic size={24} />
              </button>
              <p className="text-xs font-semibold mt-1" style={{ color: colors.text.primary }}>
                Record Voice
              </p>
              <p className="text-[11px]" style={{ color: colors.text.secondary }}>
                Speak into your microphone
              </p>
            </div>
          )}
        </div>

        {/* Upload Option */}
        <div
          onClick={() => !audioBlob && fileInputRef.current?.click()}
          className={`p-5 rounded-xl border border-dashed flex flex-col items-center justify-center text-center gap-2 transition-all ${
            !audioBlob ? 'cursor-pointer hover:border-primary' : 'opacity-60 cursor-not-allowed'
          }`}
          style={{
            backgroundColor: colors.background.primary,
            borderColor: colors.border.primary,
          }}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="audio/*,.wav,.mp3,.ogg,.m4a,.webm"
            className="hidden"
          />
          <div className="p-3 rounded-full" style={{ backgroundColor: `${colors.primary.main}15`, color: colors.primary.main }}>
            <Upload size={22} />
          </div>
          <p className="text-xs font-semibold" style={{ color: colors.text.primary }}>
            Upload Audio File
          </p>
          <p className="text-[11px]" style={{ color: colors.text.secondary }}>
            WAV, MP3, OGG, WEBM, M4A
          </p>
        </div>
      </div>

      {/* Selected Audio Preview */}
      {audioUrl && (
        <div
          className="p-4 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ backgroundColor: colors.background.primary, borderColor: colors.border.primary }}
        >
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="p-2.5 rounded-lg" style={{ backgroundColor: `${colors.primary.main}20`, color: colors.primary.main }}>
              <FileAudio size={20} />
            </div>
            <div className="truncate max-w-xs">
              <p className="text-xs font-semibold truncate" style={{ color: colors.text.primary }}>
                {fileName || 'Selected Audio'}
              </p>
              <p className="text-[10px]" style={{ color: colors.text.secondary }}>
                Ready for speech transcription & analysis
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <audio controls src={audioUrl} className="h-9 max-w-[220px]" />
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 shadow-md transition-all hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: colors.primary.main, color: colors.primary.contrast }}
            >
              {analyzing ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Analyzing…
                </>
              ) : (
                <>
                  <Volume2 size={14} /> Analyze Speech
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-red-400 text-xs font-medium">
          <AlertTriangle size={18} className="shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Analysis Results Display */}
      {result && (
        <div
          className="p-5 rounded-xl border space-y-4 transition-all"
          style={{ backgroundColor: colors.background.primary, borderColor: colors.border.primary }}
        >
          <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: colors.border.primary }}>
            <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: colors.text.primary }}>
              Analysis Results
            </h3>

            <div className="flex items-center gap-2">
              {result.is_toxic ? (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/15 text-red-500 border border-red-500/30 flex items-center gap-1.5">
                  <AlertTriangle size={13} /> Toxic Content Flagged ({Math.round(result.max_score * 100)}%)
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 flex items-center gap-1.5">
                  <CheckCircle size={13} /> Safe / Non-Toxic
                </span>
              )}
            </div>
          </div>

          {/* Transcribed Text Display */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.text.secondary }}>
                Converted Speech-to-Text:
              </span>
              {result.transcribed_text && (
                <button
                  onClick={() => copyToClipboard(result.transcribed_text)}
                  className="text-[11px] flex items-center gap-1 hover:opacity-75"
                  style={{ color: colors.primary.main }}
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              )}
            </div>

            <div
              className="p-3.5 rounded-xl text-sm italic border font-serif"
              style={{
                backgroundColor: colors.surface.primary,
                borderColor: colors.border.primary,
                color: result.transcribed_text ? colors.text.primary : colors.text.secondary,
              }}
            >
              {result.transcribed_text ? `"${result.transcribed_text}"` : 'No clear speech detected in audio.'}
            </div>
          </div>

          {/* Toxicity Category Scores Grid */}
          {result.labels && Object.keys(result.labels).length > 0 && (
            <div className="space-y-2 pt-2">
              <span className="text-xs font-semibold uppercase tracking-wider block" style={{ color: colors.text.secondary }}>
                Category Confidence Breakdown:
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {Object.entries(result.labels).map(([label, score]) => {
                  const percent = Math.round(score * 100);
                  const isFlagged = score >= 0.5;

                  return (
                    <div
                      key={label}
                      className="p-2.5 rounded-lg border flex flex-col gap-1"
                      style={{
                        backgroundColor: isFlagged ? 'rgba(239, 68, 68, 0.08)' : colors.surface.primary,
                        borderColor: isFlagged ? 'rgba(239, 68, 68, 0.3)' : colors.border.primary,
                      }}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="capitalize font-medium" style={{ color: isFlagged ? '#ef4444' : colors.text.primary }}>
                          {label.replace('_', ' ')}
                        </span>
                        <span className="font-mono text-[11px] font-bold" style={{ color: isFlagged ? '#ef4444' : colors.text.secondary }}>
                          {percent}%
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-1.5 rounded-full bg-gray-700/20 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            percent >= 50 ? 'bg-red-500' : percent >= 25 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AudioToxicityTester;
