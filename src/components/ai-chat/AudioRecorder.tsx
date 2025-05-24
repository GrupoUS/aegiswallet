
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
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [AUDIO-RECORDER] ${step}`, details || '');
  };

  const startRecording = async () => {
    try {
      logStep("Starting recording");
      
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Gravação de áudio não suportada neste navegador");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
          channelCount: 1
        } 
      });
      
      logStep("Microphone access granted");

      // Testar formatos suportados
      const testFormats = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/wav'
      ];

      let selectedFormat = '';
      for (const format of testFormats) {
        if (MediaRecorder.isTypeSupported(format)) {
          selectedFormat = format;
          break;
        }
      }

      if (!selectedFormat) {
        selectedFormat = 'audio/webm'; // Fallback padrão
      }

      logStep("Using audio format", { format: selectedFormat });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: selectedFormat
      });
      
      const chunks: BlobPart[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
          logStep("Audio chunk received", { size: event.data.size });
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: selectedFormat });
        logStep("Recording completed", { 
          blobSize: blob.size,
          duration: recordingTime,
          chunks: chunks.length
        });
        setAudioBlob(blob);
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.onerror = (event) => {
        logStep("MediaRecorder error", event);
        toast({
          title: "Erro de Gravação",
          description: "Falha durante a gravação",
          variant: "destructive"
        });
      };
      
      mediaRecorder.start(1000); // Coletar dados a cada segundo
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setRecordingTime(0);
      
      // Timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 300) { // 5 minutos max
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
      
      logStep("Recording started successfully");
      
    } catch (error) {
      logStep("Failed to start recording", { error: error.message });
      
      let errorMessage = "Erro ao iniciar gravação";
      if (error.message.includes("Permission denied") || error.message.includes("NotAllowedError")) {
        errorMessage = "Permissão de microfone negada. Verifique as configurações do navegador.";
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
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
    if (!audioBlob) return;
    
    logStep("Starting transcription", { blobSize: audioBlob.size });
    setIsProcessing(true);
    
    try {
      // Validações
      if (audioBlob.size > 25 * 1024 * 1024) {
        throw new Error("Arquivo muito grande (máx: 25MB)");
      }

      if (audioBlob.size < 1000) {
        throw new Error("Gravação muito pequena. Tente novamente.");
      }

      // Converter para base64
      const base64Audio = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Erro ao processar áudio"));
        reader.readAsDataURL(audioBlob);
      });
      
      logStep("Audio converted to base64", { 
        originalSize: audioBlob.size,
        base64Length: base64Audio.length 
      });
      
      const { data, error } = await supabase.functions.invoke('transcribe-audio', {
        body: { audio: base64Audio }
      });
      
      logStep("Transcription response", { hasData: !!data, hasError: !!error });
      
      if (error) {
        throw new Error(`Erro na transcrição: ${error.message}`);
      }
      
      if (!data?.success) {
        throw new Error(data?.error || "Falha na transcrição");
      }
      
      if (!data.transcribed_text) {
        throw new Error("Nenhum texto foi transcrito");
      }
      
      logStep("Transcription successful", { 
        textLength: data.transcribed_text.length 
      });
      
      onTranscriptionComplete(data.transcribed_text);
      setAudioBlob(null);
      setRecordingTime(0);
      
      toast({
        title: "Sucesso",
        description: "Áudio transcrito com sucesso!",
      });
      
    } catch (error) {
      logStep("Transcription failed", { error: error.message });
      
      toast({
        title: "Erro na Transcrição",
        description: error.message,
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
    const sizeKB = Math.round(audioBlob.size / 1024);
    
    return (
      <div className="flex items-center gap-2 p-3 bg-muted rounded-lg border">
        <div className="flex-1">
          <div className="text-sm font-medium">
            Gravação de {formatTime(recordingTime)}
          </div>
          <div className="text-xs text-muted-foreground">
            {sizeKB}KB • {audioBlob.type}
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

  // Interface durante gravação
  if (isRecording) {
    return (
      <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
        <div className="flex items-center gap-2 flex-1">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-sm text-red-700 dark:text-red-300 font-medium">
            Gravando... {formatTime(recordingTime)}
          </span>
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

  // Botão inicial
  return (
    <Button
      size="icon"
      variant="outline"
      onClick={startRecording}
      disabled={disabled}
      className="h-10 w-10"
    >
      <Mic className="h-4 w-4" />
    </Button>
  );
};

export default AudioRecorder;
