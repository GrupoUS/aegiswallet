import { Brain, Mic, Settings } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface ChatSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  enableVoice?: boolean;
  onVoiceToggle?: (enabled: boolean) => void;
  enableReasoning?: boolean;
  onReasoningToggle?: (enabled: boolean) => void;
}

export function ChatSettings({
  open,
  onOpenChange,
  enableVoice = true,
  onVoiceToggle,
  enableReasoning = false,
  onReasoningToggle,
}: ChatSettingsProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            Configurações do Chat
          </DialogTitle>
          <DialogDescription>
            Personalize sua experiência com o assistente IA
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Voice Input Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mic className="w-5 h-5 text-muted-foreground" />
              <div className="space-y-0.5">
                <Label htmlFor="voice-input" className="text-sm font-medium">
                  Entrada por voz
                </Label>
                <p className="text-xs text-muted-foreground">
                  Permite comandos de voz no chat
                </p>
              </div>
            </div>
            <Switch
              id="voice-input"
              checked={enableVoice}
              onCheckedChange={onVoiceToggle}
            />
          </div>

          {/* Reasoning View Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain className="w-5 h-5 text-muted-foreground" />
              <div className="space-y-0.5">
                <Label htmlFor="reasoning-view" className="text-sm font-medium">
                  Exibir raciocínio da IA
                </Label>
                <p className="text-xs text-muted-foreground">
                  Mostra o processo de pensamento da IA
                </p>
              </div>
            </div>
            <Switch
              id="reasoning-view"
              checked={enableReasoning}
              onCheckedChange={onReasoningToggle}
            />
          </div>

          {/* Future settings can be added here */}
        </div>
      </DialogContent>
    </Dialog>
  );
}
