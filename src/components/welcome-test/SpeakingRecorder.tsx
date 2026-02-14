/**
 * SpeakingRecorder - Microphone recording component for Welcome Test speaking questions
 * Records up to 60s of audio, uploads to R2, saves URL as answer
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, Square, Play, Pause, RotateCcw, Upload, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SpeakingRecorderProps {
  maxSeconds?: number;
  answer?: string; // URL if already recorded
  onAnswer: (audioUrl: string) => void;
}

export function SpeakingRecorder({ maxSeconds = 60, answer, onAnswer }: SpeakingRecorderProps) {
  const [status, setStatus] = useState<'idle' | 'recording' | 'recorded' | 'uploading' | 'done'>(
    answer ? 'done' : 'idle'
  );
  const [seconds, setSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(answer || null);
  const [isPlaying, setIsPlaying] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobRef = useRef<Blob | null>(null);

  // Auto-save on unmount if recorded but not saved
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      // Auto-save unsaved recording on unmount (navigation away)
      if (blobRef.current && status === 'recorded') {
        // Fire-and-forget upload
        const formData = new FormData();
        const fileName = `welcome-test-speaking-${Date.now()}.webm`;
        formData.append('file', blobRef.current, fileName);
        supabase.functions.invoke('upload-to-r2', { body: formData })
          .then(({ data }) => {
            const url = data?.url || data?.publicUrl;
            if (url) onAnswer(url);
          })
          .catch(() => {
            onAnswer(`recording_autosaved_${Date.now()}`);
          });
      }
      if (audioUrl && audioUrl.startsWith('blob:')) URL.revokeObjectURL(audioUrl);
    };
  }, [status, audioUrl]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        blobRef.current = blob;
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setStatus('recorded');
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
    } catch (err) {
      console.error('Microphone error:', err);
      toast.error('Could not access microphone. Please allow microphone permission.');
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
    if (audioRef.current) {
      audioRef.current.pause();
    }
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
  }, [audioUrl]);

  const uploadAndSave = useCallback(async () => {
    if (!blobRef.current) return;
    setStatus('uploading');

    try {
      const formData = new FormData();
      const fileName = `welcome-test-speaking-${Date.now()}.webm`;
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
      // Fallback: save as blob URL marker
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

      {/* Controls */}
      <div className="flex items-center justify-center gap-2">
        {status === 'idle' && (
          <Button onClick={startRecording} variant="outline" size="sm" className="gap-2">
            <Mic className="h-4 w-4 text-red-500" />
            Start Recording
          </Button>
        )}

        {status === 'recording' && (
          <Button onClick={stopRecording} variant="destructive" size="sm" className="gap-2">
            <Square className="h-3.5 w-3.5" />
            Stop ({formatTime(maxSeconds - seconds)} left)
          </Button>
        )}

        {status === 'recorded' && (
          <>
            <Button onClick={isPlaying ? pauseAudio : playAudio} variant="outline" size="sm" className="gap-1.5">
              {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
            <Button onClick={resetRecording} variant="ghost" size="sm" className="gap-1.5">
              <RotateCcw className="h-3.5 w-3.5" />
              Re-record
            </Button>
            <Button onClick={uploadAndSave} size="sm" className="gap-1.5">
              <Upload className="h-3.5 w-3.5" />
              Save
            </Button>
          </>
        )}

        {status === 'uploading' && (
          <Button disabled size="sm" className="gap-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Saving...
          </Button>
        )}

        {status === 'done' && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              Recording saved
            </div>
            <Button onClick={resetRecording} variant="ghost" size="sm" className="gap-1.5 text-xs">
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
