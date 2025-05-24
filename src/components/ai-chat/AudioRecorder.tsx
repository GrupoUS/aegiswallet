
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Send, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AudioRecorderProps {
  onTranscriptionComplete: (text: string) => void;
  disabled?: boolean;
}

const AudioRecorder = ({ onTranscriptionComplete, disabled }: AudioRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Enhanced logging function
  const logStep = (step: string, details?: any) => {
    console.log(`[AUDIO-RECORDER] ${step}`, details || '');
  };

  const startRecording = async () => {
    try {
      logStep("Starting audio recording");
      
      // Check browser compatibility
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Seu navegador não suporta gravação de áudio");
      }

      // Request microphone access with optimal settings for speech
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000, // High quality sample rate
          channelCount: 1 // Mono for speech
        } 
      });
      
      logStep("Microphone access granted", {
        tracks: stream.getAudioTracks().length,
        settings: stream.getAudioTracks()[0]?.getSettings()
      });

      // Prioritize WAV format for best Whisper compatibility
      const mimeTypes = [
        'audio/wav',
        'audio/webm;codecs=pcm',
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus'
      ];

      let selectedMimeType = '';
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          logStep("Selected audio format", { mimeType: selectedMimeType });
          break;
        }
      }

      if (!selectedMimeType) {
        logStep("ERROR: No supported audio format found");
        throw new Error("Formato de áudio não suportado pelo navegador");
      }
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: selectedMimeType,
        bitsPerSecond: 128000 // Good quality for speech
      });
      
      const chunks: BlobPart[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
          logStep("Audio chunk received", { size: event.data.size });
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: selectedMimeType });
        logStep("Recording stopped", { 
          blobSize: blob.size,
          blobType: blob.type,
          duration: recordingTime
        });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => {
          track.stop();
          logStep("Audio track stopped", { trackId: track.id });
        });
      };

      mediaRecorder.onerror = (event) => {
        logStep("MediaRecorder error", { error: event });
        toast({
          title: "Erro de Gravação",
          description: "Erro durante a gravação de áudio",
          variant: "destructive"
        });
      };
      
      mediaRecorder.start(1000); // Collect data every second
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          // Auto-stop at 5 minutes to prevent huge files
          if (newTime >= 300) {
            logStep("Auto-stopping recording at 5 minutes");
            stopRecording();
          }
          return newTime;
        });
      }, 1000);
      
      logStep("Recording started successfully");
      
    } catch (error) {
      logStep("ERROR: Failed to start recording", { error });
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      
      toast({
        title: "Erro",
        description: errorMessage.includes("Permission") 
          ? "Permissão de microfone negada. Verifique as configurações do navegador."
          : `Não foi possível iniciar a gravação: ${errorMessage}`,
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    logStep("Stopping recording");
    
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const discardRecording = () => {
    logStep("Discarding recording");
    setAudioBlob(null);
    setRecordingTime(0);
  };

  const sendRecording = async () => {
    if (!audioBlob) {
      logStep("ERROR: No audio blob to send");
      return;
    }
    
    logStep("Starting transcription process", {
      blobSize: audioBlob.size,
      blobType: audioBlob.type
    });
    
    setIsProcessing(true);
    
    try {
      // Validate audio size (max 25MB)
      const maxSizeBytes = 25 * 1024 * 1024;
      if (audioBlob.size > maxSizeBytes) {
        throw new Error(`Arquivo de áudio muito grande (${Math.round(audioBlob.size / 1024 / 1024)}MB). Máximo: 25MB`);
      }

      // Convert blob to base64
      const reader = new FileReader();
      
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const result = reader.result as string;
          logStep("Audio converted to base64", {
            originalSize: audioBlob!.size,
            base64Length: result.length
          });
          resolve(result);
        };
        reader.onerror = () => {
          logStep("ERROR: FileReader error", { error: reader.error });
          reject(new Error("Erro ao processar arquivo de áudio"));
        };
      });
      
      reader.readAsDataURL(audioBlob);
      const base64Audio = await base64Promise;
      
      logStep("Calling transcribe-audio function with OpenRouter");
      
      const { data, error } = await supabase.functions.invoke('transcribe-audio', {
        body: { audio: base64Audio }
      });
      
      logStep("Transcription API response", { 
        hasData: !!data, 
        hasError: !!error,
        success: data?.success
      });
      
      if (error) {
        logStep("ERROR: Supabase function error", { error });
        throw new Error(`Erro na chamada da função: ${error.message}`);
      }
      
      if (!data) {
        logStep("ERROR: No data returned from function");
        throw new Error("Nenhuma resposta da função de transcrição");
      }
      
      if (!data.success) {
        logStep("ERROR: Transcription failed", { 
          error: data.error,
          debugInfo: data.debug_info 
        });
        
        // Display specific error message
        const errorMsg = data.error || "Erro desconhecido na transcrição";
        throw new Error(errorMsg);
      }
      
      if (!data.transcribed_text) {
        logStep("ERROR: No transcribed text in response");
        throw new Error("Nenhum texto transcrito retornado");
      }
      
      logStep("Transcription successful with OpenRouter", { 
        textLength: data.transcribed_text.length,
        preview: data.transcribed_text.substring(0, 100)
      });
      
      onTranscriptionComplete(data.transcribed_text);
      setAudioBlob(null);
      setRecordingTime(0);
      
      toast({
        title: "Sucesso",
        description: "Áudio transcrito com sucesso via OpenRouter!",
        variant: "default"
      });
      
    } catch (error) {
      logStep("ERROR: Transcription process failed", { error });
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      
      toast({
        title: "Erro na Transcrição",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Show recording review interface
  if (audioBlob) {
    const sizeInMB = audioBlob.size / (1024 * 1024);
    
    return (
      <div className="flex items-center gap-2 p-3 bg-muted rounded-lg border">
        <div className="flex-1">
          <div className="text-sm font-medium">
            Gravação de {formatTime(recordingTime)} pronta
          </div>
          <div className="text-xs text-muted-foreground">
            {sizeInMB < 1 
              ? `${Math.round(sizeInMB * 1024)}KB`
              : `${sizeInMB.toFixed(1)}MB`
            } • {audioBlob.type}
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={discardRecording}
          disabled={isProcessing}
        >
          <X className="h-3 w-3" />
        </Button>
        <Button
          size="sm"
          onClick={sendRecording}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Send className="h-3 w-3" />
          )}
        </Button>
      </div>
    );
  }

  // Show recording in progress interface
  if (isRecording) {
    return (
      <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
        <div className="flex items-center gap-2 flex-1">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-sm text-red-700 dark:text-red-300 font-medium">
            Gravando... {formatTime(recordingTime)}
          </span>
          {recordingTime > 240 && (
            <span className="text-xs text-red-600 dark:text-red-400">
              (máx: 5min)
            </span>
          )}
        </div>
        <Button
          size="sm"
          variant="destructive"
          onClick={stopRecording}
        >
          <MicOff className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  // Show initial microphone button
  return (
    <Button
      size="icon"
      variant="outline"
      onClick={startRecording}
      disabled={disabled}
      className="h-10 w-10"
      title="Gravar mensagem de voz"
    >
      <Mic className="h-4 w-4" />
      <span className="sr-only">Gravar áudio</span>
    </Button>
  );
};

export default AudioRecorder;
