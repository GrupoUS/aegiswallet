
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
  logStep("ERROR: Creating error response", { error, debugInfo });
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
  logStep("SUCCESS: Creating success response", { textLength: text.length });
  return new Response(JSON.stringify({
    success: true,
    transcribed_text: text
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
};

// Função melhorada para processar Base64 com validação
function processBase64Safely(base64String: string): Uint8Array {
  try {
    logStep("Processing Base64 input", {
      originalLength: base64String.length,
      hasDataPrefix: base64String.startsWith('data:')
    });

    // Remove prefixo data URL se presente
    let cleanBase64 = base64String;
    if (base64String.startsWith('data:')) {
      const commaIndex = base64String.indexOf(',');
      if (commaIndex !== -1) {
        cleanBase64 = base64String.substring(commaIndex + 1);
        logStep("Removed data URL prefix", { 
          originalLength: base64String.length,
          cleanLength: cleanBase64.length 
        });
      }
    }

    // Validar caracteres Base64
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(cleanBase64)) {
      throw new Error("String Base64 contém caracteres inválidos");
    }

    // Processar em chunks para evitar problemas de memória
    const chunkSize = 8192; // Tamanho menor para maior segurança
    const chunks: Uint8Array[] = [];
    
    for (let i = 0; i < cleanBase64.length; i += chunkSize) {
      const chunk = cleanBase64.slice(i, i + chunkSize);
      
      try {
        const binaryChunk = atob(chunk);
        const bytes = new Uint8Array(binaryChunk.length);
        
        for (let j = 0; j < binaryChunk.length; j++) {
          bytes[j] = binaryChunk.charCodeAt(j);
        }
        
        chunks.push(bytes);
      } catch (chunkError) {
        logStep("ERROR: Failed to process Base64 chunk", { 
          chunkIndex: Math.floor(i / chunkSize),
          chunkSize: chunk.length,
          error: chunkError.message 
        });
        throw new Error(`Erro ao processar chunk ${Math.floor(i / chunkSize)}: ${chunkError.message}`);
      }
    }

    // Combinar chunks
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;

    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    
    logStep("Base64 processing completed successfully", {
      chunksProcessed: chunks.length,
      finalSize: result.length,
      sizeInKB: Math.round(result.length / 1024)
    });
    
    return result;
  } catch (error) {
    logStep("ERROR: Base64 processing failed", { error: error.message });
    throw new Error(`Falha ao processar dados de áudio Base64: ${error.message}`);
  }
}

// Função aprimorada para detectar formato de áudio
function detectAudioFormat(audioData: Uint8Array): { mimeType: string; extension: string } {
  logStep("Detecting audio format", { dataSize: audioData.length });

  // Verificar assinaturas de arquivo mais rigorosamente
  const signatures = [
    {
      check: (data: Uint8Array) => data.length >= 12 && 
        data[0] === 0x52 && data[1] === 0x49 && data[2] === 0x46 && data[3] === 0x46 &&
        data[8] === 0x57 && data[9] === 0x41 && data[10] === 0x56 && data[11] === 0x45,
      mimeType: 'audio/wav',
      extension: 'wav'
    },
    {
      check: (data: Uint8Array) => data.length >= 4 && 
        data[0] === 0x1A && data[1] === 0x45 && data[2] === 0xDF && data[3] === 0xA3,
      mimeType: 'audio/webm',
      extension: 'webm'
    },
    {
      check: (data: Uint8Array) => data.length >= 3 && 
        ((data[0] === 0xFF && (data[1] & 0xE0) === 0xE0) || // MP3 frame header
         (data[0] === 0x49 && data[1] === 0x44 && data[2] === 0x33)), // ID3 tag
      mimeType: 'audio/mp3',
      extension: 'mp3'
    },
    {
      check: (data: Uint8Array) => data.length >= 4 && 
        data[0] === 0x4F && data[1] === 0x67 && data[2] === 0x67 && data[3] === 0x53,
      mimeType: 'audio/ogg',
      extension: 'ogg'
    }
  ];

  for (const signature of signatures) {
    if (signature.check(audioData)) {
      logStep("Audio format detected", { 
        mimeType: signature.mimeType,
        extension: signature.extension 
      });
      return { mimeType: signature.mimeType, extension: signature.extension };
    }
  }
  
  // Fallback para WebM se não conseguir detectar
  logStep("Using fallback format", { format: 'audio/webm' });
  return { mimeType: 'audio/webm', extension: 'webm' };
}

// Função para validar tamanho do arquivo
function validateAudioSize(audioData: Uint8Array): void {
  const maxSizeBytes = 25 * 1024 * 1024; // 25MB
  const sizeInMB = audioData.length / (1024 * 1024);
  
  logStep("Validating audio size", {
    sizeBytes: audioData.length,
    sizeMB: sizeInMB.toFixed(2),
    maxSizeMB: 25
  });

  if (audioData.length > maxSizeBytes) {
    throw new Error(`Arquivo de áudio muito grande (${sizeInMB.toFixed(1)}MB). Máximo permitido: 25MB`);
  }

  if (audioData.length < 1000) { // Mínimo de 1KB
    throw new Error("Arquivo de áudio muito pequeno. Verifique se a gravação foi feita corretamente.");
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  logStep("Function started", { method: req.method });

  try {
    // Verificar variáveis de ambiente
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const openRouterApiKey = Deno.env.get("OPENROUTER_API_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      logStep("ERROR: Missing Supabase configuration");
      return createErrorResponse("Configuração do Supabase não encontrada");
    }

    if (!openRouterApiKey) {
      logStep("ERROR: Missing OpenRouter API key");
      return createErrorResponse("Chave da API OpenRouter não configurada");
    }

    logStep("Environment variables validated successfully");

    // Criar cliente Supabase
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // Verificar autenticação
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
    
    if (!userData.user) {
      logStep("ERROR: User not found");
      return createErrorResponse("Usuário não autenticado");
    }

    logStep("User authenticated successfully", { userId: userData.user.id });

    // Parse do corpo da requisição
    let requestBody: any;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      logStep("ERROR: Failed to parse request body", { error: parseError.message });
      return createErrorResponse("Formato de requisição inválido");
    }

    const { audio } = requestBody;
    
    if (!audio) {
      logStep("ERROR: No audio data in request");
      return createErrorResponse("Dados de áudio não fornecidos");
    }

    logStep("Request parsed successfully", { 
      hasAudio: !!audio,
      audioType: typeof audio,
      audioLength: audio.length
    });

    // Processar dados de áudio
    let binaryAudio: Uint8Array;
    try {
      binaryAudio = processBase64Safely(audio);
      validateAudioSize(binaryAudio);
    } catch (processingError) {
      logStep("ERROR: Audio processing failed", { error: processingError.message });
      return createErrorResponse(`Erro no processamento do áudio: ${processingError.message}`);
    }

    // Detectar formato
    const audioFormat = detectAudioFormat(binaryAudio);

    // Preparar dados para OpenRouter
    let transcriptionAttempts = 0;
    const maxAttempts = 3;
    let lastError: any = null;

    while (transcriptionAttempts < maxAttempts) {
      transcriptionAttempts++;
      logStep(`Transcription attempt ${transcriptionAttempts}/${maxAttempts}`);

      try {
        const formData = new FormData();
        const blob = new Blob([binaryAudio], { type: audioFormat.mimeType });
        formData.append('file', blob, `audio.${audioFormat.extension}`);
        formData.append('model', 'openai/whisper-1');
        formData.append('language', 'pt');

        logStep("Calling OpenRouter Whisper API", {
          attempt: transcriptionAttempts,
          audioFormat: audioFormat.mimeType,
          audioSize: binaryAudio.length
        });

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);

        const response = await fetch("https://openrouter.ai/api/v1/audio/transcriptions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${openRouterApiKey}`,
            "HTTP-Referer": supabaseUrl,
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
          logStep("OpenRouter API error", { 
            status: response.status, 
            error: errorText,
            attempt: transcriptionAttempts
          });
          
          let errorMessage = `Erro HTTP ${response.status}`;
          try {
            const errorData = JSON.parse(errorText);
            if (errorData.error?.message) {
              errorMessage = errorData.error.message;
            }
          } catch (e) {
            errorMessage = errorText || errorMessage;
          }
          
          lastError = { status: response.status, message: errorMessage };
          
          // Não tentar novamente para erros de cliente (400-499)
          if (response.status >= 400 && response.status < 500) {
            logStep("Client error detected, not retrying", { status: response.status });
            break;
          }
          
          // Tentar novamente para erros de servidor
          if (transcriptionAttempts < maxAttempts) {
            const delay = transcriptionAttempts * 2000; // Delay exponencial
            logStep(`Retrying in ${delay}ms`, { attempt: transcriptionAttempts });
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        } else {
          // Sucesso
          const data = await response.json();
          const transcribedText = data.text;

          if (!transcribedText) {
            logStep("ERROR: No transcription text returned");
            return createErrorResponse("Nenhuma transcrição retornada pela API");
          }

          logStep("Transcription successful", { 
            textLength: transcribedText.length,
            preview: transcribedText.substring(0, 100) + (transcribedText.length > 100 ? '...' : ''),
            attempts: transcriptionAttempts
          });

          return createSuccessResponse(transcribedText);
        }
      } catch (error) {
        logStep(`ERROR: Attempt ${transcriptionAttempts} failed`, { 
          error: error.message,
          errorName: error.name 
        });
        
        lastError = error;
        
        if (error.name === 'AbortError') {
          return createErrorResponse("Timeout na transcrição. Tente com um áudio menor.");
        }
        
        // Tentar novamente em erros de rede
        if (transcriptionAttempts < maxAttempts) {
          const delay = transcriptionAttempts * 2000;
          logStep(`Retrying in ${delay}ms after network error`, { attempt: transcriptionAttempts });
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
    }

    // Todas as tentativas falharam
    logStep("ERROR: All transcription attempts failed", { 
      totalAttempts: transcriptionAttempts,
      lastError: lastError?.message || 'Erro desconhecido'
    });
    
    return createErrorResponse(
      `Falha na transcrição após ${maxAttempts} tentativas: ${lastError?.message || 'Erro desconhecido'}`,
      lastError
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR: Unexpected error", { 
      message: errorMessage, 
      stack: error instanceof Error ? error.stack : undefined 
    });
    
    return createErrorResponse(
      "Erro interno do servidor na transcrição de áudio",
      errorMessage
    );
  }
});
