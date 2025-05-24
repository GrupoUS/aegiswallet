
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const timestamp = new Date().toISOString();
  const detailsStr = details ? ` | ${JSON.stringify(details)}` : '';
  console.log(`[${timestamp}] ${step}${detailsStr}`);
};

const createErrorResponse = (error: string, status = 500) => {
  logStep("ERROR", { error, status });
  return new Response(JSON.stringify({
    success: false,
    error
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });
};

const createSuccessResponse = (text: string) => {
  logStep("SUCCESS", { textLength: text.length });
  return new Response(JSON.stringify({
    success: true,
    transcribed_text: text
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
};

function processBase64Audio(base64String: string): Uint8Array {
  try {
    logStep("Processing Base64 input", { length: base64String.length });

    // Remove data URL prefix se presente
    let cleanBase64 = base64String;
    if (base64String.includes(',')) {
      cleanBase64 = base64String.split(',')[1];
      logStep("Removed data URL prefix");
    }

    // Validar Base64
    if (cleanBase64.length % 4 !== 0) {
      cleanBase64 = cleanBase64.padEnd(cleanBase64.length + (4 - cleanBase64.length % 4), '=');
      logStep("Padded Base64 string for correct length");
    }

    // Decodificar Base64
    const binaryString = atob(cleanBase64);
    const bytes = new Uint8Array(binaryString.length);
    
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    logStep("Base64 decoded successfully", { 
      originalSize: base64String.length,
      binarySize: bytes.length 
    });
    
    return bytes;
  } catch (error) {
    logStep("Base64 processing failed", { error: error.message });
    throw new Error(`Erro ao processar dados de áudio: ${error.message}`);
  }
}

function detectAudioFormat(audioData: Uint8Array): string {
  logStep("Detecting audio format", { dataSize: audioData.length });

  // Verificar assinaturas de arquivo
  if (audioData.length >= 12) {
    // WAV: RIFF...WAVE
    if (audioData[0] === 0x52 && audioData[1] === 0x49 && 
        audioData[2] === 0x46 && audioData[3] === 0x46 &&
        audioData[8] === 0x57 && audioData[9] === 0x41 && 
        audioData[10] === 0x56 && audioData[11] === 0x45) {
      logStep("Format detected: WAV");
      return 'audio/wav';
    }
  }

  if (audioData.length >= 4) {
    // WebM: 0x1A45DFA3
    if (audioData[0] === 0x1A && audioData[1] === 0x45 && 
        audioData[2] === 0xDF && audioData[3] === 0xA3) {
      logStep("Format detected: WebM");
      return 'audio/webm';
    }

    // OGG: OggS
    if (audioData[0] === 0x4F && audioData[1] === 0x67 && 
        audioData[2] === 0x67 && audioData[3] === 0x53) {
      logStep("Format detected: OGG");
      return 'audio/ogg';
    }
  }

  // Fallback para WebM
  logStep("Using fallback format: WebM");
  return 'audio/webm';
}

function validateAudioData(audioData: Uint8Array): void {
  const maxSizeBytes = 25 * 1024 * 1024; // 25MB
  const minSizeBytes = 1000; // 1KB
  
  if (audioData.length > maxSizeBytes) {
    const sizeMB = (audioData.length / (1024 * 1024)).toFixed(1);
    throw new Error(`Arquivo muito grande (${sizeMB}MB). Máximo: 25MB`);
  }

  if (audioData.length < minSizeBytes) {
    throw new Error("Arquivo muito pequeno. Verifique se o áudio foi gravado corretamente.");
  }

  logStep("Audio validation passed", { 
    size: audioData.length,
    sizeMB: (audioData.length / (1024 * 1024)).toFixed(2)
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  logStep("Transcription request started", { method: req.method });

  try {
    // Verificar variáveis de ambiente
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const openrouterApiKey = Deno.env.get("OPENROUTER_API_KEY");

    if (!supabaseUrl || !supabaseServiceKey || !openrouterApiKey) {
      logStep("Missing environment variables", {
        hasSupabaseUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey,
        hasOpenrouterKey: !!openrouterApiKey
      });
      return createErrorResponse("Configuração do servidor incompleta", 500);
    }

    // Criar cliente Supabase
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // Verificar autenticação
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return createErrorResponse("Token de autorização não fornecido", 401);
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      logStep("Authentication failed", { error: userError?.message });
      return createErrorResponse("Usuário não autenticado", 401);
    }

    logStep("User authenticated", { userId: userData.user.id });

    // Parse do corpo da requisição
    const requestBody = await req.json();
    const { audio } = requestBody;
    
    if (!audio) {
      return createErrorResponse("Dados de áudio não fornecidos", 400);
    }

    logStep("Request parsed", { audioLength: audio.length });

    // Processar dados de áudio
    const binaryAudio = processBase64Audio(audio);
    validateAudioData(binaryAudio);
    const mimeType = detectAudioFormat(binaryAudio);

    // Preparar FormData para OpenAI (via OpenRouter)
    const formData = new FormData();
    const audioBlob = new Blob([binaryAudio], { type: mimeType });
    
    // Determinar extensão do arquivo
    const extension = mimeType.includes('wav') ? 'wav' : 
                     mimeType.includes('webm') ? 'webm' : 
                     mimeType.includes('ogg') ? 'ogg' : 'webm';
    
    formData.append('file', audioBlob, `audio.${extension}`);
    formData.append('model', 'openai/whisper-1');

    logStep("Calling OpenRouter Whisper API", {
      mimeType,
      extension,
      audioSize: binaryAudio.length
    });

    // Chamar API OpenRouter com timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos

    try {
      const response = await fetch("https://openrouter.ai/api/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openrouterApiKey}`,
          "HTTP-Referer": "https://soqfclgupivjcdiiwmta.supabase.co",
          "X-Title": "AegisWallet"
        },
        body: formData,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        logStep("OpenRouter API error", { 
          status: response.status, 
          statusText: response.statusText,
          error: errorText 
        });
        
        // Se OpenRouter não suportar transcription, tente OpenAI direto
        if (response.status === 404 || response.status === 501) {
          logStep("OpenRouter doesn't support transcription, falling back to OpenAI");
          
          // Fallback para OpenAI direto - verificar se temos uma chave alternativa
          // Por enquanto, retornar erro específico
          return createErrorResponse("OpenRouter não suporta transcrição de áudio. Configure OPENAI_API_KEY para usar Whisper diretamente.", 400);
        }
        
        if (response.status === 413) {
          return createErrorResponse("Arquivo de áudio muito grande para a API", 400);
        }
        
        return createErrorResponse(`Erro da API: ${response.status} ${response.statusText}`, 500);
      }

      const result = await response.json();
      const transcribedText = result.text;

      if (!transcribedText || transcribedText.trim() === '') {
        logStep("Empty transcription returned");
        return createErrorResponse("Nenhum texto foi detectado no áudio", 400);
      }

      logStep("Transcription completed", { 
        textLength: transcribedText.length,
        preview: transcribedText.substring(0, 100)
      });

      return createSuccessResponse(transcribedText);

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        logStep("Request timeout");
        return createErrorResponse("Timeout na transcrição. Tente com um áudio menor.", 408);
      }
      
      logStep("Fetch error", { error: fetchError.message });
      return createErrorResponse(`Erro de conexão: ${fetchError.message}`, 500);
    }

  } catch (error) {
    logStep("Unexpected error", { 
      error: error.message, 
      stack: error.stack 
    });
    
    return createErrorResponse(
      "Erro interno do servidor. Tente novamente.",
      500
    );
  }
});
