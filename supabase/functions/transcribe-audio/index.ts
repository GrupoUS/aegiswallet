
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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");

    logStep("User authenticated", { userId: user.id });

    const { audio } = await req.json();
    
    if (!audio) {
      throw new Error("Audio data is required");
    }

    const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openAIApiKey) {
      throw new Error("OpenAI API key not configured");
    }

    logStep("Processing audio for transcription");

    // Convert base64 audio to binary
    let binaryAudio: Uint8Array;
    try {
      // Remove data URL prefix if present
      const base64Audio = audio.replace(/^data:audio\/[^;]+;base64,/, '');
      const binaryString = atob(base64Audio);
      binaryAudio = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        binaryAudio[i] = binaryString.charCodeAt(i);
      }
    } catch (error) {
      logStep("Error processing audio data", { error });
      throw new Error("Invalid audio data format");
    }

    // Prepare form data for OpenAI Whisper API
    const formData = new FormData();
    const blob = new Blob([binaryAudio], { type: 'audio/webm' });
    formData.append('file', blob, 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('language', 'pt'); // Portuguese language

    logStep("Calling OpenAI Whisper API");

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openAIApiKey}`,
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      logStep("OpenAI API error", { status: response.status, error: errorText });
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const transcribedText = data.text;

    if (!transcribedText) {
      throw new Error("No transcription returned from Whisper API");
    }

    logStep("Transcription successful", { textLength: transcribedText.length });

    return new Response(JSON.stringify({
      text: transcribedText
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in transcribe-audio", { message: errorMessage });
    return new Response(JSON.stringify({ 
      error: errorMessage,
      message: "Não foi possível transcrever o áudio. Tente novamente."
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
