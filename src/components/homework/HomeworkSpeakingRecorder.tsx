/**
 * HomeworkSpeakingRecorder - Minimalist inline audio recorder for homework/shared worksheet exercises
 * Records audio, uploads to R2, returns audio_url
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, Square, Play, Pause, RotateCcw, Upload, CheckCircle, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { uploadBlobToR2 } from '@/components/welcome-test/SpeakingRecorder';
import { toast } from 'sonner';

interface HomeworkSpeakingRecorderProps {
  maxSeconds?: number;
  existingAudioUrl?: string;
  onAudioSaved: (audioUrl: string) => void;
  disabled?: boolean;
  registryKey?: string;
}

// Global registry for pending (unsaved) recordings
if (typeof window !== 'undefined' && !(window as any).__pendingSpeakingRecordings) {
  (window as any).__pendingSpeakingRecordings = new Map();
}

function getSupportedMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined;
  const types = ['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/wav'];
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return undefined;
}

export function HomeworkSpeakingRecorder({ 
  maxSeconds = 120, 
  existingAudioUrl, 
  onAudioSaved, 
  disabled = false,
  registryKey 
}: HomeworkSpeakingRecorderProps) {
  const [status, setStatus] = useState<'idle' | 'recording' | 'recorded' | 'uploading' | 'done' | 'error'>(
    existingAudioUrl ? 'done' : 'idle'
  );
  const [seconds, setSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(existingAudioUrl || null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [autoSaveCountdown, setAutoSaveCountdown] = useState<number | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobRef = useRef<Blob | null>(null);

  useEffect(() => {
    if (existingAudioUrl) {
      setStatus('done');
      setAudioUrl(existingAudioUrl);
    }
  }, [existingAudioUrl]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
      if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
    };
  }, []);


  const startRecording = useCallback(async () => {
    setErrorMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getSupportedMimeType();
      let mediaRecorder: MediaRecorder;
      try {
        mediaRecorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      } catch {
        try { mediaRecorder = new MediaRecorder(stream); } catch {
          stream.getTracks().forEach(t => t.stop());
          setErrorMsg('Your browser does not support audio recording.');
          setStatus('error');
          return;
        }
      }
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
        blobRef.current = blob;
        setAudioUrl(URL.createObjectURL(blob));
        setStatus('recorded');
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorder.onerror = () => {
        setErrorMsg('Recording failed.');
        setStatus('error');
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorder.start();
      setStatus('recording');
      setSeconds(0);
      timerRef.current = setInterval(() => {
        setSeconds(prev => {
          if (prev >= maxSeconds - 1) { mediaRecorder.stop(); if (timerRef.current) clearInterval(timerRef.current); return maxSeconds; }
          return prev + 1;
        });
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.name === 'NotAllowedError' ? 'Microphone access denied.' : 'Could not access microphone.');
      setStatus('error');
    }
  }, [maxSeconds]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, []);

  const playAudio = useCallback(() => {
    if (!audioUrl) return;
    if (audioRef.current) audioRef.current.pause();
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    audio.onended = () => setIsPlaying(false);
    audio.play();
    setIsPlaying(true);
  }, [audioUrl]);

  const pauseAudio = useCallback(() => { audioRef.current?.pause(); setIsPlaying(false); }, []);

  const resetRecording = useCallback(() => {
    if (audioUrl?.startsWith('blob:')) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null); blobRef.current = null; setSeconds(0); setStatus('idle'); setIsPlaying(false); setErrorMsg(null);
  }, [audioUrl]);

  const uploadAndSave = useCallback(async () => {
    if (!blobRef.current) return;
    setStatus('uploading');
    try {
      const url = await uploadBlobToR2(blobRef.current);
      if (!url) throw new Error('No URL returned');
      setAudioUrl(url); setStatus('done'); onAudioSaved(url);
      toast.success('Recording saved!');
    } catch {
      setStatus('error'); setErrorMsg('Upload failed. Please try again.');
    }
  }, [onAudioSaved]);

  // Auto-save: register pending recording + 30s countdown
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (status === 'recorded' && blobRef.current) {
      if (registryKey) {
        (window as any).__pendingSpeakingRecordings?.set(registryKey, { blob: blobRef.current, save: uploadAndSave });
      }
      setAutoSaveCountdown(30);
      timer = setTimeout(() => { uploadAndSave(); }, 30000);
    }
    if (status === 'done' || status === 'idle') {
      if (registryKey) (window as any).__pendingSpeakingRecordings?.delete(registryKey);
      setAutoSaveCountdown(null);
    }
    return () => { if (timer) clearTimeout(timer); };
  }, [status, registryKey, uploadAndSave]);

  // Countdown ticker
  useEffect(() => {
    if (autoSaveCountdown === null || autoSaveCountdown <= 0) return;
    const t = setInterval(() => setAutoSaveCountdown(p => p !== null && p > 0 ? p - 1 : null), 1000);
    return () => clearInterval(t);
  }, [autoSaveCountdown]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="flex items-center gap-1.5 flex-wrap py-0.5">
      {(status === 'idle' || status === 'error') && (
        <Button onClick={startRecording} variant="ghost" size="sm"
          disabled={disabled} className="gap-1 h-7 px-2 text-xs text-muted-foreground hover:text-foreground">
          <Mic className="h-3 w-3 text-red-400" />
          Record
        </Button>
      )}

      {status === 'recording' && (
        <>
          <span className="flex items-center gap-1 text-xs text-red-500">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
            {formatTime(seconds)}
          </span>
          <Button onClick={stopRecording} variant="ghost" size="sm" className="gap-1 h-7 px-2 text-xs">
            <Square className="h-2.5 w-2.5" />
            Stop
          </Button>
        </>
      )}

      {status === 'recorded' && (
        <>
          <Button onClick={isPlaying ? pauseAudio : playAudio} variant="ghost" size="sm" className="h-7 px-2 text-xs">
            {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          </Button>
          <Button onClick={resetRecording} variant="ghost" size="sm" className="h-7 px-2 text-xs">
            <RotateCcw className="h-3 w-3" />
          </Button>
          <Button onClick={uploadAndSave} variant="ghost" size="sm" className="gap-1 h-7 px-2 text-xs text-green-600">
            <Upload className="h-3 w-3" />
            Save
          </Button>
          {autoSaveCountdown !== null && autoSaveCountdown > 0 && (
            <span className="text-xs text-muted-foreground">Auto-save {autoSaveCountdown}s</span>
          )}
        </>
      )}

      {status === 'uploading' && (
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          Saving...
        </span>
      )}

      {status === 'done' && (
        <>
          <span className="flex items-center gap-1 text-xs text-green-600">
            <CheckCircle className="h-3 w-3" />
            Saved
          </span>
          {audioUrl && (
            <Button onClick={isPlaying ? pauseAudio : playAudio} variant="ghost" size="sm" className="h-6 w-6 p-0">
              {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            </Button>
          )}
          <Button onClick={resetRecording} variant="ghost" size="sm" disabled={disabled} className="h-6 px-1 text-xs">
            <RotateCcw className="h-3 w-3" />
          </Button>
        </>
      )}

      {status === 'error' && errorMsg && (
        <span className="text-xs text-destructive flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          {errorMsg}
        </span>
      )}
    </div>
  );
}

export default HomeworkSpeakingRecorder;
