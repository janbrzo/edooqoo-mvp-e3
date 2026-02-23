/**
 * HomeworkSpeakingRecorder - Simplified audio recorder for homework/shared worksheet exercises
 * Adapted from SpeakingRecorder.tsx (Welcome Test) with simpler interface
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
  disabled = false 
}: HomeworkSpeakingRecorderProps) {
  const [status, setStatus] = useState<'idle' | 'recording' | 'recorded' | 'uploading' | 'done' | 'error'>(
    existingAudioUrl ? 'done' : 'idle'
  );
  const [seconds, setSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(existingAudioUrl || null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobRef = useRef<Blob | null>(null);

  // Reset when existingAudioUrl changes
  useEffect(() => {
    if (existingAudioUrl) {
      setStatus('done');
      setAudioUrl(existingAudioUrl);
    }
  }, [existingAudioUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

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

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const actualMime = mediaRecorder.mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: actualMime });
        blobRef.current = blob;
        setAudioUrl(URL.createObjectURL(blob));
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
      if (err.name === 'NotAllowedError') {
        setErrorMsg('Microphone access denied. Please allow microphone permission.');
      } else {
        setErrorMsg('Could not access microphone.');
      }
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

  const pauseAudio = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const resetRecording = useCallback(() => {
    if (audioUrl?.startsWith('blob:')) URL.revokeObjectURL(audioUrl);
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
      const url = await uploadBlobToR2(blobRef.current);
      if (!url) throw new Error('No URL returned');
      setAudioUrl(url);
      setStatus('done');
      onAudioSaved(url);
      toast.success('Recording saved!');
    } catch {
      setStatus('error');
      setErrorMsg('Upload failed. Please try again.');
    }
  }, [onAudioSaved]);

  /** Expose blob for parent-level flush (transcription before submit) */
  const getBlob = useCallback(() => blobRef.current, []);
  const getDuration = useCallback(() => seconds, [seconds]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="space-y-2 p-3 border border-dashed border-muted-foreground/30 rounded-lg bg-muted/20">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
        <Mic className="h-3 w-3" />
        <span>Speaking option</span>
      </div>

      {status === 'recording' && (
        <div className="flex items-center justify-center gap-0.5 h-10 bg-red-50 dark:bg-red-900/10 rounded-lg px-3">
          {Array.from({ length: 16 }, (_, i) => (
            <div
              key={i}
              className="w-0.5 bg-red-400 rounded-full animate-pulse"
              style={{
                height: `${8 + Math.random() * 20}px`,
                animationDelay: `${i * 50}ms`,
                animationDuration: `${300 + Math.random() * 400}ms`,
              }}
            />
          ))}
        </div>
      )}

      {(status === 'recording' || status === 'recorded') && (
        <div className="text-center text-xs font-mono text-muted-foreground">
          {formatTime(seconds)} / {formatTime(maxSeconds)}
        </div>
      )}

      {status === 'error' && (
        <div className="flex items-center gap-2 p-2 bg-destructive/10 rounded text-xs text-destructive">
          <AlertTriangle className="h-3 w-3 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="flex items-center justify-center gap-1.5 flex-wrap">
        {(status === 'idle' || status === 'error') && (
          <Button onClick={startRecording} variant="outline" size="sm" disabled={disabled} className="gap-1.5 h-8 text-xs">
            <Mic className="h-3.5 w-3.5 text-red-500" />
            Record
          </Button>
        )}

        {status === 'recording' && (
          <Button onClick={stopRecording} variant="destructive" size="sm" className="gap-1.5 h-8 text-xs">
            <Square className="h-3 w-3" />
            Stop ({formatTime(maxSeconds - seconds)})
          </Button>
        )}

        {status === 'recorded' && (
          <>
            <Button onClick={isPlaying ? pauseAudio : playAudio} variant="outline" size="sm" className="gap-1 h-8 text-xs">
              {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
            <Button onClick={resetRecording} variant="ghost" size="sm" className="gap-1 h-8 text-xs">
              <RotateCcw className="h-3 w-3" />
              Re-record
            </Button>
            <Button onClick={uploadAndSave} size="sm" className="gap-1 h-8 text-xs">
              <Upload className="h-3 w-3" />
              Save
            </Button>
          </>
        )}

        {status === 'uploading' && (
          <Button disabled size="sm" className="gap-1.5 h-8 text-xs">
            <Loader2 className="h-3 w-3 animate-spin" />
            Saving...
          </Button>
        )}

        {status === 'done' && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="flex items-center gap-1 text-xs text-green-600">
              <CheckCircle className="h-3.5 w-3.5" />
              Saved
            </div>
            {audioUrl && (
              <Button onClick={isPlaying ? pauseAudio : playAudio} variant="ghost" size="sm" className="gap-1 h-7 text-xs">
                {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
              </Button>
            )}
            <Button onClick={resetRecording} variant="ghost" size="sm" disabled={disabled} className="gap-1 h-7 text-xs">
              <RotateCcw className="h-3 w-3" />
              Re-record
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default HomeworkSpeakingRecorder;
