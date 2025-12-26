/**
 * Worksheet Streaming Service
 * Handles SSE connection to backend for real-time worksheet generation
 */

interface StreamCallbacks {
  onStart?: () => void;
  onProgress?: (progress: { exercisesGenerated: number; expectedTotal: number }) => void;
  onDone?: (result: { worksheetId: string; worksheet: any }) => void;
  onError?: (error: Error) => void;
}

/**
 * Streams worksheet generation from backend
 * Returns AbortController for cancellation capability
 */
export function streamWorksheetGeneration(
  formData: any,
  userId: string | null,
  callbacks: StreamCallbacks
): AbortController {
  const controller = new AbortController();
  
  // Use the same URL as regular generation
  const GENERATE_WORKSHEET_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generateWorksheet`;
  
  console.log('🚀 Starting streaming worksheet generation...', { hasUserId: !!userId });
  
  fetch(GENERATE_WORKSHEET_URL, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({
      ...formData,
      enableStreaming: true,  // ← KEY FLAG: enables streaming mode
      userId: userId || 'anonymous'  // ← FIXED: Pass 'anonymous' for non-logged users
    }),
    signal: controller.signal
  }).then(async response => {
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No readable stream available');
    }
    
    const decoder = new TextDecoder();
    let buffer = '';
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        console.log('✅ Stream completed');
        break;
      }
      
      buffer += decoder.decode(value, { stream: true });
      
      // Parse SSE events (format: "event: type\ndata: {...}\n\n")
      const events = buffer.split('\n\n');
      buffer = events.pop() || ''; // Keep incomplete event in buffer
      
      for (const event of events) {
        if (!event.trim()) continue;
        
        const lines = event.split('\n');
        const eventLine = lines.find(l => l.startsWith('event: '));
        const dataLine = lines.find(l => l.startsWith('data: '));
        
        if (!eventLine || !dataLine) continue;
        
        const eventType = eventLine.replace('event: ', '').trim();
        const dataStr = dataLine.replace('data: ', '').trim();
        
        try {
          const data = JSON.parse(dataStr);
          
          console.log(`📨 Received SSE event: ${eventType}`, data);
          
          switch (eventType) {
            case 'start':
              callbacks.onStart?.();
              break;
            case 'progress':
              callbacks.onProgress?.(data);
              break;
            case 'done':
              callbacks.onDone?.(data);
              break;
            case 'error':
              callbacks.onError?.(new Error(data.message || 'Stream error'));
              break;
          }
        } catch (parseError) {
          console.error('❌ Failed to parse SSE data:', parseError, dataStr);
        }
      }
    }
  }).catch(error => {
    if (error.name === 'AbortError') {
      console.log('🛑 Stream aborted by user');
      return;
    }
    
    console.error('❌ Stream error:', error);
    callbacks.onError?.(error);
  });
  
  return controller;
}
