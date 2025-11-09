import { FormData as WorksheetFormData } from '@/components/WorksheetForm';

const GENERATE_WORKSHEET_URL = 'https://bvfrkzdlklyvnhlpleck.supabase.co/functions/v1/generateWorksheet';

export interface StreamingProgress {
  type: 'progress';
  contentLength: number;
  elapsedTime: number;
  estimatedExercise: number;
  totalExercises?: number;
}

export interface StreamingComplete {
  type: 'complete';
  data: any;
  timings: {
    openai: string;
    totalChunks: number;
  };
}

export interface StreamingError {
  type: 'error';
  error: string;
}

export type StreamingEvent = StreamingProgress | StreamingComplete | StreamingError;

/**
 * Generates a worksheet with real-time streaming progress via SSE
 */
export async function generateWorksheetStreaming(
  prompt: WorksheetFormData & { fullPrompt?: string; formDataForStorage?: any; studentId?: string },
  userId: string,
  onProgress: (progress: StreamingProgress) => void,
  onComplete: (data: any) => void,
  onError: (error: string) => void
): Promise<void> {
  try {
    console.log('🌊 [STREAMING-SERVICE] Starting streaming worksheet generation');

    // Use the full prompt if provided, otherwise create legacy format
    const formattedPrompt =
      prompt.fullPrompt ||
      `${prompt.lessonTopic} - ${prompt.lessonGoal}. Teaching preferences: ${prompt.teachingPreferences}${
        prompt.englishLevel ? `. English level: ${prompt.englishLevel}` : ''
      }. Lesson duration: ${prompt.lessonTime}.`;

    // Prepare form data for storage
    const formData = prompt.formDataForStorage || {
      lessonTopic: prompt.lessonTopic,
      lessonGoal: prompt.lessonGoal,
      teachingPreferences: prompt.teachingPreferences,
      englishLevel: prompt.englishLevel || null,
      lessonTime: prompt.lessonTime,
      selectedImage: prompt.selectedImage || null,
      selectedAudio: prompt.selectedAudio || null,
    };

    if (!formData.selectedImage && prompt.selectedImage) {
      formData.selectedImage = prompt.selectedImage;
    }
    if (!formData.selectedAudio && prompt.selectedAudio) {
      formData.selectedAudio = prompt.selectedAudio;
    }

    const response = await fetch(GENERATE_WORKSHEET_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream', // Request SSE streaming
      },
      body: JSON.stringify({
        prompt: formattedPrompt,
        formData: formData,
        userId,
        studentId: prompt.studentId,
      }),
    });

    console.log('🌊 [STREAMING-SERVICE] Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('❌ [STREAMING-SERVICE] API error:', errorData);

      if (response.status === 429) {
        throw new Error(
          'You have reached your daily limit for worksheet generation. Please try again tomorrow.'
        );
      }
      throw new Error(`Failed to generate worksheet: ${errorData?.error || response.statusText}`);
    }

    // Check if we got SSE response or fallback to JSON
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/event-stream')) {
      // Fallback: server returned JSON (non-streaming mode)
      console.log('📦 [STREAMING-SERVICE] Fallback to non-streaming mode');
      const worksheetData = await response.json();
      onComplete(worksheetData);
      return;
    }

    // Parse SSE stream
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    console.log('🌊 [STREAMING-SERVICE] Starting to read SSE stream');

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        console.log('🟢 [STREAMING-SERVICE] Stream completed');
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      // Process complete SSE messages (format: "data: {...}\n\n")
      let newlineIndex: number;
      while ((newlineIndex = buffer.indexOf('\n\n')) !== -1) {
        const message = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 2);

        if (message.startsWith('data: ')) {
          const jsonStr = message.slice(6).trim();

          try {
            const event: StreamingEvent = JSON.parse(jsonStr);

            switch (event.type) {
              case 'progress':
                console.log(`🌊 [STREAMING-SERVICE] Progress: ${event.contentLength} chars, exercise ${event.estimatedExercise}`);
                onProgress(event);
                break;

              case 'complete':
                console.log('🟢 [STREAMING-SERVICE] Generation complete');
                onComplete(event.data);
                return; // Exit function

              case 'error':
                console.error('❌ [STREAMING-SERVICE] Server error:', event.error);
                onError(event.error);
                return;

              default:
                console.warn('⚠️ [STREAMING-SERVICE] Unknown event type:', event);
            }
          } catch (parseError) {
            console.error('❌ [STREAMING-SERVICE] Failed to parse SSE message:', jsonStr, parseError);
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ [STREAMING-SERVICE] Error:', error);
    onError(error instanceof Error ? error.message : 'Unknown error occurred');
    throw error;
  }
}
