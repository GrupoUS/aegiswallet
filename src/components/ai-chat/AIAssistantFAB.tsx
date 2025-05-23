
import { MessageSquare, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AIAssistantFABProps {
  onToggleChat: () => void;
}

const AIAssistantFAB = ({ onToggleChat }: AIAssistantFABProps) => {
  return (
    <Button
      onClick={onToggleChat}
      className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 bg-primary hover:bg-primary/90"
      size="icon"
    >
      <MessageSquare className="h-6 w-6" />
      <span className="sr-only">Alternar Chat IA</span>
    </Button>
  );
};

export default AIAssistantFAB;
