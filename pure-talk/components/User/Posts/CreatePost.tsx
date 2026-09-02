import React, { useState, useEffect, useRef } from 'react';
import { ThemeColors } from '@/context/theme';
import { getCurrentUserAvatar, getCurrentUserData, getFallbackAvatarUrl } from '@/app/services/posts/actions';
import { Image, Smile, SendHorizontal, X, Mic, Square, AlertTriangle, CheckCircle, FileAudio, Loader2 } from 'lucide-react';
import { useToast } from '@/context/userToast';
import { toxicityAPI, AudioToxicityCheckResponse } from '@/app/services/ToxicityDetection/actions';
import Tesseract from 'tesseract.js';

interface CreatePostProps {
  theme: ThemeColors;
  isDark: boolean;
  onPost: (content: string, image?: File) => void;
}

const CreatePost: React.FC<CreatePostProps> = ({ theme, isDark, onPost }) => {
  const [content, setContent] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [avatarError, setAvatarError] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Image Toxicity OCR State
  const [isScanningImage, setIsScanningImage] = useState(false);
  const [imageToxicityResult, setImageToxicityResult] = useState<{
    extractedText: string;
    isToxic: boolean;
    maxScore: number;
    flaggedLabels: string[];
  } | null>(null);

  // Audio Toxicity State
  const [selectedAudio, setSelectedAudio] = useState<File | Blob | null>(null);
  const [audioName, setAudioName] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [audioToxicityResult, setAudioToxicityResult] = useState<AudioToxicityCheckResponse | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  useEffect(() => {
    const loadUserData = () => {
      const avatar = getCurrentUserAvatar();
      const userData = getCurrentUserData();
      const name = userData?.full_name || userData?.display_name || userData?.email?.split('@')[0] || 'User';
      
      setUserAvatar(avatar);
      setUserName(name);
      setAvatarError(false);
    };
    
    loadUserData();
    
    window.addEventListener('storage', loadUserData);
    return () => window.removeEventListener('storage', loadUserData);
  }, []);

  const TOXIC_WORDS_SET = new Set([
    'hate', 'idiot', 'stupid', 'ugly', 'dumb', 'kill', 'fuck', 'fucking',
    'shit', 'bitch', 'useless', 'worst', 'asshole', 'motherfucker', 'cunt',
    'slut', 'whore', 'bastard', 'dick', 'pussy', 'huththo', 'huththa', 'huthto',
    'hutta', 'hutto', 'pakaya', 'pakayo', 'pakku', 'pako', 'ponnaya', 'ponnayo',
    'ponnayek', 'modaya', 'moda', 'wesige', 'wesiyek', 'wesi', 'kari', 'kariyo',
    'pissu', 'puka', 'maranawa', 'gahanawa', 'palayan', 'palyan', 'yako', 'yakka',
    'gon', 'gonwa', 'hora', 'durjanaya', 'narakaya', 'naraka', 'die', 'threat',
    'abuse', 'abusive', 'scam', 'fraud', 'racist', 'nigger', 'nigga', 'retard',
    'hump', 'humping', 'mudding', 'nude', 'nudes', 'naked', 'sex', 'sexy',
    'sexual', 'porn', 'porno', 'nsfw', 'erotic', 'boobs', 'tits', 'butt', 'ass',
    'penis', 'vagina', 'cock', 'horny', 'bra', 'panties', 'intercourse', 'orgasm'
  ]);

  const preprocessImageToCanvas = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      const reader = new FileReader();
      reader.onload = (e) => {
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }
          const scale = img.width < 1000 ? 2 : 1;
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          for (let i = 0; i < data.length; i += 4) {
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            const v = avg > 128 ? 255 : 0;
            data[i] = v;
            data[i + 1] = v;
            data[i + 2] = v;
          }
          ctx.putImageData(imageData, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => resolve(e.target?.result as string);
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve(URL.createObjectURL(file));
      reader.readAsDataURL(file);
    });
  };

  const processImageForToxicity = async (file: File) => {
    setIsScanningImage(true);
    setImageToxicityResult(null);

    try {
      // 1. Run inference on trained MobileNetV2 / PKL Deep Learning Image Model
      const modelRes = await toxicityAPI.checkImage(file).catch((err) => {
        console.warn('Backend MobileNetV2 image ML model check failed:', err);
        return null;
      });

      // 2. Run OCR Text Extraction
      let ocrText = '';
      try {
        let result = await Tesseract.recognize(file, 'eng');
        ocrText = result?.data?.text ? result.data.text.trim() : '';
        if (!ocrText) {
          const canvasDataUrl = await preprocessImageToCanvas(file);
          const canvasResult = await Tesseract.recognize(canvasDataUrl, 'eng');
          ocrText = canvasResult?.data?.text ? canvasResult.data.text.trim() : '';
        }
      } catch (ocrErr) {
        console.warn('OCR scan error:', ocrErr);
      }

      // Check text toxicity if text extracted
      let textToxicityRes = { is_toxic: false, max_score: 0, flagged_labels: [] as string[] };
      if (ocrText) {
        textToxicityRes = await toxicityAPI.checkText(ocrText).catch(() => ({
          is_toxic: false,
          max_score: 0,
          flagged_labels: [],
        }));
      }

      // Check keyword dictionary
      const words = ocrText.toLowerCase().split(/\s+/);
      const flaggedWords = words.filter((w) => {
        const clean = w.replace(/[^a-z0-9]/g, '');
        return TOXIC_WORDS_SET.has(clean);
      });

      const isModelToxic = modelRes?.is_toxic ?? false;
      const isTextToxic = textToxicityRes.is_toxic || flaggedWords.length > 0;
      const isToxic = isModelToxic || isTextToxic;

      const flaggedLabels = [...(textToxicityRes.flagged_labels || [])];
      if (isModelToxic && !flaggedLabels.includes('mobilenetv2_image_classifier')) {
        flaggedLabels.push('mobilenetv2_image_classifier');
      }
      if (flaggedWords.length > 0 && !flaggedLabels.includes('prohibited_words')) {
        flaggedLabels.push('prohibited_words');
      }

      const maxScore = isToxic
        ? Math.max(modelRes?.toxic_probability || 0, textToxicityRes.max_score || 0, 0.85)
        : 0;

      setImageToxicityResult({
        extractedText: ocrText,
        isToxic,
        maxScore,
        flaggedLabels,
      });

      if (isToxic) {
        toast.showError(
          isModelToxic
            ? `Toxic Image detected by MobileNetV2 ML Model!`
            : `Toxic text detected in image!`
        );
      } else {
        toast.showInfo('Image scanned: Verified Safe by MobileNetV2 Model');
      }
    } catch (err: any) {
      console.warn('Image toxicity processing failed:', err);
    } finally {
      setIsScanningImage(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.showError('Image size should be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.showError('Please select an image file');
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      processImageForToxicity(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setImageToxicityResult(null);
    setIsScanningImage(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const convertToWavBlob = async (rawAudio: File | Blob): Promise<Blob> => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const arrayBuffer = await rawAudio.arrayBuffer();
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
    } catch (err) {
      console.warn('WAV conversion fallback:', err);
      return rawAudio;
    }
  };

  // Process Audio File or Recorded Audio Blob for Speech Toxicity
  const processAudioForToxicity = async (fileOrBlob: File | Blob, name: string) => {
    setIsTranscribing(true);
    setAudioToxicityResult(null);

    try {
      // Convert to genuine 16-bit PCM RIFF WAV format
      const wavBlob = await convertToWavBlob(fileOrBlob);
      const cleanName = name.endsWith('.wav') ? name : `${name.replace(/\.[^/.]+$/, '')}.wav`;

      setSelectedAudio(wavBlob);
      setAudioName(cleanName);

      const res = await toxicityAPI.checkAudio(wavBlob);
      setAudioToxicityResult(res);

      if (res.is_toxic) {
        toast.showError(`Toxic speech detected in audio! ("${res.transcribed_text.substring(0, 40)}...")`);
      } else if (res.transcribed_text) {
        toast.showInfo(`Speech transcribed: "${res.transcribed_text}"`);
        // Automatically append or set transcribed text in post body
        setContent((prev) => (prev ? `${prev}\n\n[Transcribed Audio]: ${res.transcribed_text}` : res.transcribed_text));
      } else if (res.error) {
        toast.showError(`Audio error: ${res.error}`);
      }
    } catch (err: any) {
      toast.showError(err.message || 'Failed to analyze audio toxicity');
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) {
        toast.showError('Audio file size should be less than 15MB');
        return;
      }
      processAudioForToxicity(file, file.name);
    }
  };

  // Mic Recording Controls
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const rawBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const name = `recorded_voice_${new Date().toISOString().slice(11, 19).replace(/:/g, '-')}.wav`;
        await processAudioForToxicity(rawBlob, name);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      toast.showError('Microphone access denied or unavailable');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const removeAudio = () => {
    setSelectedAudio(null);
    setAudioName(null);
    setAudioToxicityResult(null);
    if (audioInputRef.current) {
      audioInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (imageToxicityResult?.isToxic) {
      toast.showError('Cannot post: Image contains toxic text!');
      return;
    }

    if (audioToxicityResult?.is_toxic) {
      toast.showError('Cannot post: Audio contains toxic speech!');
      return;
    }

    if ((content.trim() || selectedImage || selectedAudio) && !isSubmitting) {
      setIsSubmitting(true);
      try {
        await onPost(content, selectedImage || undefined);
        setContent('');
        removeImage();
        removeAudio();
        setIsFocused(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const getAvatarSrc = (): string | null => {
    if (avatarError) {
      return getFallbackAvatarUrl(userName);
    }
    if (userAvatar && userAvatar.trim() !== '' && userAvatar !== 'null' && userAvatar !== 'undefined') {
      return userAvatar;
    }
    return null;
  };

  const avatarSrc = getAvatarSrc();

  return (
    <div className={`${theme.surface.glass} ${theme.surface.border} rounded-2xl mb-6 transition-all duration-300 overflow-hidden`}>
      {/* Create Post Header */}
      <div className="p-4 pb-2 flex items-center space-x-3">
        <div className="flex-shrink-0">
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt={userName}
              className="w-10 h-10 rounded-full object-cover"
              onError={() => setAvatarError(true)}
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#fd297b] to-[#ff655b] flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
        <div 
          onClick={() => setIsFocused(true)}
          className={`flex-1 ${theme.surface.glassHover} rounded-full px-4 py-2.5 cursor-text transition-all duration-200`}
        >
          <span className={`${theme.text.muted} text-sm`}>
            {isFocused ? '' : `What's on your mind, ${userName.split(' ')[0]}?`}
          </span>
        </div>
      </div>

      {/* Expanded Post Area */}
      {isFocused && (
        <div className="px-4 pb-4">
          <textarea
            placeholder={`What's on your mind, ${userName.split(' ')[0]}?`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className={`w-full bg-transparent ${theme.text.primary} placeholder:${theme.text.muted} outline-none resize-none text-base py-2`}
            rows={3}
            autoFocus
          />

          {/* Image Preview */}
          {imagePreview && (
            <div className="mt-2 space-y-2">
              <div className="relative rounded-xl overflow-hidden border border-white/10">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="w-full max-h-80 object-contain bg-black/20"
                />
                <button
                  onClick={removeImage}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Image OCR Scanning State */}
              {isScanningImage && (
                <div className="p-2.5 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center gap-2 text-xs text-purple-300">
                  <Loader2 size={14} className="animate-spin text-purple-400" />
                  <span>Scanning text in image for toxicity (OCR)…</span>
                </div>
              )}

              {/* Image Toxicity OCR Result */}
              {imageToxicityResult && !isScanningImage && (
                <div>
                  {imageToxicityResult.isToxic ? (
                    <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-red-400">
                        <AlertTriangle size={15} />
                        <span>Toxic Text Detected in Image ({Math.round(imageToxicityResult.maxScore * 100)}%)</span>
                      </div>
                      {imageToxicityResult.extractedText && (
                        <p className="italic font-mono bg-black/30 p-1.5 rounded text-[11px] text-red-200">
                          Extracted Text: "{imageToxicityResult.extractedText}"
                        </p>
                      )}
                      {imageToxicityResult.flaggedLabels.length > 0 && (
                        <p className="text-[11px] text-red-400/90 font-medium">
                          ⚠️ Flagged categories: {imageToxicityResult.flaggedLabels.join(', ')}
                        </p>
                      )}
                      <p className="text-[10px] text-red-200 font-semibold">
                        This post cannot be published containing a toxic image.
                      </p>
                    </div>
                  ) : (
                    <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                      <CheckCircle size={14} className="text-emerald-400" />
                      <span>Image text scanned & verified safe</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Audio & Speech Toxicity Preview Section */}
          {selectedAudio && (
            <div className="mt-3 p-3.5 rounded-xl border border-white/10 bg-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-white">
                  <FileAudio size={16} className="text-purple-400" />
                  <span className="truncate max-w-[200px]">{audioName}</span>
                </div>
                <button
                  onClick={removeAudio}
                  className="p-1 rounded-full hover:bg-white/10 text-gray-400 hover:text-white"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Transcribing state */}
              {isTranscribing && (
                <div className="flex items-center gap-2 text-xs text-purple-300 py-1">
                  <Loader2 size={14} className="animate-spin" />
                  <span>Transcribing speech and checking toxicity…</span>
                </div>
              )}

              {/* Toxicity Detection Results */}
              {audioToxicityResult && !isTranscribing && (
                <div className="space-y-2">
                  {audioToxicityResult.is_toxic ? (
                    <div className="p-3 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-red-400">
                        <AlertTriangle size={15} />
                        <span>Toxic Speech Detected ({Math.round(audioToxicityResult.max_score * 100)}%)</span>
                      </div>
                      <p className="italic">"{audioToxicityResult.transcribed_text}"</p>
                      <p className="text-[11px] text-red-400/90 font-medium">
                        ⚠️ Flagged categories: {audioToxicityResult.flagged_labels.join(', ')}
                      </p>
                      <p className="text-[10px] text-red-200">This post cannot be published containing toxic voice content.</p>
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                        <CheckCircle size={15} />
                        <span>Speech Clean & Safe</span>
                      </div>
                      {audioToxicityResult.transcribed_text && (
                        <p className="italic">Transcribed Speech: "{audioToxicityResult.transcribed_text}"</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Live Mic Recording Overlay */}
          {isRecording && (
            <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-red-400 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                <span>Recording Voice… Speak into your microphone</span>
              </div>
              <button
                onClick={stopRecording}
                className="px-3 py-1 rounded-lg bg-red-600 text-white font-semibold flex items-center gap-1 hover:bg-red-700"
              >
                <Square size={12} /> Stop
              </button>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10">
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all font-medium"
              >
                <Image className="w-5 h-5 text-emerald-400" />
                <span className="text-sm hidden sm:inline">Photo/Video</span>
              </button>

              <button 
                onClick={() => audioInputRef.current?.click()}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 transition-all font-medium"
              >
                <FileAudio className="w-5 h-5 text-purple-400" />
                <span className="text-sm hidden sm:inline">Audio File</span>
              </button>

              <button 
                onClick={isRecording ? stopRecording : startRecording}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border transition-all font-medium ${
                  isRecording 
                    ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20'
                }`}
              >
                <Mic className="w-5 h-5 text-rose-400" />
                <span className="text-sm hidden sm:inline">{isRecording ? 'Stop Recording' : 'Record Voice'}</span>
              </button>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setIsFocused(false);
                  removeImage();
                  removeAudio();
                }}
                className="px-4 py-1.5 rounded-lg text-gray-500 hover:bg-white/10 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={
                  (!content.trim() && !selectedImage && !selectedAudio) ||
                  isSubmitting ||
                  audioToxicityResult?.is_toxic ||
                  imageToxicityResult?.isToxic ||
                  isTranscribing ||
                  isScanningImage
                }
                className={`px-4 py-1.5 rounded-full bg-gradient-to-r from-[#fd297b] to-[#ff655b] text-white font-medium text-sm transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2`}
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <SendHorizontal className="w-4 h-4" />
                    <span>Post</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageSelect}
        className="hidden"
      />
      <input
        ref={audioInputRef}
        type="file"
        accept="audio/*,.wav,.mp3,.ogg,.webm,.m4a"
        onChange={handleAudioSelect}
        className="hidden"
      />
    </div>
  );
};

export default CreatePost;