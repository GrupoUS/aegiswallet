
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

  const logStep = (step: string, details?: any) => {
    console.log(`[AUDIO-RECORDER] ${step}`, details || '');
  };

  const startRecording = async () => {
    try {
      logStep("Starting recording process");
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Seu navegador não suporta gravação de áudio");
      }

      // Configurações otimizadas para melhor compatibilidade
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000, // Taxa ideal para Whisper
          channelCount: 1 // Mono para economizar espaço
        } 
      });
      
      logStep("Microphone access granted", {
        tracks: stream.getAudioTracks().length,
        settings: stream.getAudioTracks()[0]?.getSettings()
      });

      // Formatos priorizados para melhor compatibilidade com Whisper
      const preferredFormats = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/wav',
        'audio/ogg;codecs=opus'
      ];

      let selectedFormat = '';
      for (const format of preferredFormats) {
        if (MediaRecorder.isTypeSupported(format)) {
          selectedFormat = format;
          logStep("Selected audio format", { format });
          break;
        }
      }

      if (!selectedFormat) {
        logStep("WARNING: No optimal format found, using default");
        selectedFormat = 'audio/webm'; // Fallback
      }
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: selectedFormat,
        bitsPerSecond: 64000 // Bitrate otimizado para fala
      });
      
      const chunks: BlobPart[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
          logStep("Audio chunk received", { 
            size: event.data.size,
            totalChunks: chunks.length 
          });
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: selectedFormat });
        logStep("Recording stopped", { 
          blobSize: blob.size,
          blobType: blob.type,
          duration: recordingTime,
          chunks: chunks.length
        });
        setAudioBlob(blob);
        
        // Limpar recursos
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
      
      mediaRecorder.start(250); // Coletar dados a cada 250ms para melhor responsividade
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setRecordingTime(0);
      
      // Timer com limite de 5 minutos
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          if (newTime >= 300) { // 5 minutos
            logStep("Auto-stopping recording at time limit");
            stopRecording();
          }
          return newTime;
        });
      }, 1000);
      
      logStep("Recording started successfully", { format: selectedFormat });
      
    } catch (error) {
      logStep("ERROR: Failed to start recording", { error });
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      
      toast({
        title: "Erro",
        description: errorMessage.includes("Permission") || errorMessage.includes("NotAllowedError")
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
      // Validações antes do envio
      const maxSizeBytes = 25 * 1024 * 1024; // 25MB
      if (audioBlob.size > maxSizeBytes) {
        throw new Error(`Arquivo muito grande (${Math.round(audioBlob.size / 1024 / 1024)}MB). Máximo: 25MB`);
      }

      if (audioBlob.size < 1000) { // Mínimo de 1KB
        throw new Error("Gravação muito pequena. Tente gravar novamente.");
      }

      // Converter para base64 com tratamento de erro
      const base64Audio = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onloadend = () => {
          const result = reader.result as string;
          logStep("Audio converted to base64", {
            originalSize: audioBlob!.size,
            base64Length: result.length,
            compressionRatio: (result.length / audioBlob!.size).toFixed(2)
          });
          resolve(result);
        };
        
        reader.onerror = () => {
          logStep("ERROR: FileReader failed", { error: reader.error });
          reject(new Error("Erro ao processar arquivo de áudio"));
        };
        
        reader.readAsDataURL(audioBlob);
      });
      
      logStep("Calling transcription function");
      
      const { data, error } = await supabase.functions.invoke('transcribe-audio', {
        body: { audio: base64Audio }
      });
      
      logStep("Transcription response received", { 
        hasData: !!data, 
        hasError: !!error,
        success: data?.success
      });
      
      if (error) {
        logStep("ERROR: Supabase function error", { error });
        throw new Error(`Erro na função de transcrição: ${error.message}`);
      }
      
      if (!data) {
        logStep("ERROR: No data returned");
        throw new Error("Nenhuma resposta da função de transcrição");
      }
      
      if (!data.success) {
        logStep("ERROR: Transcription failed", { 
          error: data.error,
          debugInfo: data.debug_info 
        });
        throw new Error(data.error || "Erro na transcrição de áudio");
      }
      
      if (!data.transcribed_text) {
        logStep("ERROR: No transcribed text");
        throw new Error("Nenhum texto foi transcrito do áudio");
      }
      
      logStep("Transcription successful", { 
        textLength: data.transcribed_text.length,
        preview: data.transcribed_text.substring(0, 100)
      });
      
      onTranscriptionComplete(data.transcribed_text);
      setAudioBlob(null);
      setRecordingTime(0);
      
      toast({
        title: "Sucesso",
        description: "Áudio transcrito com sucesso!",
        variant: "default"
      });
      
    } catch (error) {
      logStep("ERROR: Transcription failed", { error });
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido na transcrição";
      
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

  // Interface de revisão da gravação
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
          title="Descartar gravação"
        >
          <X className="h-3 w-3" />
        </Button>
        <Button
          size="sm"
          onClick={sendRecording}
          disabled={isProcessing}
          title="Enviar para transcrição"
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

  // Interface durante a gravação
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
          title="Parar gravação"
        >
          <MicOff className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  // Botão inicial do microfone
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
