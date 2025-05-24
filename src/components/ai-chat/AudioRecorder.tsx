
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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      const chunks: BlobPart[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error("Error starting recording:", error);
      toast({
        title: "Erro",
        description: "Não foi possível acessar o microfone. Verifique as permissões.",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
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
    setAudioBlob(null);
    setRecordingTime(0);
  };

  const sendRecording = async () => {
    if (!audioBlob) return;
    
    setIsProcessing(true);
    
    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;
        
        try {
          const { data, error } = await supabase.functions.invoke('transcribe-audio', {
            body: { audio: base64Audio }
          });
          
          if (error) throw error;
          
          if (data.text) {
            onTranscriptionComplete(data.text);
            setAudioBlob(null);
            setRecordingTime(0);
            toast({
              title: "Sucesso",
              description: "Áudio transcrito com sucesso!",
              variant: "default"
            });
          } else {
            throw new Error("Nenhuma transcrição retornada");
          }
        } catch (error) {
          console.error("Error transcribing audio:", error);
          toast({
            title: "Erro",
            description: "Não foi possível transcrever o áudio. Tente novamente.",
            variant: "destructive"
          });
        } finally {
          setIsProcessing(false);
        }
      };
      
      reader.readAsDataURL(audioBlob);
    } catch (error) {
      console.error("Error processing audio:", error);
      setIsProcessing(false);
      toast({
        title: "Erro",
        description: "Erro ao processar áudio.",
        variant: "destructive"
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (audioBlob) {
    return (
      <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
        <div className="flex-1 text-sm">
          Gravação de {formatTime(recordingTime)} pronta
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

  if (isRecording) {
    return (
      <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
        <div className="flex items-center gap-2 flex-1">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-sm text-red-700 dark:text-red-300">
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

  return (
    <Button
      size="icon"
      variant="outline"
      onClick={startRecording}
      disabled={disabled}
      className="h-10 w-10"
    >
      <Mic className="h-4 w-4" />
      <span className="sr-only">Gravar áudio</span>
    </Button>
  );
};

export default AudioRecorder;
