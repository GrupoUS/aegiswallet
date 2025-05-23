
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";

const AIAssistantFAB = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Hide FAB on chat page itself
  if (location.pathname === '/chat') {
    return null;
  }

  return (
    <Button
      onClick={() => navigate("/chat")}
      className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 bg-primary hover:bg-primary/90"
      size="icon"
    >
      <MessageSquare className="h-6 w-6" />
      <span className="sr-only">Abrir Chat IA</span>
    </Button>
  );
};

export default AIAssistantFAB;
