import { Check, ChevronDown, Zap, DollarSign } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { MODEL_OPTIONS, type GeminiModel } from '../config/models';

interface ModelSelectorProps {
  selectedModel: GeminiModel;
  onModelChange: (model: GeminiModel) => void;
  className?: string;
}

export function ModelSelector({ selectedModel, onModelChange, className }: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const currentModel = MODEL_OPTIONS.find((m) => m.id === selectedModel);

  const getSpeedIcon = (speed: string) => {
    switch (speed) {
      case 'fastest':
      case 'fast':
        return <Zap className="w-3 h-3 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getCostIcon = (cost: string) => {
    switch (cost) {
      case 'lowest':
      case 'low':
        return <DollarSign className="w-3 h-3 text-green-500" />;
      default:
        return <DollarSign className="w-3 h-3 text-muted-foreground" />;
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn('h-8 justify-between min-w-[200px]', className)}
        >
          <span className="text-xs truncate">{currentModel?.name || 'Select Model'}</span>
          <ChevronDown className="w-3 h-3 ml-2 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[280px]">
        <DropdownMenuLabel className="text-xs">Escolher Modelo</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {MODEL_OPTIONS.map((model) => (
          <DropdownMenuItem
            key={model.id}
            onClick={() => {
              onModelChange(model.id);
              setOpen(false);
            }}
            className="flex flex-col items-start py-3 cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{model.name}</span>
                {selectedModel === model.id && <Check className="w-4 h-4 text-primary" />}
              </div>
              <div className="flex items-center gap-1">
                {getSpeedIcon(model.speed)}
                {getCostIcon(model.cost)}
              </div>
            </div>
            <span className="text-xs text-muted-foreground mt-1">{model.description}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
