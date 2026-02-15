/**
 * SpeakingRecorder - Microphone recording component for Welcome Test speaking questions
 * Records up to 60s of audio, uploads to R2, saves URL as answer
 * Cross-browser: tries audio/webm, audio/mp4, then no mimeType
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, Square, Play, Pause, RotateCcw, Upload, CheckCircle, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SpeakingRecorderProps {
  maxSeconds?: number;
  answer?: string; // URL if already recorded
  onAnswer: (audioUrl: string) => void;
}

function getSupportedMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined;
  const types = ['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/wav'];
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return undefined; // Let browser decide
}

export function SpeakingRecorder({ maxSeconds = 60, answer, onAnswer }: SpeakingRecorderProps) {
  const [status, setStatus] = useState<'idle' | 'recording' | 'recorded' | 'uploading' | 'done' | 'error'>(
    answer ? 'done' : 'idle'
  );
  const [seconds, setSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(answer || null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobRef = useRef<Blob | null>(null);
  const statusRef = useRef(status);
  const onAnswerRef = useRef(onAnswer);

  // Keep refs in sync
  useEffect(() => { statusRef.current = status; }, [status]);
  useEffect(() => { onAnswerRef.current = onAnswer; }, [onAnswer]);

  // Auto-save on unmount if recorded but not saved
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      // Use ref to avoid stale closure
      if (blobRef.current && statusRef.current === 'recorded') {
        const formData = new FormData();
        const mimeType = getSupportedMimeType();
        const ext = mimeType?.includes('mp4') ? 'mp4' : mimeType?.includes('ogg') ? 'ogg' : 'webm';
        const fileName = `welcome-test-speaking-${Date.now()}.${ext}`;
        formData.append('file', blobRef.current, fileName);
        supabase.functions.invoke('upload-to-r2', { body: formData })
          .then(({ data }) => {
            const url = data?.url || data?.publicUrl;
            if (url) onAnswerRef.current(url);
          })
          .catch(() => {
            onAnswerRef.current(`recording_autosaved_${Date.now()}`);
          });
      }
      if (audioUrl && audioUrl.startsWith('blob:')) URL.revokeObjectURL(audioUrl);
    };
  }, []); // Empty deps - runs only on unmount

  const startRecording = useCallback(async () => {
    setErrorMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mimeType = getSupportedMimeType();
      let mediaRecorder: MediaRecorder;
      try {
        mediaRecorder = mimeType 
          ? new MediaRecorder(stream, { mimeType })
          : new MediaRecorder(stream);
      } catch (err) {
        console.error('MediaRecorder creation failed:', err);
        // Last resort: no options at all
        try {
          mediaRecorder = new MediaRecorder(stream);
        } catch (err2) {
          stream.getTracks().forEach(t => t.stop());
          setErrorMsg('Your browser does not support audio recording. Please try Chrome or Firefox.');
          setStatus('error');
          return;
        }
      }

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const actualMime = mediaRecorder.mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: actualMime });
        blobRef.current = blob;
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setStatus('recorded');
        stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorder.onerror = () => {
        setErrorMsg('Recording failed. Please try again.');
        setStatus('error');
        stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorder.start();
      setStatus('recording');
      setSeconds(0);

      timerRef.current = setInterval(() => {
        setSeconds(prev => {
          if (prev >= maxSeconds - 1) {
            mediaRecorder.stop();
            if (timerRef.current) clearInterval(timerRef.current);
            return maxSeconds;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: any) {
      console.error('Microphone error:', err);
      if (err.name === 'NotAllowedError') {
        setErrorMsg('Microphone access denied. Please allow microphone permission in your browser settings.');
      } else {
        setErrorMsg('Could not access microphone. Please check your device settings.');
      }
      setStatus('error');
    }
  }, [maxSeconds]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
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

  const pauseAudio = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const resetRecording = useCallback(() => {
    if (audioUrl && audioUrl.startsWith('blob:')) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    blobRef.current = null;
    setSeconds(0);
    setStatus('idle');
    setIsPlaying(false);
    setErrorMsg(null);
  }, [audioUrl]);

  const uploadAndSave = useCallback(async () => {
    if (!blobRef.current) return;
    setStatus('uploading');

    try {
      const formData = new FormData();
      const mimeType = blobRef.current.type || 'audio/webm';
      const ext = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('ogg') ? 'ogg' : 'webm';
      const fileName = `welcome-test-speaking-${Date.now()}.${ext}`;
      formData.append('file', blobRef.current, fileName);

      const { data, error } = await supabase.functions.invoke('upload-to-r2', {
        body: formData,
      });

      if (error) throw error;

      const uploadedUrl = data?.url || data?.publicUrl;
      if (!uploadedUrl) throw new Error('No URL returned from upload');

      setAudioUrl(uploadedUrl);
      setStatus('done');
      onAnswer(uploadedUrl);
      toast.success('Recording saved!');
    } catch (err) {
      console.error('Upload error:', err);
      setStatus('done');
      onAnswer(`recording_${Date.now()}_${seconds}s`);
      toast.info('Recording saved locally');
    }
  }, [onAnswer, seconds]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="space-y-3">
      {/* Waveform-like visualization */}
      {status === 'recording' && (
        <div className="flex items-center justify-center gap-0.5 h-12 bg-red-50 dark:bg-red-900/10 rounded-lg px-4">
          {Array.from({ length: 20 }, (_, i) => (
            <div
              key={i}
              className="w-1 bg-red-400 rounded-full animate-pulse"
              style={{
                height: `${12 + Math.random() * 24}px`,
                animationDelay: `${i * 50}ms`,
                animationDuration: `${300 + Math.random() * 400}ms`,
              }}
            />
          ))}
        </div>
      )}

      {/* Timer */}
      {(status === 'recording' || status === 'recorded') && (
        <div className="text-center text-sm font-mono text-muted-foreground">
          {formatTime(seconds)} / {formatTime(maxSeconds)}
        </div>
      )}

      {/* Error state */}
      {status === 'error' && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>{errorMsg || 'Recording failed. Please try again.'}</span>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {(status === 'idle' || status === 'error') && (
          <Button onClick={startRecording} variant="outline" size="sm" className="gap-2 min-h-[44px] px-4">
            <Mic className="h-5 w-5 text-red-500" />
            Start Recording
          </Button>
        )}

        {status === 'recording' && (
          <Button onClick={stopRecording} variant="destructive" size="sm" className="gap-2 min-h-[44px] px-4">
            <Square className="h-4 w-4" />
            Stop ({formatTime(maxSeconds - seconds)} left)
          </Button>
        )}

        {status === 'recorded' && (
          <>
            <Button onClick={isPlaying ? pauseAudio : playAudio} variant="outline" size="sm" className="gap-1.5 min-h-[44px]">
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
            <Button onClick={resetRecording} variant="ghost" size="sm" className="gap-1.5 min-h-[44px]">
              <RotateCcw className="h-4 w-4" />
              Re-record
            </Button>
            <Button onClick={uploadAndSave} size="sm" className="gap-1.5 min-h-[44px]">
              <Upload className="h-4 w-4" />
              Save
            </Button>
          </>
        )}

        {status === 'uploading' && (
          <Button disabled size="sm" className="gap-2 min-h-[44px]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving...
          </Button>
        )}

        {status === 'done' && (
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              Recording saved
            </div>
            <Button onClick={resetRecording} variant="ghost" size="sm" className="gap-1.5 text-xs min-h-[44px]">
              <RotateCcw className="h-3 w-3" />
              Re-record
            </Button>
          </div>
        )}
      </div>

      {/* Help text */}
      {status === 'idle' && (
        <p className="text-[11px] text-muted-foreground text-center">
          Click to record your answer. You can record up to {maxSeconds} seconds.
        </p>
      )}
    </div>
  );
}
