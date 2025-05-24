
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[TRANSCRIBE-AUDIO] ${step}${detailsStr}`);
};

const createErrorResponse = (error: string, debugInfo?: any) => {
  return new Response(JSON.stringify({
    success: false,
    error,
    debug_info: debugInfo ? JSON.stringify(debugInfo) : undefined
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 500,
  });
};

const createSuccessResponse = (text: string) => {
  return new Response(JSON.stringify({
    success: true,
    transcribed_text: text
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    // Verify OpenAI API Key
    const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
    logStep("API Key check", { hasKey: !!openAIApiKey });
    
    if (!openAIApiKey) {
      logStep("ERROR: OpenAI API Key not configured");
      return createErrorResponse("Chave da API OpenAI não configurada no servidor.");
    }

    // Authentication check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logStep("ERROR: No authorization header");
      return createErrorResponse("Cabeçalho de autorização não fornecido");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) {
      logStep("ERROR: Authentication failed", { error: userError.message });
      return createErrorResponse(`Erro de autenticação: ${userError.message}`);
    }
    
    const user = userData.user;
    if (!user) {
      logStep("ERROR: User not authenticated");
      return createErrorResponse("Usuário não autenticado");
    }

    logStep("User authenticated", { userId: user.id });

    // Parse request body
    const requestBody = await req.json();
    const { audio } = requestBody;
    
    if (!audio) {
      logStep("ERROR: No audio data provided");
      return createErrorResponse("Dados de áudio não fornecidos");
    }

    logStep("Audio data received", { 
      dataType: typeof audio,
      hasDataPrefix: audio.startsWith('data:'),
      approximateSize: audio.length 
    });

    // Process audio data
    let binaryAudio: Uint8Array;
    try {
      // Remove data URL prefix if present
      const base64Audio = audio.replace(/^data:audio\/[^;]+;base64,/, '');
      logStep("Processing audio data", { 
        originalLength: audio.length,
        base64Length: base64Audio.length,
        removedPrefix: audio.length !== base64Audio.length
      });

      const binaryString = atob(base64Audio);
      binaryAudio = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        binaryAudio[i] = binaryString.charCodeAt(i);
      }
      
      logStep("Audio conversion successful", { 
        binarySize: binaryAudio.length,
        sizeInKB: Math.round(binaryAudio.length / 1024)
      });
    } catch (error) {
      logStep("ERROR: Audio data processing failed", { error });
      return createErrorResponse("Formato de dados de áudio inválido", error);
    }

    // Validate audio size (max 25MB for Whisper)
    const maxSizeBytes = 25 * 1024 * 1024; // 25MB
    if (binaryAudio.length > maxSizeBytes) {
      logStep("ERROR: Audio file too large", { 
        size: binaryAudio.length,
        maxSize: maxSizeBytes 
      });
      return createErrorResponse("Arquivo de áudio muito grande. Máximo: 25MB");
    }

    // Prepare form data for OpenAI Whisper API
    const formData = new FormData();
    
    // Try different audio formats for better compatibility
    const audioFormats = [
      { type: 'audio/wav', extension: 'wav' },
      { type: 'audio/webm', extension: 'webm' },
      { type: 'audio/mp3', extension: 'mp3' },
      { type: 'audio/mpeg', extension: 'mp3' }
    ];
    
    // Use WAV as default (most compatible with Whisper)
    const audioFormat = audioFormats[0];
    const blob = new Blob([binaryAudio], { type: audioFormat.type });
    formData.append('file', blob, `audio.${audioFormat.extension}`);
    formData.append('model', 'whisper-1');
    formData.append('language', 'pt'); // Portuguese language for better accuracy

    logStep("Prepared form data for OpenAI", {
      audioFormat: audioFormat.type,
      filename: `audio.${audioFormat.extension}`,
      model: 'whisper-1',
      language: 'pt'
    });

    // Call OpenAI Whisper API with timeout and retry logic
    let attempts = 0;
    const maxAttempts = 2;
    let lastError: any = null;

    while (attempts < maxAttempts) {
      attempts++;
      logStep(`OpenAI API attempt ${attempts}/${maxAttempts}`);
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${openAIApiKey}`,
          },
          body: formData,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        logStep("OpenAI API response received", {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        });

        if (!response.ok) {
          const errorText = await response.text();
          logStep("OpenAI API error response", { 
            status: response.status, 
            error: errorText 
          });
          
          // Parse OpenAI error for more specific messages
          let errorMessage = "Erro na API de transcrição";
          try {
            const errorData = JSON.parse(errorText);
            if (errorData.error?.message) {
              errorMessage = `Erro OpenAI: ${errorData.error.message}`;
            }
          } catch (e) {
            errorMessage = `Erro HTTP ${response.status}: ${errorText}`;
          }
          
          lastError = { status: response.status, message: errorMessage, response: errorText };
          
          // Don't retry on client errors (400-499)
          if (response.status >= 400 && response.status < 500) {
            break;
          }
          
          // Retry on server errors (500+) or network issues
          if (attempts < maxAttempts) {
            logStep(`Retrying in 1 second (attempt ${attempts}/${maxAttempts})`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          }
        } else {
          // Success - parse response
          const data = await response.json();
          const transcribedText = data.text;

          if (!transcribedText) {
            logStep("ERROR: No transcription returned");
            return createErrorResponse("Nenhuma transcrição retornada pela API Whisper");
          }

          logStep("Transcription successful", { 
            textLength: transcribedText.length,
            firstWords: transcribedText.substring(0, 50) + (transcribedText.length > 50 ? '...' : '')
          });

          return createSuccessResponse(transcribedText);
        }
      } catch (error) {
        logStep(`ERROR: API call attempt ${attempts} failed`, { error: error.message });
        lastError = error;
        
        if (error.name === 'AbortError') {
          return createErrorResponse("Timeout na transcrição. Tente com um áudio menor.", error.message);
        }
        
        // Retry on network errors
        if (attempts < maxAttempts) {
          logStep(`Retrying in 1 second (attempt ${attempts}/${maxAttempts})`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
      }
    }

    // All attempts failed
    logStep("ERROR: All API attempts failed", { lastError });
    return createErrorResponse(
      `Falha na transcrição após ${maxAttempts} tentativas: ${lastError?.message || 'Erro desconhecido'}`,
      lastError
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR: Unexpected error in transcribe-audio", { message: errorMessage });
    return createErrorResponse(
      "Erro interno do servidor na transcrição de áudio",
      errorMessage
    );
  }
});
