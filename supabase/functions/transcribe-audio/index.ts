
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

// Função para processar Base64 em chunks e evitar problemas de memória
function processBase64InChunks(base64String: string): Uint8Array {
  try {
    // Remove o prefixo data URL se presente
    const cleanBase64 = base64String.replace(/^data:audio\/[^;]+;base64,/, '');
    
    logStep("Processing Base64", {
      originalLength: base64String.length,
      cleanLength: cleanBase64.length,
      hasPrefix: base64String !== cleanBase64
    });

    // Decodifica o Base64
    const binaryString = atob(cleanBase64);
    const bytes = new Uint8Array(binaryString.length);
    
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    logStep("Base64 conversion successful", {
      binaryLength: binaryString.length,
      bytesLength: bytes.length
    });
    
    return bytes;
  } catch (error) {
    logStep("ERROR: Base64 processing failed", { error: error.message });
    throw new Error(`Falha ao processar dados de áudio: ${error.message}`);
  }
}

// Função para detectar formato de áudio
function detectAudioFormat(audioData: Uint8Array): string {
  // Verificar assinatura WAV
  if (audioData.length >= 12 && 
      audioData[0] === 0x52 && audioData[1] === 0x49 && 
      audioData[2] === 0x46 && audioData[3] === 0x46 &&
      audioData[8] === 0x57 && audioData[9] === 0x41 && 
      audioData[10] === 0x56 && audioData[11] === 0x45) {
    return 'audio/wav';
  }
  
  // Verificar assinatura WebM
  if (audioData.length >= 4 && 
      audioData[0] === 0x1A && audioData[1] === 0x45 && 
      audioData[2] === 0xDF && audioData[3] === 0xA3) {
    return 'audio/webm';
  }
  
  // Verificar assinatura MP3
  if (audioData.length >= 3 && 
      ((audioData[0] === 0xFF && (audioData[1] & 0xE0) === 0xE0) || // MP3 frame header
       (audioData[0] === 0x49 && audioData[1] === 0x44 && audioData[2] === 0x33))) { // ID3 tag
    return 'audio/mp3';
  }
  
  // Verificar assinatura OGG
  if (audioData.length >= 4 && 
      audioData[0] === 0x4F && audioData[1] === 0x67 && 
      audioData[2] === 0x67 && audioData[3] === 0x53) {
    return 'audio/ogg';
  }
  
  // Default para WebM se não conseguir detectar
  return 'audio/webm';
}

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

    // Verificar chave da API OpenRouter
    const openRouterApiKey = Deno.env.get("OPENROUTER_API_KEY");
    logStep("OpenRouter API Key check", { hasKey: !!openRouterApiKey });
    
    if (!openRouterApiKey) {
      logStep("ERROR: OpenRouter API Key not configured");
      return createErrorResponse("Chave da API OpenRouter não configurada no servidor.");
    }

    // Verificação de autenticação
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

    // Parse do corpo da requisição
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

    // Processar dados de áudio
    let binaryAudio: Uint8Array;
    try {
      binaryAudio = processBase64InChunks(audio);
      
      logStep("Audio processing successful", { 
        binarySize: binaryAudio.length,
        sizeInKB: Math.round(binaryAudio.length / 1024)
      });
    } catch (error) {
      logStep("ERROR: Audio data processing failed", { error: error.message });
      return createErrorResponse("Formato de dados de áudio inválido", error.message);
    }

    // Validar tamanho do áudio (máximo 25MB para Whisper)
    const maxSizeBytes = 25 * 1024 * 1024; // 25MB
    if (binaryAudio.length > maxSizeBytes) {
      logStep("ERROR: Audio file too large", { 
        size: binaryAudio.length,
        maxSize: maxSizeBytes 
      });
      return createErrorResponse("Arquivo de áudio muito grande. Máximo: 25MB");
    }

    // Detectar formato de áudio
    const detectedFormat = detectAudioFormat(binaryAudio);
    logStep("Audio format detected", { format: detectedFormat });

    // Preparar FormData para API OpenRouter Whisper
    const formData = new FormData();
    
    // Usar formato detectado
    const blob = new Blob([binaryAudio], { type: detectedFormat });
    formData.append('file', blob, `audio.${detectedFormat.split('/')[1]}`);
    formData.append('model', 'openai/whisper-1');
    formData.append('language', 'pt'); // Português para melhor precisão

    logStep("Prepared form data for OpenRouter", {
      audioFormat: detectedFormat,
      filename: `audio.${detectedFormat.split('/')[1]}`,
      model: 'openai/whisper-1',
      language: 'pt'
    });

    // Chamar API OpenRouter Whisper com timeout e retry
    let attempts = 0;
    const maxAttempts = 3;
    let lastError: any = null;

    while (attempts < maxAttempts) {
      attempts++;
      logStep(`OpenRouter API attempt ${attempts}/${maxAttempts}`);
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 segundos timeout

        const response = await fetch("https://openrouter.ai/api/v1/audio/transcriptions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${openRouterApiKey}`,
            "HTTP-Referer": "https://soqfclgupivjcdiiwmta.supabase.co",
            "X-Title": "AegisWallet Audio Transcription"
          },
          body: formData,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        logStep("OpenRouter API response received", {
          status: response.status,
          statusText: response.statusText,
          contentType: response.headers.get('content-type')
        });

        if (!response.ok) {
          const errorText = await response.text();
          logStep("OpenRouter API error response", { 
            status: response.status, 
            error: errorText 
          });
          
          // Parse do erro OpenRouter para mensagens mais específicas
          let errorMessage = "Erro na API de transcrição";
          try {
            const errorData = JSON.parse(errorText);
            if (errorData.error?.message) {
              errorMessage = `Erro OpenRouter: ${errorData.error.message}`;
            }
          } catch (e) {
            errorMessage = `Erro HTTP ${response.status}: ${errorText}`;
          }
          
          lastError = { status: response.status, message: errorMessage, response: errorText };
          
          // Não tentar novamente em erros de cliente (400-499)
          if (response.status >= 400 && response.status < 500) {
            break;
          }
          
          // Tentar novamente em erros de servidor (500+) ou problemas de rede
          if (attempts < maxAttempts) {
            logStep(`Retrying in 2 seconds (attempt ${attempts}/${maxAttempts})`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue;
          }
        } else {
          // Sucesso - parse da resposta
          const data = await response.json();
          const transcribedText = data.text;

          if (!transcribedText) {
            logStep("ERROR: No transcription returned");
            return createErrorResponse("Nenhuma transcrição retornada pela API");
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
        
        // Tentar novamente em erros de rede
        if (attempts < maxAttempts) {
          logStep(`Retrying in 2 seconds (attempt ${attempts}/${maxAttempts})`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }
      }
    }

    // Todas as tentativas falharam
    logStep("ERROR: All API attempts failed", { lastError });
    return createErrorResponse(
      `Falha na transcrição após ${maxAttempts} tentativas: ${lastError?.message || 'Erro desconhecido'}`,
      lastError
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR: Unexpected error in transcribe-audio", { message: errorMessage, stack: error.stack });
    return createErrorResponse(
      "Erro interno do servidor na transcrição de áudio",
      errorMessage
    );
  }
});
